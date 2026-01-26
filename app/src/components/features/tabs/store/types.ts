import type { MarkdownMetadata, MarkdownSection } from '@/services/section/parsing';

export type ViewMode = 'preview' | 'edit' | 'dual';

/**
 * Reading state for each tab
 */
export interface TabReadingState {
  currentIndex: number;
  readSections: Set<number>;
  scrollProgress: number;
  readingMode: 'card' | 'scroll';
  viewMode: ViewMode;
  sections: MarkdownSection[];
  isInitialized: boolean;
  metadata?: MarkdownMetadata | null;
  // Zen mode state (per-tab)
  isZenMode?: boolean;
  zenControlsVisible?: boolean;
  // Dialog state (per-tab, for code preview dialogs)
  isDialogOpen?: boolean;
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

export interface TabsState {
  tabs: Tab[];
  activeTabId: string | null;
  showEmptyState: boolean;
  version: number;
  _hasHydrated: boolean;
  untitledCounter: number;
  isHeaderVisible: boolean;
}

export interface TabsActions {
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
