import type { StateCreator } from 'zustand';

import type { Bookmark, BookmarkActions, TabsActions, TabsState } from './types';

export const createBookmarkSlice: StateCreator<TabsState & TabsActions, [], [], BookmarkActions> = (
  _set,
  get
) => ({
  addBookmark: (tabId: string, bookmark: Bookmark) => {
    get().updateTab(tabId, (tab) => ({
      readingState: {
        ...tab.readingState,
        bookmarks: [
          ...(tab.readingState.bookmarks ?? []).filter(
            (b) => b.sectionIndex !== bookmark.sectionIndex
          ),
          bookmark,
        ].sort((a, b) => a.sectionIndex - b.sectionIndex),
      },
    }));
  },

  removeBookmark: (tabId: string, sectionIndex: number) => {
    get().updateTab(tabId, (tab) => ({
      readingState: {
        ...tab.readingState,
        bookmarks: (tab.readingState.bookmarks ?? []).filter(
          (b) => b.sectionIndex !== sectionIndex
        ),
      },
    }));
  },

  setBookmarks: (tabId: string, bookmarks: Bookmark[]) => {
    get().updateTab(tabId, (tab) => ({
      readingState: {
        ...tab.readingState,
        bookmarks: [...bookmarks].sort((a, b) => a.sectionIndex - b.sectionIndex),
      },
    }));
  },
});
