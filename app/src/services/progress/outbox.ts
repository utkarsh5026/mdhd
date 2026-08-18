import { tryCatch } from '@/utils/error';

import type { ProgressEntry } from './api';

/** `localStorage` key holding progress batches that never reached the server. */
const OUTBOX_KEY = 'mdhd-progress-outbox';

/**
 * Upper bound on stored entries. One entry per file read offline, so this is
 * generous; the cap only exists so a pathological run can't grow the key
 * without limit. Oldest entries are dropped first.
 */
const MAX_ENTRIES = 200;

/**
 * Folds `incoming` into `existing`, one entry per file.
 *
 * Reading seconds are a delta the server adds up, so they sum. Everything else
 * describes a position, where the newest reading wins — except `completed`,
 * which is sticky once earned.
 *
 * @param existing - Entries already queued, oldest first.
 * @param incoming - Newly collected entries.
 * @returns Merged entries, oldest first, capped at {@link MAX_ENTRIES}.
 */
export function mergeProgressEntries(
  existing: ProgressEntry[],
  incoming: ProgressEntry[]
): ProgressEntry[] {
  const byFile = new Map<string, ProgressEntry>();

  for (const entry of [...existing, ...incoming]) {
    const previous = byFile.get(entry.file_id);
    if (!previous) {
      byFile.set(entry.file_id, { ...entry });
      continue;
    }
    // Re-inserting would keep the first-seen position in the map's iteration
    // order; delete first so the merged entry sorts as the most recent.
    byFile.delete(entry.file_id);
    byFile.set(entry.file_id, {
      ...previous,
      ...entry,
      seconds_delta: previous.seconds_delta + entry.seconds_delta,
      completed: previous.completed || entry.completed || undefined,
    });
  }

  const merged = [...byFile.values()];
  return merged.length > MAX_ENTRIES ? merged.slice(merged.length - MAX_ENTRIES) : merged;
}

/**
 * Durable queue for reading progress captured while the device was offline.
 *
 * The in-memory tracker already retries within a session; this exists for the
 * session that *ends* offline — close the tab on a plane and the last stretch
 * of reading would otherwise be gone. Entries are replayed on the next
 * successful flush.
 *
 * Storage failures (private mode, quota) are swallowed: progress reporting must
 * never break reading.
 */
export const progressOutbox = {
  /** Returns the queued entries, oldest first. Empty when unavailable or corrupt. */
  read(): ProgressEntry[] {
    if (typeof localStorage === 'undefined') return [];
    const raw = tryCatch(() => localStorage.getItem(OUTBOX_KEY), null);
    if (!raw) return [];
    const parsed = tryCatch<ProgressEntry[] | null>(() => JSON.parse(raw) as ProgressEntry[], null);
    return Array.isArray(parsed) ? parsed.filter((entry) => !!entry?.file_id) : [];
  },

  /** Folds `entries` into the queue. */
  add(entries: ProgressEntry[]): void {
    if (entries.length === 0 || typeof localStorage === 'undefined') return;
    const merged = mergeProgressEntries(this.read(), entries);
    tryCatch(() => localStorage.setItem(OUTBOX_KEY, JSON.stringify(merged)), undefined);
  },

  /** Empties the queue after its entries have been accepted by the server. */
  clear(): void {
    if (typeof localStorage === 'undefined') return;
    tryCatch(() => localStorage.removeItem(OUTBOX_KEY), undefined);
  },
};
