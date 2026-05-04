import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useTabsStore } from '@/components/features/tabs/store/tabs-store';
import type { Bookmark } from '@/components/features/tabs/store/types';

export interface AggregatedBookmark {
  tabId: string;
  tabTitle: string;
  bookmark: Bookmark;
  /** False for unsaved tabs — bookmark lives in localStorage only, lost when tab closes. */
  isPersisted: boolean;
}

/**
 * Aggregates bookmarks from all open tabs into a flat list.
 * Used by the sidebar to display all saved positions across documents.
 */
export function useAllBookmarks(): AggregatedBookmark[] {
  const tabs = useTabsStore(useShallow((s) => s.tabs));
  return useMemo(
    () =>
      tabs.flatMap((tab) =>
        (tab.readingState.bookmarks ?? []).map((b) => ({
          tabId: tab.id,
          tabTitle: tab.title,
          bookmark: b,
          isPersisted: !!tab.sourceFileId,
        }))
      ),
    [tabs]
  );
}
