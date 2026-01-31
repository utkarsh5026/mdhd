import { useMemo } from 'react';
import { useTabsStore } from '../store/tabs-store';
import type { MarkdownSection } from '@/services/section/parsing';

interface UseActiveTabSectionsReturn {
  sections: MarkdownSection[];
  currentIndex: number;
  readSections: Set<number>;
  tabId: string | null;
  hasActiveTab: boolean;
  readingMode: 'card' | 'scroll';
}

export const useActiveTabSections = (): UseActiveTabSectionsReturn => {
  const activeTabId = useTabsStore((state) => state.activeTabId);
  const activeTab = useTabsStore((state) => state.tabs.find((t) => t.id === state.activeTabId));

  return useMemo(
    () => ({
      sections: activeTab?.readingState.sections ?? [],
      currentIndex: activeTab?.readingState.currentIndex ?? 0,
      readSections: activeTab?.readingState.readSections ?? new Set<number>(),
      tabId: activeTabId,
      hasActiveTab: !!activeTab,
      readingMode: activeTab?.readingState.readingMode ?? 'card',
    }),
    [activeTab, activeTabId]
  );
};
