import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import { patch, patchById, patchNested } from '@/lib/store-utils';
import { savePastedContent, updateSavedContent } from '@/services/files/save-content';
import { fileStorageDB } from '@/services/indexeddb/file-db';
import { parseMarkdownIntoSections } from '@/services/section/parsing';

import { createBookmarkSlice } from './bookmark-slice';
import { createTab, extractTitleFromMarkdown, hashString } from './helpers';
import { customTabsStorage, type PersistedTabsState } from './storage';
import type { Tab, TabReadingState, TabsActions, TabsState } from './types';

const STORAGE_VERSION = 1;
const STORAGE_KEY = 'mdhd-tabs-storage';

/**
 * Tabs Store
 *
 * Manages multiple tabs with individual reading states.
 * Supports persistence to localStorage.
 */
export const useTabsStore = create<TabsState & TabsActions>()(
  devtools(
    persist(
      (set, get, api) => ({
        tabs: [],
        activeTabId: null,
        showEmptyState: true,
        version: STORAGE_VERSION,
        _hasHydrated: false,
        untitledCounter: 0,
        isHeaderVisible: true,
        isStatusBarVisible: true,

        addTab: (newTab: Tab, options?: { incrementCounter?: boolean }) => {
          set((state) => ({
            tabs: [...state.tabs, newTab],
            activeTabId: newTab.id,
            showEmptyState: false,
            ...(options?.incrementCounter ? { untitledCounter: state.untitledCounter + 1 } : {}),
          }));
          return newTab.id;
        },

        updateTab: (tabId: string, updater: Partial<Tab> | ((tab: Tab) => Partial<Tab>)) => {
          set((state) => ({
            tabs: patchById(state.tabs, 'id', tabId, updater),
          }));
        },

        createTab: (
          content: string,
          title?: string,
          sourceFileId?: string,
          sourcePath?: string
        ) => {
          const resolvedTitle = title || extractTitleFromMarkdown(content);

          const newTab = createTab(content, resolvedTitle, {
            fileID: sourceFileId,
            path: sourcePath,
          });

          return get().addTab(newTab);
        },

        createFromPaste: async (content: string, title?: string) => {
          const trimmed = content.trim();
          if (!trimmed) return null;

          try {
            const file = await savePastedContent(content);
            const resolvedTitle = title || extractTitleFromMarkdown(content) || file.name;
            const tabId = get().createTab(content, resolvedTitle, file.id, file.path);

            // Refresh the file explorer tree so the new file appears immediately.
            // Dynamic import avoids a static cycle between tabs-store and file-store.
            import('@/components/features/file-explorer/store/file-store')
              .then(({ useFileStore }) => useFileStore.getState().refreshFileTree())
              .catch((err) =>
                console.error('[tabs-store] Failed to refresh file tree after paste:', err)
              );

            return tabId;
          } catch (err) {
            console.error('[tabs-store] Failed to save pasted content:', err);
            return null;
          }
        },

        createUntitledTab: () => {
          const { untitledCounter } = get();
          const title = untitledCounter === 0 ? 'Untitled' : `Untitled-${untitledCounter}`;
          return get().addTab(createTab('', title), { incrementCounter: true });
        },

        setTabsState: (tabs: Tab[], activeTabId: string | null, showEmptyState: boolean) => {
          set({ tabs, activeTabId, showEmptyState });
        },

        setActiveTab: (tabId: string) => {
          const tab = get().tabs.find((t) => t.id === tabId);
          if (!tab) return;

          get().updateTab(tabId, { lastAccessedAt: Date.now() });

          set({
            activeTabId: tabId,
            showEmptyState: false,
          });

          const isAuthenticated = !!localStorage.getItem('mdhd-auth-token');
          if (isAuthenticated && tab.sourceFileId) {
            const fileId = tab.sourceFileId;
            import('@/services/bookmarks').then(({ fetchBookmarks, toLocalBookmark }) =>
              fetchBookmarks(fileId)
                .then((bms) => get().setBookmarks(tabId, bms.map(toLocalBookmark)))
                .catch((err) => console.error('[tabs-store] Failed to load bookmarks:', err))
            );
          }
        },

        updateTabReadingState: (tabId: string, newReadingState: Partial<TabReadingState>) => {
          get().updateTab(tabId, (tab) => ({
            readingState: patch(tab.readingState, newReadingState),
          }));
        },

        updateTabContent: (tabId: string, content: string) => {
          set((state) => ({
            tabs: patchById(state.tabs, 'id', tabId, (t) => {
              const { metadata, sections } = content
                ? parseMarkdownIntoSections(content)
                : { metadata: null, sections: [] };
              return {
                content,
                contentHash: hashString(content),
                title: extractTitleFromMarkdown(content),
                // Preserve viewMode and readingMode; reset position
                readingState: patch(t.readingState, {
                  sections,
                  isInitialized: sections.length > 0,
                  currentIndex: 0,
                  readSections: new Set([0]),
                  scrollProgress: 0,
                }),
                metadata,
              };
            }),
          }));

          const tab = get().tabs.find((t) => t.id === tabId);
          if (tab?.sourceFileId) {
            updateSavedContent(tab.sourceFileId, tab.content).catch((err) =>
              console.error('[tabs-store] Failed to persist tab content update:', err)
            );
          }
        },

        getTabById: (tabId: string) => {
          return get().tabs.find((t) => t.id === tabId);
        },

        setShowEmptyState: (show: boolean) => {
          set({ showEmptyState: show });
        },

        findTabByFileId: (fileId: string) => {
          return get().tabs.find((t) => t.sourceFileId === fileId);
        },

        pinTab: (tabId: string) => {
          get().updateTab(tabId, { pinned: true });
        },

        unpinTab: (tabId: string) => {
          get().updateTab(tabId, { pinned: false });
        },

        duplicateTab: (tabId: string) => {
          const state = get();
          const tab = state.tabs.find((t) => t.id === tabId);
          if (!tab) return null;

          const tabIndex = state.tabs.findIndex((t) => t.id === tabId);
          // A duplicated tab gets its own identity but no longer points at the
          // source file — otherwise edits in the copy would write back to the
          // original. The copy is unsaved until explicitly persisted.
          const newTab: Tab = {
            ...tab,
            id: crypto.randomUUID(),
            title: `${tab.title} (copy)`,
            createdAt: Date.now(),
            lastAccessedAt: Date.now(),
            pinned: false,
            sourceFileId: undefined,
            sourcePath: undefined,
            readingState: { ...tab.readingState },
          };

          set((s) => {
            const newTabs = [...s.tabs];
            newTabs.splice(tabIndex + 1, 0, newTab);
            return { tabs: newTabs, activeTabId: newTab.id, showEmptyState: false };
          });

          return newTab.id;
        },

        updateTabPath: (fileId: string, newPath: string, newTitle: string) => {
          set((state) => ({
            tabs: state.tabs.map((t) => {
              if (t.sourceFileId !== fileId) return t;
              return { ...t, sourcePath: newPath, title: newTitle };
            }),
          }));
        },

        ...createBookmarkSlice(set, get, api),

        toggleHeaderVisibility: () => {
          set((state) => ({
            isHeaderVisible: !state.isHeaderVisible,
          }));
        },

        toggleStatusBarVisibility: () => {
          set((state) => ({
            isStatusBarVisible: !state.isStatusBarVisible,
          }));
        },

        initializeTabSections: () => {
          set((state) => ({
            tabs: state.tabs.map((t) => {
              if (t.readingState.isInitialized || !t.content) return t;
              const { metadata, sections } = parseMarkdownIntoSections(t.content);
              return patchNested(t, 'readingState', {
                sections,
                metadata,
                isInitialized: sections.length > 0,
              });
            }),
          }));
        },
      }),
      {
        name: STORAGE_KEY,
        storage: customTabsStorage,
        partialize: ({
          tabs,
          activeTabId,
          showEmptyState,
          version,
          untitledCounter,
          isHeaderVisible,
          isStatusBarVisible,
        }) =>
          ({
            tabs,
            activeTabId,
            showEmptyState,
            version,
            untitledCounter,
            isHeaderVisible,
            isStatusBarVisible,
          }) as unknown as PersistedTabsState,
        version: STORAGE_VERSION,
        onRehydrateStorage: () => (state, error) => {
          if (error) {
            console.error('Error rehydrating tabs session:', error);
          } else if (state) {
            state._hasHydrated = true;

            if (state.tabs.some((t) => t.content && !t.readingState.isInitialized)) {
              setTimeout(() => {
                useTabsStore.getState().initializeTabSections();
              }, 0);
            }

            const tabsNeedingContent = state.tabs.filter((t) => !t.content && t.sourceFileId);
            if (tabsNeedingContent.length > 0) {
              Promise.all(
                tabsNeedingContent.map(async (tab) => {
                  try {
                    const file = tab.sourceFileId
                      ? await fileStorageDB.getFile(tab.sourceFileId)
                      : null;
                    return { tabId: tab.id, content: file?.content ?? null };
                  } catch (err) {
                    console.error(`[tabs-store] Failed to load content for tab ${tab.id}:`, err);
                    return { tabId: tab.id, content: null };
                  }
                })
              )
                .then((results) => {
                  useTabsStore.setState((prev) => ({
                    tabs: prev.tabs.map((t) => {
                      const result = results.find((r) => r.tabId === t.id);
                      if (!result?.content) return t;

                      const { metadata, sections } = parseMarkdownIntoSections(result.content);
                      return patch(t, {
                        content: result.content,
                        contentHash: hashString(result.content),
                        readingState: patch(t.readingState, {
                          sections,
                          metadata,
                          isInitialized: sections.length > 0,
                        }),
                      });
                    }),
                  }));
                })
                .catch((err) => {
                  console.error('[tabs-store] Tab rehydration failed:', err);
                });
            }
          }
        },
      }
    ),
    {
      name: 'tabs-store',
    }
  )
);
