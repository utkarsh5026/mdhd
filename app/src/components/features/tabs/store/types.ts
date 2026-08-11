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
  /** User-selected emoji icon for the Notion-style page header. When unset, an icon is derived deterministically from `contentHash`. */
  customIcon?: string;
  /** User-chosen overrides for the cover gradient/pattern. Any field unset falls back to the auto-generated value. */
  customCover?: {
    paletteIndex?: number;
    patternIndex?: number;
    angle?: number;
    colors?: [string, string, string];
  };
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
   * Save `content` as a regular root-level file and show it in a file-backed
   * tab — the entry point for every document that arrives from outside the
   * library (dropped, opened, pasted, typed).
   *
   * Persisting first is what makes the document survive a reload: an unsaved
   * tab's content is stripped when the store is written to localStorage and
   * cannot be recovered without a `sourceFileId`.
   *
   * @param content - The markdown to store.
   * @param options.filename - Name the document arrived under, when it had one;
   *   otherwise the name is derived from the content's first heading.
   * @param options.title - Tab title override; defaults to the first heading.
   * @param options.reuseTabId - Fill this tab instead of opening a new one, as
   *   long as it is still empty and unsaved (the empty state renders inside
   *   such a tab). Ignored otherwise.
   * @returns The id of the tab showing the document, or `null` when `content`
   *   was blank or the save failed.
   */
  openDocument: (
    content: string,
    options?: { filename?: string; title?: string; reuseTabId?: string }
  ) => Promise<string | null>;
  /**
   * Save pasted content as a regular root-level file and open it as a
   * file-backed tab. Returns the new tab id.
   */
  createFromPaste: (content: string, title?: string) => Promise<string | null>;
  /**
   * Point an existing empty tab at a newly stored file, filling in its content,
   * title, and source binding, and parsing its sections. Returns `tabId`.
   */
  adoptFile: (
    tabId: string,
    content: string,
    title: string,
    sourceFileId: string,
    sourcePath: string
  ) => string;
  createUntitledTab: () => string;
  setTabsState: (tabs: Tab[], activeTabId: string | null, showEmptyState: boolean) => void;

  setActiveTab: (tabId: string) => void;
  updateTabReadingState: (tabId: string, state: Partial<TabReadingState>) => void;

  /**
   * Replace a tab's content, re-parsing its sections and resetting its reading
   * position. Writes through to IndexedDB only for file-backed tabs — content
   * set on an unsaved tab lives in memory and is dropped on reload, so a
   * document arriving from outside the library must go through
   * {@link TabsActions.openDocument} instead.
   */
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

  /** Set or clear the user-selected emoji icon for a tab. Pass `null` to revert to the auto-generated icon. */
  setTabIcon: (tabId: string, icon: string | null) => void;
  /** Patch the user-chosen cover overrides. Pass `null` to clear all overrides and revert to the auto-generated cover. */
  setTabCover: (
    tabId: string,
    cover: {
      paletteIndex?: number;
      patternIndex?: number;
      angle?: number;
      colors?: [string, string, string];
    } | null
  ) => void;

  toggleHeaderVisibility: () => void;
  toggleStatusBarVisibility: () => void;

  /**
   * Parses sections for all tabs that have content but are not yet initialized.
   * Called after hydration to avoid blocking the first render with synchronous
   * parsing of every tab's markdown content.
   */
  initializeTabSections: () => void;
}
