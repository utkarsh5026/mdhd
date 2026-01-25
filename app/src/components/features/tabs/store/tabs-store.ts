import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { parseMarkdownIntoSections } from '@/services/section/parsing';
import type { MarkdownSection } from '@/services/section/parsing';

const STORAGE_VERSION = 1;
const STORAGE_KEY = 'mdhd-tabs-storage';

/**
 * Reading state for each tab
 */
export interface TabReadingState {
  currentIndex: number;
  readSections: Set<number>;
  scrollProgress: number;
  readingMode: 'card' | 'scroll';
  viewMode: 'preview' | 'edit';
  sections: MarkdownSection[];
  isInitialized: boolean;
}

/**
 * Tab data structure
 */
export interface Tab {
  id: string;
  title: string;
  content: string;
  contentHash: string;
  sourceType: 'paste' | 'file';
  sourceFileId?: string;
  sourcePath?: string;
  createdAt: number;
  lastAccessedAt: number;
  readingState: TabReadingState;
}

interface TabsState {
  tabs: Tab[];
  activeTabId: string | null;
  showEmptyState: boolean;
  version: number;
  _hasHydrated: boolean;
  untitledCounter: number;
}

interface TabsActions {
  // Tab CRUD
  createTab: (
    content: string,
    title?: string,
    sourceType?: 'paste' | 'file',
    sourceFileId?: string,
    sourcePath?: string
  ) => string;
  createUntitledTab: () => string;
  closeTab: (tabId: string) => void;
  closeAllTabs: () => void;
  closeOtherTabs: (tabId: string) => void;

  // Tab selection
  setActiveTab: (tabId: string) => void;
  activateNextTab: () => void;
  activatePreviousTab: () => void;

  // Reading state per tab
  updateTabReadingState: (tabId: string, state: Partial<TabReadingState>) => void;

  // Tab content
  updateTabContent: (tabId: string, content: string) => void;
  updateTabSource: (
    tabId: string,
    sourceType: 'paste' | 'file',
    sourceFileId: string,
    sourcePath: string
  ) => void;
  getTabById: (tabId: string) => Tab | undefined;

  // Empty state
  setShowEmptyState: (show: boolean) => void;

  // Find tab by file
  findTabByFileId: (fileId: string) => Tab | undefined;

  // Close tabs by file/path (for delete operations)
  closeTabByFileId: (fileId: string) => void;
  closeTabsByPathPrefix: (pathPrefix: string) => void;

  // Tab management menu actions
  closeTabsToTheRight: (tabId: string) => void;
  closeTabsToTheLeft: (tabId: string) => void;
  closeTabsBySourceType: (sourceType: 'paste' | 'file') => void;

  // Persistence
  clearPersistedTabs: () => void;
}

interface PersistedTabsState {
  state: {
    tabs?: Array<
      Tab & {
        readingState: Omit<TabReadingState, 'readSections' | 'sections'> & {
          readSections: number[];
          viewMode?: 'preview' | 'edit';
        };
      }
    >;
    activeTabId?: string | null;
    showEmptyState?: boolean;
    version?: number;
  };
  version?: number;
}

/**
 * Custom storage adapter for tabs persistence
 * Handles Set serialization and section re-parsing
 */
const customTabsStorage = {
  getItem: (name: string) => {
    const str = localStorage.getItem(name);
    if (!str) return null;

    try {
      const parsed: PersistedTabsState = JSON.parse(str);
      // Convert readSections arrays back to Sets and re-parse sections for each tab
      if (parsed.state?.tabs) {
        parsed.state.tabs = parsed.state.tabs.map((tab) => {
          const sections = tab.content ? parseMarkdownIntoSections(tab.content) : [];
          return {
            ...tab,
            readingState: {
              ...tab.readingState,
              readSections: new Set(tab.readingState.readSections || []),
              viewMode: tab.readingState.viewMode || 'preview',
              sections,
              isInitialized: sections.length > 0,
            },
          };
        }) as typeof parsed.state.tabs;
      }
      return parsed;
    } catch (e) {
      console.error('Error parsing tabs session:', e);
      return null;
    }
  },

  setItem: (name: string, value: PersistedTabsState) => {
    try {
      const serialized = {
        ...value,
        state: {
          ...value.state,
          tabs: value.state.tabs?.map((tab) => ({
            ...tab,
            readingState: {
              ...tab.readingState,
              // Convert Set to array for JSON serialization
              readSections: Array.from(tab.readingState.readSections || []),
              // Don't persist sections - they will be re-parsed on load
              sections: undefined,
            },
          })),
        },
      };
      localStorage.setItem(name, JSON.stringify(serialized));
    } catch (e) {
      console.error('Error saving tabs session:', e);
    }
  },

  removeItem: (name: string) => localStorage.removeItem(name),
};

/**
 * Simple hash function for content comparison
 */
const hashString = (str: string): string => {
  let hash = 0;
  if (str.length === 0) return hash.toString();

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return hash.toString();
};

/**
 * Generate a unique tab ID
 */
const generateTabId = (): string => {
  return `tab-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Extract title from markdown content (first heading or truncated content)
 */
const extractTitleFromMarkdown = (content: string): string => {
  const headingMatch = content.match(/^#+ (.+)$/m);
  if (headingMatch) {
    return headingMatch[1].trim().substring(0, 50);
  }

  const firstLine = content.split('\n')[0].trim();
  if (firstLine) {
    return firstLine.substring(0, 50) || 'Untitled';
  }

  return 'Untitled';
};

/**
 * Create initial reading state for a new tab
 */
const createInitialReadingState = (content: string): TabReadingState => {
  const sections = content ? parseMarkdownIntoSections(content) : [];
  return {
    currentIndex: 0,
    readSections: new Set([0]),
    scrollProgress: 0,
    readingMode: 'card',
    viewMode: 'preview',
    sections,
    isInitialized: sections.length > 0,
  };
};

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

        createTab: (
          content: string,
          title?: string,
          sourceType: 'paste' | 'file' = 'paste',
          sourceFileId?: string,
          sourcePath?: string
        ) => {
          const tabId = generateTabId();
          const now = Date.now();
          const resolvedTitle = title || extractTitleFromMarkdown(content);

          const newTab: Tab = {
            id: tabId,
            title: resolvedTitle,
            content,
            contentHash: hashString(content),
            sourceType,
            sourceFileId,
            sourcePath,
            createdAt: now,
            lastAccessedAt: now,
            readingState: createInitialReadingState(content),
          };

          set((state) => ({
            tabs: [...state.tabs, newTab],
            activeTabId: tabId,
            showEmptyState: false,
          }));

          return tabId;
        },

        createUntitledTab: () => {
          const tabId = generateTabId();
          const now = Date.now();
          const { untitledCounter } = get();

          // Generate title: "Untitled", "Untitled-1", "Untitled-2", etc.
          const title = untitledCounter === 0 ? 'Untitled' : `Untitled-${untitledCounter}`;

          const newTab: Tab = {
            id: tabId,
            title,
            content: '',
            contentHash: hashString(''),
            sourceType: 'paste',
            createdAt: now,
            lastAccessedAt: now,
            readingState: createInitialReadingState(''),
          };

          set((state) => ({
            tabs: [...state.tabs, newTab],
            activeTabId: tabId,
            showEmptyState: false,
            untitledCounter: state.untitledCounter + 1,
          }));

          return tabId;
        },

        closeTab: (tabId: string) => {
          const state = get();
          const tabIndex = state.tabs.findIndex((t) => t.id === tabId);
          if (tabIndex === -1) return;

          const newTabs = state.tabs.filter((t) => t.id !== tabId);

          // Determine new active tab
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
          const state = get();
          const tab = state.tabs.find((t) => t.id === tabId);
          if (!tab) return;

          const updatedTabs = state.tabs.map((t) =>
            t.id === tabId ? { ...t, lastAccessedAt: Date.now() } : t
          );

          set({
            tabs: updatedTabs,
            activeTabId: tabId,
            showEmptyState: false,
          });
        },

        activateNextTab: () => {
          const state = get();
          if (state.tabs.length === 0 || !state.activeTabId) return;

          const currentIndex = state.tabs.findIndex((t) => t.id === state.activeTabId);
          const nextIndex = (currentIndex + 1) % state.tabs.length;
          const nextTab = state.tabs[nextIndex];

          set({
            activeTabId: nextTab.id,
            tabs: state.tabs.map((t) =>
              t.id === nextTab.id ? { ...t, lastAccessedAt: Date.now() } : t
            ),
          });
        },

        activatePreviousTab: () => {
          const state = get();
          if (state.tabs.length === 0 || !state.activeTabId) return;

          const currentIndex = state.tabs.findIndex((t) => t.id === state.activeTabId);
          const prevIndex = currentIndex === 0 ? state.tabs.length - 1 : currentIndex - 1;
          const prevTab = state.tabs[prevIndex];

          set({
            activeTabId: prevTab.id,
            tabs: state.tabs.map((t) =>
              t.id === prevTab.id ? { ...t, lastAccessedAt: Date.now() } : t
            ),
          });
        },

        updateTabReadingState: (tabId: string, newReadingState: Partial<TabReadingState>) => {
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === tabId
                ? {
                  ...t,
                  readingState: {
                    ...t.readingState,
                    ...newReadingState,
                  },
                }
                : t
            ),
          }));
        },

        updateTabContent: (tabId: string, content: string) => {
          set((state) => ({
            tabs: state.tabs.map((t) => {
              if (t.id !== tabId) return t;

              const sections = content ? parseMarkdownIntoSections(content) : [];
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
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === tabId
                ? {
                  ...t,
                  sourceType,
                  sourceFileId,
                  sourcePath,
                }
                : t
            ),
          }));
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
          const state = get();
          const tabsToClose = state.tabs.filter(
            (t) => t.sourcePath && (t.sourcePath === pathPrefix || t.sourcePath.startsWith(pathPrefix + '/'))
          );
          for (const tab of tabsToClose) {
            state.closeTab(tab.id);
          }
        },

        closeTabsToTheRight: (tabId: string) => {
          const state = get();
          const tabIndex = state.tabs.findIndex((t) => t.id === tabId);
          if (tabIndex === -1) return;

          const tabsToRemove = state.tabs.slice(tabIndex + 1);
          for (const tab of tabsToRemove) {
            state.closeTab(tab.id);
          }
        },

        closeTabsToTheLeft: (tabId: string) => {
          const state = get();
          const tabIndex = state.tabs.findIndex((t) => t.id === tabId);
          if (tabIndex === -1) return;

          const tabsToRemove = state.tabs.slice(0, tabIndex);
          for (const tab of [...tabsToRemove].reverse()) {
            state.closeTab(tab.id);
          }
        },

        closeTabsBySourceType: (sourceType: 'paste' | 'file') => {
          const state = get();
          const tabsToClose = state.tabs.filter((t) => t.sourceType === sourceType);
          for (const tab of tabsToClose) {
            state.closeTab(tab.id);
          }
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
      }),
      {
        name: STORAGE_KEY,
        storage: customTabsStorage,
        partialize: (state) => ({
          tabs: state.tabs,
          activeTabId: state.activeTabId,
          showEmptyState: state.showEmptyState,
          version: state.version,
          untitledCounter: state.untitledCounter,
        }) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        version: STORAGE_VERSION,
        onRehydrateStorage: () => (state, error) => {
          if (error) {
            console.error('Error rehydrating tabs session:', error);
          } else if (state) {
            state._hasHydrated = true;
          }
        },
      }
    ),
    {
      name: 'tabs-store',
    }
  )
);

// Selectors
export const useTabs = () => useTabsStore((state) => state.tabs);
export const useActiveTabId = () => useTabsStore((state) => state.activeTabId);
export const useActiveTab = () =>
  useTabsStore((state) => state.tabs.find((t) => t.id === state.activeTabId));
export const useShowEmptyState = () => useTabsStore((state) => state.showEmptyState);
export const useTabsHasHydrated = () => useTabsStore((state) => state._hasHydrated);

export const useTabsActions = () =>
  useTabsStore(
    useShallow((state) => ({
      createTab: state.createTab,
      createUntitledTab: state.createUntitledTab,
      closeTab: state.closeTab,
      closeAllTabs: state.closeAllTabs,
      closeOtherTabs: state.closeOtherTabs,
      setActiveTab: state.setActiveTab,
      activateNextTab: state.activateNextTab,
      activatePreviousTab: state.activatePreviousTab,
      updateTabReadingState: state.updateTabReadingState,
      updateTabContent: state.updateTabContent,
      updateTabSource: state.updateTabSource,
      getTabById: state.getTabById,
      setShowEmptyState: state.setShowEmptyState,
      findTabByFileId: state.findTabByFileId,
      closeTabByFileId: state.closeTabByFileId,
      closeTabsByPathPrefix: state.closeTabsByPathPrefix,
      closeTabsToTheRight: state.closeTabsToTheRight,
      closeTabsToTheLeft: state.closeTabsToTheLeft,
      closeTabsBySourceType: state.closeTabsBySourceType,
      clearPersistedTabs: state.clearPersistedTabs,
    }))
  );
