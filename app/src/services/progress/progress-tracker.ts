import { getIsOnline } from '@/services/offline';

import type { BlockAnchor } from './anchor';
import { postProgressBatch, type ProgressEntry, sendProgressBeacon } from './api';
import { mergeProgressEntries, progressOutbox } from './outbox';

/**
 * Per-file unflushed state held by the tracker.
 *
 * `secondsDelta` accumulates active reading seconds since the last successful
 * flush. Position fields (`sectionIndex`, `scrollPct`) hold the latest known
 * values — server-side last-write-wins makes a single in-memory copy fine.
 *
 * `anchor` is the topmost visible block in scroll mode. Sticky across flushes:
 * once set, the tracker keeps sending it (which the server upserts) so card
 * mode flushes don't wipe the last known scroll-mode anchor.
 */
interface PendingState {
  fileId: string;
  sectionIndex: number;
  scrollPct: number;
  secondsDelta: number;
  completed: boolean;
  anchor: BlockAnchor | null;
  /** True until either the position or seconds have been flushed at least once. */
  dirty: boolean;
}

const FLUSH_INTERVAL_MS = 15_000;
const TICK_MS = 1_000;
const IDLE_TIMEOUT_MS = 60_000;

/**
 * Singleton that accrues active reading time per file and flushes batches to
 * the server. Intentionally module-scoped (not React state) because:
 *
 * - it must outlive component remounts (tab switches),
 * - it ticks once per second regardless of which component is currently mounted,
 * - and the `beforeunload` hook needs to read the latest pending state without
 *   chasing a React render.
 */
class ProgressTracker {
  private pending = new Map<string, PendingState>();
  private activeFileId: string | null = null;
  private lastInteractionAt = Date.now();
  private started = false;

  /** Initialise listeners and timers. Idempotent. */
  start(): void {
    if (this.started || typeof window === 'undefined') return;
    this.started = true;

    setInterval(() => this.tick(), TICK_MS);
    setInterval(() => {
      void this.flush();
    }, FLUSH_INTERVAL_MS);

    const interaction = () => {
      this.lastInteractionAt = Date.now();
    };
    ['keydown', 'pointerdown', 'wheel', 'touchstart'].forEach((evt) =>
      window.addEventListener(evt, interaction, { passive: true })
    );

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        void this.flush();
      } else {
        this.lastInteractionAt = Date.now();
      }
    });

    window.addEventListener('beforeunload', () => this.flushSync());
    window.addEventListener('pagehide', () => this.flushSync());
  }

  track(fileId: string, sectionIndex: number, scrollPct: number): void {
    this.activeFileId = fileId;
    this.lastInteractionAt = Date.now();
    const existing = this.pending.get(fileId);

    if (!existing) {
      this.pending.set(fileId, {
        fileId,
        sectionIndex,
        scrollPct,
        secondsDelta: 0,
        completed: false,
        anchor: null,
        dirty: true,
      });
      return;
    }

    existing.sectionIndex = sectionIndex;
    existing.scrollPct = scrollPct;
    if (this.hasPosChanged(existing.scrollPct, scrollPct, existing.sectionIndex, sectionIndex)) {
      existing.dirty = true;
    }
  }

  /**
   * Record the topmost visible block for a file. Called by the scroll-mode
   * block observer; ignored when the tracker has no pending state for the
   * file yet (the next `track()` will initialise it).
   */
  setAnchor(fileId: string, anchor: BlockAnchor): void {
    const existing = this.pending.get(fileId);
    if (!existing) return;
    if (anchorEquals(existing.anchor, anchor)) return;
    existing.anchor = anchor;
    existing.dirty = true;
  }

  /**
   * Determine if a position change has occurred between two progress states.
   *
   * This checks for a significant scroll percent change (above a threshold) or
   * a change in section index.
   */
  private hasPosChanged(
    current: number,
    previous: number,
    currentIndex: number,
    previousIndex: number
  ): boolean {
    return Math.abs(current - previous) > 0.001 || currentIndex !== previousIndex;
  }

  /** Mark the active file as complete on the next flush. */
  markCompleted(fileId: string): void {
    const existing = this.pending.get(fileId);
    if (existing) {
      existing.completed = true;
      existing.dirty = true;
    }
  }

  /** Stop accruing seconds against the given file (e.g. tab closed/changed). */
  blur(fileId: string): void {
    if (this.activeFileId === fileId) {
      this.activeFileId = null;
    }
  }

  /**
   * Increments the active file's `secondsDelta` counter if tracking should occur.
   *
   * This method is called every second by an internal timer.
   *
   * - Does nothing if no file is currently active
   * - Ignores ticks if the document is hidden (i.e. not visible to user)
   * - Ignores ticks if the user is idle (no interaction in >IDLE_TIMEOUT_MS)
   * - Otherwise increments secondsDelta and marks file as 'dirty'
   */
  private tick(): void {
    if (!this.activeFileId) return;
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
    if (Date.now() - this.lastInteractionAt > IDLE_TIMEOUT_MS) return;

    const state = this.pending.get(this.activeFileId);
    if (state) {
      state.secondsDelta += 1;
      state.dirty = true;
    }
  }

  /**
   * Collects a batch of progress entries that have been marked as 'dirty'.
   *
   * Iterates over all pending progress states and builds an array of entries
   * to be sent to the backend. Only includes entries where state.dirty is true,
   * meaning a meaningful change has occurred since the last flush.
   *
   * @returns ProgressEntry[] An array of progress entries to post/flush.
   */
  private collectBatch(): ProgressEntry[] {
    const entries: ProgressEntry[] = [];
    for (const state of this.pending.values()) {
      if (!state.dirty) continue;
      const entry: ProgressEntry = {
        file_id: state.fileId,
        section_index: state.sectionIndex,
        scroll_pct: state.scrollPct,
        seconds_delta: state.secondsDelta,
        completed: state.completed || undefined,
      };
      if (state.anchor) {
        entry.anchor_heading_path = state.anchor.heading_path;
        entry.anchor_block_offset = state.anchor.block_offset;
        entry.anchor_block_tag = state.anchor.block_tag;
        entry.anchor_block_hash = state.anchor.content_hash;
      }
      entries.push(entry);
    }
    return entries;
  }

  private resetAfterFlush(): void {
    for (const state of this.pending.values()) {
      state.secondsDelta = 0;
      state.completed = false;
      state.dirty = false;
    }
  }

  /**
   * Flush dirty progress entries to the API using the normal async request path.
   *
   * Called by the periodic timer and when the page is backgrounded.
   *
   * - No-ops when the user is unauthenticated (no auth token)
   * - No-ops when there are no dirty entries to send
   * - Hands the batch to the offline outbox instead of the network when the
   *   device is offline, so it survives the tab closing
   * - Replays anything the outbox is holding alongside the current batch
   * - Resets local dirty/seconds/completion flags only after a successful post
   * - Leaves pending state intact on failure so the next flush can retry
   */
  async flush(): Promise<void> {
    if (!hasToken()) return;
    const batch = this.collectBatch();

    if (!getIsOnline()) {
      this.parkOffline(batch);
      return;
    }

    const entries = mergeProgressEntries(progressOutbox.read(), batch);
    if (entries.length === 0) return;

    try {
      await postProgressBatch(entries);
      progressOutbox.clear();
      this.resetAfterFlush();
    } catch (err) {
      console.error('[progress-tracker] flush failed:', err);
    }
  }

  /**
   * Sync flush during page unload: `fetch + keepalive` while online, the
   * durable outbox while offline. Either way the pending state is considered
   * handed off, so nothing is counted twice on the next flush.
   */
  flushSync(): void {
    if (!hasToken()) return;
    const batch = this.collectBatch();

    if (!getIsOnline()) {
      this.parkOffline(batch);
      return;
    }

    const entries = mergeProgressEntries(progressOutbox.read(), batch);
    if (entries.length === 0) return;
    sendProgressBeacon(entries);
    progressOutbox.clear();
    this.resetAfterFlush();
  }

  /**
   * Moves a batch into the outbox and clears the in-memory deltas.
   *
   * Ownership transfers with the batch: the outbox now holds those seconds, so
   * resetting here is what stops a later online flush from sending them twice.
   */
  private parkOffline(batch: ProgressEntry[]): void {
    if (batch.length === 0) return;
    progressOutbox.add(batch);
    this.resetAfterFlush();
  }
}

/** Reads the persisted JWT, tolerating environments with no `localStorage`. */
function hasToken(): boolean {
  return typeof localStorage !== 'undefined' && !!localStorage.getItem('mdhd-auth-token');
}

function anchorEquals(a: BlockAnchor | null, b: BlockAnchor | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (
    a.block_offset !== b.block_offset ||
    a.block_tag !== b.block_tag ||
    a.content_hash !== b.content_hash
  ) {
    return false;
  }
  if (a.heading_path.length !== b.heading_path.length) return false;
  for (let i = 0; i < a.heading_path.length; i++) {
    if (a.heading_path[i] !== b.heading_path[i]) return false;
  }
  return true;
}

export const progressTracker = new ProgressTracker();
