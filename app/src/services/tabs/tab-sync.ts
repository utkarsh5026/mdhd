import { extractTitleFromMarkdown, hashString } from '@/components/features/tabs/store/helpers';
import { useTabsStore } from '@/components/features/tabs/store/tabs-store';
import type { Tab } from '@/components/features/tabs/store/types';
import { fileStorageDB } from '@/services/indexeddb/file-db';
import { parseMarkdownIntoSections } from '@/services/section/parsing';

import { fetchTabs, putTabs, type ServerTab, type TabEntry } from './api';

const PUSH_DEBOUNCE_MS = 2_000;

/**
 * Cross-device tab sync.
 *
 * Pulls the user's open tabs once on start and pushes any local change
 * (open / close / reorder / activate / pin) on a debounced timer. Only
 * file-backed tabs participate — unsaved tabs have no durable identity.
 *
 * Server is the source of truth at startup (so a new device sees the same
 * working set); after that the local store wins via last-write-wins. The
 * `lastPushedSignature` guard prevents the first store change after a pull
 * from echoing back to the server.
 */
class TabSync {
  private started = false;
  private pushTimer: ReturnType<typeof setTimeout> | null = null;
  private unsubscribe: (() => void) | null = null;
  private lastPushedSignature = '';

  start(): void {
    if (this.started || typeof window === 'undefined') return;
    this.started = true;

    void this.pullThenSubscribe();
  }

  /** Re-pull from the server (e.g. after login). Resets the push guard. */
  async refresh(): Promise<void> {
    if (!this.isAuthed()) return;
    await this.pull();
  }

  private async pullThenSubscribe(): Promise<void> {
    if (this.isAuthed()) {
      try {
        await this.pull();
      } catch (err) {
        console.error('[tab-sync] initial pull failed:', err);
      }
    }
    this.subscribe();
  }

  private subscribe(): void {
    if (this.unsubscribe) return;
    this.unsubscribe = useTabsStore.subscribe((state, prev) => {
      if (!this.isAuthed()) return;
      if (!this.tabIdentityChanged(state.tabs, prev.tabs, state.activeTabId, prev.activeTabId)) {
        return;
      }
      this.schedulePush();
    });
  }

  /**
   * True when the set, order, active flag, or pinned flag of file-backed tabs
   * has changed. Reading-state ticks (currentIndex, scrollProgress, etc.) are
   * intentionally ignored — those go through the progress sync path.
   */
  private tabIdentityChanged(
    next: Tab[],
    prev: Tab[],
    nextActive: string | null,
    prevActive: string | null
  ): boolean {
    return this.snapshotSignature(next, nextActive) !== this.snapshotSignature(prev, prevActive);
  }

  private schedulePush(): void {
    if (this.pushTimer) clearTimeout(this.pushTimer);
    this.pushTimer = setTimeout(() => {
      this.pushTimer = null;
      void this.push();
    }, PUSH_DEBOUNCE_MS);
  }

  private snapshotSignature(tabs: Tab[], activeTabId: string | null): string {
    return this.buildEntries(tabs, activeTabId)
      .map((e) => `${e.file_id}:${e.position}:${e.is_active ? 1 : 0}:${e.pinned ? 1 : 0}`)
      .join('|');
  }

  private buildEntries(tabs: Tab[], activeTabId: string | null): TabEntry[] {
    return tabs
      .filter((t) => !!t.sourceFileId)
      .map((tab, index) => {
        return {
          file_id: tab.sourceFileId!,
          position: index,
          is_active: tab.id === activeTabId,
          pinned: !!tab.pinned,
        };
      });
  }

  private async push(): Promise<void> {
    if (!this.isAuthed()) return;
    const state = useTabsStore.getState();
    const entries = this.buildEntries(state.tabs, state.activeTabId);
    const signature = entries
      .map((e) => `${e.file_id}:${e.position}:${e.is_active ? 1 : 0}:${e.pinned ? 1 : 0}`)
      .join('|');
    if (signature === this.lastPushedSignature) return;
    try {
      await putTabs(entries);
      this.lastPushedSignature = signature;
    } catch (err) {
      console.error('[tab-sync] push failed:', err);
    }
  }

  /**
   * Replace local file-backed tabs with the server's set (additive merge:
   * preserve existing local tabs that already point at the same file, in the
   * server's order; drop file-backed tabs the server doesn't know about).
   * Skips server tabs whose file isn't present locally yet — those will appear
   * after the file sync flow brings the content into IndexedDB.
   */
  private async pull(): Promise<void> {
    const serverTabs = await fetchTabs();
    if (serverTabs.length === 0) {
      // Nothing to merge — but record the empty signature so the next change
      // is recognised as a real edit, not a phantom one.
      const state = useTabsStore.getState();
      this.lastPushedSignature = this.snapshotSignature(state.tabs, state.activeTabId);
      return;
    }

    const ordered = [...serverTabs].sort((a, b) => a.position - b.position);
    const mergedTabs: Tab[] = [];
    let activeTabId: string | null = null;

    const state = useTabsStore.getState();
    const localFileBacked = new Map<string, Tab>();
    for (const t of state.tabs) {
      if (t.sourceFileId) {
        localFileBacked.set(t.sourceFileId, t);
      }
    }

    for (const server of ordered) {
      const local = localFileBacked.get(server.file_id);
      if (local) {
        const next = { ...local, pinned: server.pinned };
        mergedTabs.push(next);
        if (server.is_active) activeTabId = next.id;
        continue;
      }
      const created = await this.materializeFromServer(server);
      if (created) {
        mergedTabs.push(created);
        if (server.is_active) activeTabId = created.id;
      }
    }

    // Keep unsaved tabs as-is — they're local-only.
    const localOnlyTabs = state.tabs.filter((t) => !t.sourceFileId);
    const finalTabs = [...mergedTabs, ...localOnlyTabs];

    // If nothing changed, skip the setState to avoid waking subscribers.
    const localSig = this.snapshotSignature(state.tabs, state.activeTabId);
    const nextSig = this.snapshotSignature(finalTabs, activeTabId ?? state.activeTabId);
    if (localSig === nextSig && finalTabs.length === state.tabs.length) {
      this.lastPushedSignature = nextSig;
      return;
    }

    state.setTabsState(finalTabs, activeTabId ?? state.activeTabId, finalTabs.length === 0);
    this.lastPushedSignature = nextSig;
  }

  private async materializeFromServer(server: ServerTab): Promise<Tab | null> {
    try {
      const file = await fileStorageDB.getFile(server.file_id);
      if (!file) return null;
      const content = file.content ?? '';
      const { metadata, sections } = content
        ? parseMarkdownIntoSections(content)
        : { metadata: null, sections: [] };
      const title = file.name.replace(/\.md$/, '') || extractTitleFromMarkdown(content);
      const now = Date.now();
      return {
        id: crypto.randomUUID(),
        title,
        content,
        contentHash: hashString(content),
        sourceFileId: file.id,
        sourcePath: file.path,
        createdAt: now,
        lastAccessedAt: now,
        pinned: server.pinned,
        readingState: {
          currentIndex: 0,
          readSections: new Set([0]),
          scrollProgress: 0,
          readingMode: 'card',
          viewMode: 'preview',
          sections,
          isInitialized: sections.length > 0,
          metadata,
        },
      };
    } catch (err) {
      console.error('[tab-sync] failed to materialize tab from server:', err);
      return null;
    }
  }

  private isAuthed(): boolean {
    return typeof localStorage !== 'undefined' && !!localStorage.getItem('mdhd-auth-token');
  }
}

export const tabSync = new TabSync();
