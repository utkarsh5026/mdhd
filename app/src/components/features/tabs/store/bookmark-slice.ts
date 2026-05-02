import type { StateCreator } from 'zustand';

import { patchNested } from '@/lib/store-utils';

import type { Bookmark, BookmarkActions, TabsActions, TabsState } from './types';

export const createBookmarkSlice: StateCreator<TabsState & TabsActions, [], [], BookmarkActions> = (
  _set,
  get
) => ({
  addBookmark: (tabId: string, bookmark: Bookmark) => {
    get().updateTab(tabId, (tab) =>
      patchNested(tab, 'readingState', (rs) => ({
        bookmarks: [
          ...(rs.bookmarks ?? []).filter((b) => b.sectionIndex !== bookmark.sectionIndex),
          bookmark,
        ].sort((a, b) => a.sectionIndex - b.sectionIndex),
      }))
    );
  },

  removeBookmark: (tabId: string, sectionIndex: number) => {
    get().updateTab(tabId, (tab) =>
      patchNested(tab, 'readingState', (rs) => ({
        bookmarks: (rs.bookmarks ?? []).filter((b) => b.sectionIndex !== sectionIndex),
      }))
    );
  },

  setBookmarks: (tabId: string, bookmarks: Bookmark[]) => {
    get().updateTab(tabId, (tab) =>
      patchNested(tab, 'readingState', {
        bookmarks: [...bookmarks].sort((a, b) => a.sectionIndex - b.sectionIndex),
      })
    );
  },
});
