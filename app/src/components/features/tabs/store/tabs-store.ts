import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import { fileStorageDB } from '@/services/indexeddb/file-db';
import { parseMarkdownIntoSections } from '@/services/section/parsing';
import { persistPaste } from '@/services/sync/paste-persistence';

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
          persistPaste(newTab.id, newTab.title, newTab.content);
          return newTab.id;
        },

        updateTab: (tabId: string, updater: Partial<Tab> | ((tab: Tab) => Partial<Tab>)) => {
          set((state) => ({
            tabs: state.tabs.map((t) => {
              if (t.id !== tabId) return t;

              const updates = typeof updater === 'function' ? updater(t) : updater;
              return { ...t, ...updates };
            }),
          }));
        },

        createTab: (
          content: string,
          title?: string,
          sourceType: 'paste' | 'file' = 'paste',
          sourceFileId?: string,
          sourcePath?: string
        ) => {
          const resolvedTitle = title || extractTitleFromMarkdown(content);

          const newTab = createTab(content, resolvedTitle, {
            fileID: sourceFileId,
            path: sourcePath,
            sType: sourceType,
          });

          return get().addTab(newTab);
        },

        createUntitledTab: () => {
          const { untitledCounter } = get();
          const title = untitledCounter === 0 ? 'Untitled' : `Untitled-${untitledCounter}`;
          const newTab = createTab('', title, { sType: 'paste' });

          return get().addTab(newTab, { incrementCounter: true });
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
          if (isAuthenticated && tab.sourceType === 'file' && tab.sourceFileId) {
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
            readingState: {
              ...tab.readingState,
              ...newReadingState,
            },
          }));
        },

        updateTabContent: (tabId: string, content: string) => {
          set((state) => ({
            tabs: state.tabs.map((t) => {
              if (t.id !== tabId) return t;

              const { metadata, sections } = content
                ? parseMarkdownIntoSections(content)
                : { metadata: null, sections: [] };
              return {
                ...t,
                content,
                contentHash: hashString(content),
                title: extractTitleFromMarkdown(content),
                readingState: {
                  ...t.readingState,
                  sections,
                  isInitialized: sections.length > 0,
                  currentIndex: 0,
                  readSections: new Set([0]),
                  scrollProgress: 0,
                  // Preserve viewMode and readingMode
                },
                metadata,
              };
            }),
          }));

          const tab = get().tabs.find((t) => t.id === tabId);
          if (tab) persistPaste(tab.id, tab.title, tab.content);
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
          const newTab: Tab = {
            ...tab,
            id: crypto.randomUUID(),
            title: `${tab.title} (copy)`,
            createdAt: Date.now(),
            lastAccessedAt: Date.now(),
            pinned: false,
            readingState: { ...tab.readingState },
          };

          set((s) => {
            const newTabs = [...s.tabs];
            newTabs.splice(tabIndex + 1, 0, newTab);
            return { tabs: newTabs, activeTabId: newTab.id, showEmptyState: false };
          });

          persistPaste(newTab.id, newTab.title, newTab.content);
          return newTab.id;
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
              return {
                ...t,
                readingState: {
                  ...t.readingState,
                  sections,
                  metadata,
                  isInitialized: sections.length > 0,
                },
              };
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

            const tabsNeedingContent = state.tabs.filter((t) => !t.content);
            if (tabsNeedingContent.length > 0) {
              Promise.all(
                tabsNeedingContent.map(async (tab) => {
                  try {
                    let content: string | null = null;
                    if (tab.sourceType === 'file' && tab.sourceFileId) {
                      const file = await fileStorageDB.getFile(tab.sourceFileId);
                      content = file?.content ?? null;
                    } else if (tab.sourceType === 'paste') {
                      const { pastePathForTab } = await import('@/services/sync/paste-persistence');
                      const file = await fileStorageDB.getFileByPath(pastePathForTab(tab.id));
                      content = file?.content ?? null;
                    }
                    return { tabId: tab.id, content };
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
                      return {
                        ...t,
                        content: result.content,
                        contentHash: hashString(result.content),
                        readingState: {
                          ...t.readingState,
                          sections,
                          metadata,
                          isInitialized: sections.length > 0,
                        },
                      };
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
