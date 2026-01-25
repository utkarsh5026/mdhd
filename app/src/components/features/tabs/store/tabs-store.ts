import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { parseMarkdownIntoSections } from '@/services/section/parsing';
import type { MarkdownMetadata, MarkdownSection } from '@/services/section/parsing';

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
  metadata?: MarkdownMetadata | null;
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
  isHeaderVisible: boolean;
}

interface TabsActions {
  addTab: (newTab: Tab, options?: { incrementCounter?: boolean }) => string;
  updateTab: (tabId: string, updater: Partial<Tab> | ((tab: Tab) => Partial<Tab>)) => void;

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

  setActiveTab: (tabId: string) => void;
  updateTabReadingState: (tabId: string, state: Partial<TabReadingState>) => void;

  updateTabContent: (tabId: string, content: string) => void;
  updateTabSource: (
    tabId: string,
    sourceType: 'paste' | 'file',
    sourceFileId: string,
    sourcePath: string
  ) => void;
  getTabById: (tabId: string) => Tab | undefined;

  setShowEmptyState: (show: boolean) => void;
  findTabByFileId: (fileId: string) => Tab | undefined;

  closeTabByFileId: (fileId: string) => void;
  closeTabsByPathPrefix: (pathPrefix: string) => void;

  closeTabsToTheRight: (tabId: string) => void;
  closeTabsToTheLeft: (tabId: string) => void;
  closeTabsBySourceType: (sourceType: 'paste' | 'file') => void;

  toggleHeaderVisibility: () => void;
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
          const { metadata, sections } = parseMarkdownIntoSections(tab.content);
          return {
            ...tab,
            readingState: {
              ...tab.readingState,
              readSections: new Set(tab.readingState.readSections || []),
              viewMode: tab.readingState.viewMode || 'preview',
              sections,
              isInitialized: sections.length > 0,
              metadata,
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
              readSections: Array.from(tab.readingState.readSections || []),
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
  const { metadata, sections } = content
    ? parseMarkdownIntoSections(content)
    : { metadata: {}, sections: [] };
  return {
    currentIndex: 0,
    readSections: new Set([0]),
    scrollProgress: 0,
    readingMode: 'card',
    viewMode: 'preview',
    sections,
    metadata,
    isInitialized: sections.length > 0,
  };
};

function createTab(
  content: string,
  title: string,
  source: {
    fileID?: string;
    path?: string;
    sType: 'paste' | 'file';
  }
): Tab {
  const now = Date.now();
  return {
    id: generateTabId(),
    title,
    content,
    contentHash: hashString(content),
    createdAt: now,
    lastAccessedAt: now,
    sourceType: source.sType,
    sourceFileId: source.fileID,
    sourcePath: source.path,
    readingState: createInitialReadingState(content),
  };
}

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
          const { tabs, closeTab } = get();
          tabs
            .filter(
              (t) =>
                t.sourcePath &&
                (t.sourcePath === pathPrefix || t.sourcePath.startsWith(pathPrefix + '/'))
            )
            .forEach((t) => closeTab(t.id));
        },

        closeTabsToTheRight: (tabId: string) => {
          const { closeTab, tabs } = get();
          const tabIndex = tabs.findIndex((t) => t.id === tabId);
          if (tabIndex === -1) return;

          tabs.slice(tabIndex + 1).forEach((t) => closeTab(t.id));
        },

        closeTabsToTheLeft: (tabId: string) => {
          const { tabs, closeTab } = get();
          const tabIndex = tabs.findIndex((t) => t.id === tabId);
          if (tabIndex === -1) return;
          tabs
            .slice(0, tabIndex)
            .reverse()
            .forEach((t) => closeTab(t.id));
        },

        closeTabsBySourceType: (sourceType: 'paste' | 'file') => {
          const { tabs, closeTab } = get();
          tabs.filter((t) => t.sourceType === sourceType).forEach((t) => closeTab(t.id));
        },

        toggleHeaderVisibility: () => {
          set((state) => ({
            isHeaderVisible: !state.isHeaderVisible,
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
      }),
      {
        name: STORAGE_KEY,
        storage: customTabsStorage,
        partialize: (state) =>
          ({
            tabs: state.tabs,
            activeTabId: state.activeTabId,
            showEmptyState: state.showEmptyState,
            version: state.version,
            untitledCounter: state.untitledCounter,
            isHeaderVisible: state.isHeaderVisible,
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

export const useTabs = () => useTabsStore((state) => state.tabs);
export const useActiveTabId = () => useTabsStore((state) => state.activeTabId);
export const useActiveTab = () =>
  useTabsStore((state) => state.tabs.find((t) => t.id === state.activeTabId));
export const useShowEmptyState = () => useTabsStore((state) => state.showEmptyState);
export const useTabsHasHydrated = () => useTabsStore((state) => state._hasHydrated);
export const useHeaderVisible = () => useTabsStore((state) => state.isHeaderVisible);

export const useTabsActions = () =>
  useTabsStore(
    useShallow((state) => ({
      createTab: state.createTab,
      createUntitledTab: state.createUntitledTab,
      closeTab: state.closeTab,
      setActiveTab: state.setActiveTab,
      updateTabReadingState: state.updateTabReadingState,
      updateTabContent: state.updateTabContent,
      updateTabSource: state.updateTabSource,
      getTabById: state.getTabById,
      setShowEmptyState: state.setShowEmptyState,
      findTabByFileId: state.findTabByFileId,
      closeTabsBySourceType: state.closeTabsBySourceType,
      toggleHeaderVisibility: state.toggleHeaderVisibility,
      clearPersistedTabs: state.clearPersistedTabs,
    }))
  );

export function useTabClose() {
  return useTabsStore(
    useShallow(
      ({
        closeAllTabs,
        closeOtherTabs,
        closeTabByFileId,
        closeTabsByPathPrefix,
        closeTabsBySourceType,
        closeTabsToTheLeft,
        closeTabsToTheRight,
      }) => {
        return {
          closeAllTabs,
          closeOtherTabs,
          closeTabByFileId,
          closeTabsByPathPrefix,
          closeTabsBySourceType,
          closeTabsToTheLeft,
          closeTabsToTheRight,
        };
      }
    )
  );
}
