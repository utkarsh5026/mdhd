import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import { useFileStore } from '@/components/features/file-explorer';
import { useTabsStore } from '@/components/features/tabs/store/tabs-store';
import type { SyncResult } from '@/services/sync/types';

import { removePaste } from './paste-persistence';
import { performSettingsSync, performSync } from './sync-service';

/** Persistent and transient state for the cross-device sync process. */
interface SyncState {
  /** ISO 8601 timestamp of the last successful sync, persisted across sessions. */
  lastSyncAt: string | null;
  isSyncing: boolean;
  syncError: string | null;
  lastSyncResult: SyncResult | null;
}

/** Actions available on the sync store. */
interface SyncActions {
  /**
   * Triggers a full bidirectional sync: files, pastes, and settings.
   *
   * Guards against concurrent runs. On success, refreshes the file tree
   * and reconciles downloaded/deleted paste tabs. Only `lastSyncAt` is
   * persisted to localStorage; all other state resets on page load.
   */
  startSync: () => Promise<void>;
  /** Clears the current `syncError` without triggering a new sync. */
  clearError: () => void;
}

const useSyncStore = create<SyncState & SyncActions>()(
  devtools(
    persist(
      (set, get) => ({
        lastSyncAt: null,
        isSyncing: false,
        syncError: null,
        lastSyncResult: null,

        startSync: async () => {
          if (get().isSyncing) return;
          set({ isSyncing: true, syncError: null });

          try {
            const result = await performSync(get().lastSyncAt);

            await performSettingsSync().catch((err) => {
              console.error('Settings sync failed:', err);
            });

            set({
              isSyncing: false,
              lastSyncAt: result.serverTime,
              lastSyncResult: result,
              syncError: null,
            });

            if (result.downloaded > 0 || result.deleted > 0) {
              useFileStore.getState().refreshFileTree();
            }

            const tabsStore = useTabsStore.getState();

            result.downloadedPastes
              .filter((paste) => !tabsStore.getTabById(paste.tabId))
              .forEach((paste) => tabsStore.createTab(paste.content, paste.title, 'paste'));

            result.deletedPasteTabIds.forEach((id) => {
              const { tabs, activeTabId, setTabsState } = useTabsStore.getState();
              const tab = tabs.find((t) => t.id === id);
              if (!tab || tab.pinned) return;
              const tabIndex = tabs.indexOf(tab);
              const newTabs = tabs.filter((t) => t.id !== id);
              let newActiveTabId: string | null = null;
              if (newTabs.length > 0) {
                newActiveTabId =
                  activeTabId === id
                    ? newTabs[Math.min(tabIndex, newTabs.length - 1)].id
                    : activeTabId;
              }
              setTabsState(newTabs, newActiveTabId, newTabs.length === 0);
              removePaste(tab.id, tab.sourceType);
            });
          } catch (err) {
            set({
              isSyncing: false,
              syncError: err instanceof Error ? err.message : 'Sync failed',
            });
          }
        },

        clearError: () => set({ syncError: null }),
      }),
      { name: 'mdhd-sync', partialize: (s) => ({ lastSyncAt: s.lastSyncAt }) }
    ),
    { name: 'mdhd-sync' }
  )
);

/** Subscribes to whether a sync operation is currently in progress. */
export const useIsSyncing = () => useSyncStore((s) => s.isSyncing);

/** Subscribes to the ISO 8601 timestamp of the last successful sync. */
export const useLastSyncAt = () => useSyncStore((s) => s.lastSyncAt);

/** Subscribes to the current sync error message, if any. */
export const useSyncError = () => useSyncStore((s) => s.syncError);

/** Subscribes to the detailed result of the most recent sync. */
export const useLastSyncResult = () => useSyncStore((s) => s.lastSyncResult);

/**
 * Returns a stable reference to sync actions via `useShallow`,
 * preventing unnecessary re-renders when unrelated state changes.
 */
export const useSyncActions = () =>
  useSyncStore(
    useShallow((s) => ({
      startSync: s.startSync,
      clearError: s.clearError,
    }))
  );

export default useSyncStore;
