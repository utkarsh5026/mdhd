import type { MarkdownMetadata, MarkdownSection } from '@/services/section/parsing';

export type ViewMode = 'preview';

/** A saved position within a document section. */
export interface Bookmark {
  /** Client-generated stable ID used for optimistic UI before server responds. */
  localId: string;
  /** Server-assigned UUID, null for unsaved tabs or before first sync. */
  serverId: string | null;
  sectionIndex: number;
  name: string;
  createdAt: number;
}

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
  // Transition state (for card mode fade animation)
  isTransitioning?: boolean;
  // Saved section bookmarks (persisted to localStorage)
  bookmarks?: Bookmark[];
}

/**
 * Tab data structure.
 *
 * A tab is either "file-backed" (`sourceFileId` set, content also lives in
 * IndexedDB and participates in sync) or "untitled" (no source — kept only in
 * memory + the persisted Zustand store, never written to IDB or sync).
 */
export interface Tab {
  id: string;
  title: string;
  content: string;
  contentHash: string;
  sourceFileId?: string;
  sourcePath?: string;
  createdAt: number;
  lastAccessedAt: number;
  readingState: TabReadingState;
  pinned?: boolean;
}

export interface TabsState {
  tabs: Tab[];
  activeTabId: string | null;
  showEmptyState: boolean;
  version: number;
  _hasHydrated: boolean;
  untitledCounter: number;
  isHeaderVisible: boolean;
  isStatusBarVisible: boolean;
}

export interface BookmarkActions {
  addBookmark: (tabId: string, bookmark: Bookmark) => void;
  removeBookmark: (tabId: string, sectionIndex: number) => void;
  setBookmarks: (tabId: string, bookmarks: Bookmark[]) => void;
}

export interface TabsActions extends BookmarkActions {
  addTab: (newTab: Tab, options?: { incrementCounter?: boolean }) => string;
  updateTab: (tabId: string, updater: Partial<Tab> | ((tab: Tab) => Partial<Tab>)) => void;

  /**
   * Create a tab. If `sourceFileId` is provided the tab is file-backed; otherwise
   * the tab is unsaved and only lives in the in-memory store.
   */
  createTab: (
    content: string,
    title?: string,
    sourceFileId?: string,
    sourcePath?: string
  ) => string;
  /**
   * Save pasted content as a regular root-level file and open it as a
   * file-backed tab. Returns the new tab id.
   */
  createFromPaste: (content: string, title?: string) => Promise<string | null>;
  createUntitledTab: () => string;
  setTabsState: (tabs: Tab[], activeTabId: string | null, showEmptyState: boolean) => void;

  setActiveTab: (tabId: string) => void;
  updateTabReadingState: (tabId: string, state: Partial<TabReadingState>) => void;

  updateTabContent: (tabId: string, content: string) => void;
  getTabById: (tabId: string) => Tab | undefined;

  setShowEmptyState: (show: boolean) => void;
  findTabByFileId: (fileId: string) => Tab | undefined;

  pinTab: (tabId: string) => void;
  unpinTab: (tabId: string) => void;
  duplicateTab: (tabId: string) => string | null;

  /**
   * Refresh the path/title of any tab whose `sourceFileId` matches `fileId`.
   * Called after a file rename so open tabs display the new name.
   */
  updateTabPath: (fileId: string, newPath: string, newTitle: string) => void;

  toggleHeaderVisibility: () => void;
  toggleStatusBarVisibility: () => void;

  /**
   * Parses sections for all tabs that have content but are not yet initialized.
   * Called after hydration to avoid blocking the first render with synchronous
   * parsing of every tab's markdown content.
   */
  initializeTabSections: () => void;
}
