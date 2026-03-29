import { Bookmark, Trash2 } from 'lucide-react';
import React, { memo, useCallback } from 'react';

import { useTabsStore } from '@/components/features/tabs/store/tabs-store';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import type { AggregatedBookmark } from '../hooks/use-all-bookmarks';

interface BookmarksListProps {
  bookmarks: AggregatedBookmark[];
  className?: string;
}

/**
 * Displays all bookmarks from open tabs. Clicking navigates to the
 * bookmarked section; the delete button removes it with server sync.
 */
const BookmarksList: React.FC<BookmarksListProps> = memo(({ bookmarks, className }) => {
  const handleNavigate = useCallback((tabId: string, sectionIndex: number) => {
    const store = useTabsStore.getState();
    store.setActiveTab(tabId);
    store.updateTabReadingState(tabId, { currentIndex: sectionIndex });
  }, []);

  const handleDelete = useCallback((tabId: string, sectionIndex: number) => {
    const store = useTabsStore.getState();
    const tab = store.getTabById(tabId);
    const bm = tab?.readingState.bookmarks?.find((b) => b.sectionIndex === sectionIndex);

    store.removeBookmark(tabId, sectionIndex);

    if (tab?.sourceFileId && bm?.serverId) {
      import('@/services/bookmarks').then(({ deleteBookmark }) =>
        deleteBookmark(tab.sourceFileId!, bm.serverId!).catch((err) =>
          console.error('[bookmarks] Failed to delete bookmark on server:', err)
        )
      );
    }
  }, []);

  return (
    <div className={cn('flex flex-col', className)}>
      {bookmarks.map(({ tabId, tabTitle, bookmark, isPersisted }) => (
        <div
          key={`${tabId}-${bookmark.sectionIndex}`}
          className="group flex items-center gap-2 px-3 py-1 hover:bg-accent/50 cursor-pointer transition-colors rounded-sm"
          onClick={() => handleNavigate(tabId, bookmark.sectionIndex)}
        >
          <Bookmark className="h-3.5 w-3.5 text-amber-400/70 shrink-0 group-hover:text-amber-400 transition-colors" />
          <div className="flex-1 min-w-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-xs font-medium text-foreground/85 truncate group-hover:text-foreground transition-colors">
                  {bookmark.name}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                {bookmark.name}
              </TooltipContent>
            </Tooltip>
            <div className="flex items-center gap-1.5">
              <div className="text-[10px] text-muted-foreground/40 group-hover:text-muted-foreground/60 truncate transition-colors">
                {tabTitle}
              </div>
              {!isPersisted && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-[9px] px-1 rounded bg-muted/50 text-muted-foreground/50 shrink-0 leading-4">
                      local
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    Pasted content — bookmark is lost when the tab closes
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(tabId, bookmark.sectionIndex);
            }}
            aria-label="Remove bookmark"
          >
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-destructive transition-colors" />
          </Button>
        </div>
      ))}
    </div>
  );
});

BookmarksList.displayName = 'BookmarksList';
export default BookmarksList;
