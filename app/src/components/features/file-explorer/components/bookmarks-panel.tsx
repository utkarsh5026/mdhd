import React, { memo } from 'react';

import { useAllBookmarks } from '../hooks/use-all-bookmarks';
import BookmarksList from './bookmarks-list';

const BookmarksPanel: React.FC = memo(() => {
  const allBookmarks = useAllBookmarks();

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-3 py-1.5 border-b border-border/30">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 select-none">
          Bookmarks
        </span>
      </div>
      <div className="flex flex-col flex-1 overflow-y-auto">
        {allBookmarks.length === 0 ? (
          <p className="text-xs text-muted-foreground/50 px-3 py-4 text-center">
            Bookmark sections while reading
          </p>
        ) : (
          <BookmarksList bookmarks={allBookmarks} />
        )}
      </div>
    </div>
  );
});

BookmarksPanel.displayName = 'BookmarksPanel';
export default BookmarksPanel;
