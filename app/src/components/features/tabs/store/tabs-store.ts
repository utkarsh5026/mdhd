import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import { fileStorageDB } from '@/services/indexeddb/db';
import { parseMarkdownIntoSections } from '@/services/section/parsing';

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
      (set, get) => ({
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

        closeTab: (tabId: string) => {
          const state = get();
          const tabIndex = state.tabs.findIndex((t) => t.id === tabId);
          if (tabIndex === -1) return;

          const newTabs = state.tabs.filter((t) => t.id !== tabId);

          let newActiveTabId: string | null = null;
          if (newTabs.length > 0) {
            if (state.activeTabId === tabId) {
              const newIndex = Math.min(tabIndex, newTabs.length - 1);
              newActiveTabId = newTabs[newIndex].id;
            } else {
              newActiveTabId = state.activeTabId;
            }
          }

          set({
            tabs: newTabs,
            activeTabId: newActiveTabId,
            showEmptyState: newTabs.length === 0,
          });
        },

        closeAllTabs: () => {
          set({
            tabs: [],
            activeTabId: null,
            showEmptyState: true,
          });
        },

        closeOtherTabs: (tabId: string) => {
          const state = get();
          const tabToKeep = state.tabs.find((t) => t.id === tabId);
          if (!tabToKeep) return;

          set({
            tabs: [tabToKeep],
            activeTabId: tabId,
            showEmptyState: false,
          });
        },

        setActiveTab: (tabId: string) => {
          const tab = get().tabs.find((t) => t.id === tabId);
          if (!tab) return;

          get().updateTab(tabId, { lastAccessedAt: Date.now() });

          set({
            activeTabId: tabId,
            showEmptyState: false,
          });
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
        },

        updateTabSource: (
          tabId: string,
          sourceType: 'paste' | 'file',
          sourceFileId: string,
          sourcePath: string
        ) => {
          get().updateTab(tabId, { sourceType, sourceFileId, sourcePath });
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

        closeTabByFileId: (fileId: string) => {
          const state = get();
          const tab = state.tabs.find((t) => t.sourceFileId === fileId);
          if (tab) {
            state.closeTab(tab.id);
          }
        },

        closeTabsByPathPrefix: (pathPrefix: string) => {
          set((state) => {
            const newTabs = state.tabs.filter(
              (t) =>
                !t.sourcePath ||
                (t.sourcePath !== pathPrefix && !t.sourcePath.startsWith(pathPrefix + '/'))
            );
            const activeStillExists = newTabs.some((t) => t.id === state.activeTabId);
            return {
              tabs: newTabs,
              activeTabId: activeStillExists ? state.activeTabId : (newTabs[0]?.id ?? null),
              showEmptyState: newTabs.length === 0,
            };
          });
        },

        closeTabsToTheRight: (tabId: string) => {
          set((state) => {
            const tabIndex = state.tabs.findIndex((t) => t.id === tabId);
            if (tabIndex === -1) return state;

            const newTabs = state.tabs.slice(0, tabIndex + 1);
            const activeStillExists = newTabs.some((t) => t.id === state.activeTabId);
            return {
              tabs: newTabs,
              activeTabId: activeStillExists
                ? state.activeTabId
                : (newTabs[newTabs.length - 1]?.id ?? null),
              showEmptyState: newTabs.length === 0,
            };
          });
        },

        closeTabsToTheLeft: (tabId: string) => {
          set((state) => {
            const tabIndex = state.tabs.findIndex((t) => t.id === tabId);
            if (tabIndex === -1) return state;

            const newTabs = state.tabs.slice(tabIndex);
            const activeStillExists = newTabs.some((t) => t.id === state.activeTabId);
            return {
              tabs: newTabs,
              activeTabId: activeStillExists ? state.activeTabId : (newTabs[0]?.id ?? null),
              showEmptyState: newTabs.length === 0,
            };
          });
        },

        closeTabsBySourceType: (sourceType: 'paste' | 'file') => {
          set((state) => {
            const newTabs = state.tabs.filter((t) => t.sourceType !== sourceType);
            const activeStillExists = newTabs.some((t) => t.id === state.activeTabId);
            return {
              tabs: newTabs,
              activeTabId: activeStillExists ? state.activeTabId : (newTabs[0]?.id ?? null),
              showEmptyState: newTabs.length === 0,
            };
          });
        },

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

        clearPersistedTabs: () => {
          localStorage.removeItem(STORAGE_KEY);
          set({
            tabs: [],
            activeTabId: null,
            showEmptyState: true,
            version: STORAGE_VERSION,
            _hasHydrated: true,
          });
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

            const fileBackedTabs = state.tabs.filter(
              (t) => t.sourceType === 'file' && t.sourceFileId && !t.content
            );
            if (fileBackedTabs.length > 0) {
              Promise.all(
                fileBackedTabs.map(async (tab) => {
                  const file = await fileStorageDB.getFile(tab.sourceFileId!);
                  return { tabId: tab.id, content: file?.content ?? null };
                })
              ).then((results) => {
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
