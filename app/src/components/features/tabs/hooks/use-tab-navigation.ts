import { useCallback, useMemo, useState } from 'react';

import type { MarkdownMetadata, MarkdownSection } from '@/services/section/parsing';

import { useTabsStore } from '../store/tabs-store';

interface UseTabNavigationReturn {
  sections: MarkdownSection[];
  readSections: Set<number>;
  currentIndex: number;
  readingMode: 'card' | 'scroll';
  scrollProgress: number;
  isTransitioning: boolean;
  goToNext: () => void;
  goToPrevious: () => void;
  changeSection: (index: number) => void;
  markSectionAsRead: (index: number) => void;
  updateCurrentIndex: (index: number) => void;
  getSection: (index: number) => MarkdownSection | null;
  handleScrollProgress: (progress: number) => void;
  metadata: MarkdownMetadata | null;
}

/**
 * Shared hook for tab-based navigation logic.
 * Extracts reading state from useTabsStore and provides navigation functions.
 */
export const useTabNavigation = (tabId: string): UseTabNavigationReturn => {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const tab = useTabsStore((state) => state.tabs.find((t) => t.id === tabId));
  const updateTabReadingState = useTabsStore((state) => state.updateTabReadingState);

  const sections = useMemo(() => tab?.readingState.sections ?? [], [tab?.readingState.sections]);
  const metadata = useMemo(() => tab?.readingState.metadata ?? null, [tab?.readingState.metadata]);
  const readSections = useMemo(
    () => tab?.readingState.readSections ?? new Set<number>(),
    [tab?.readingState.readSections]
  );
  const currentIndex = tab?.readingState.currentIndex ?? 0;
  const readingMode = tab?.readingState.readingMode ?? 'card';
  const scrollProgress = tab?.readingState.scrollProgress ?? 0;

  const changeSection = useCallback(
    (newIndex: number) => {
      if (!tab || newIndex < 0 || newIndex >= sections.length) return;

      setIsTransitioning(true);

      setTimeout(() => {
        const currentReadSections =
          useTabsStore.getState().tabs.find((t) => t.id === tabId)?.readingState.readSections ??
          new Set<number>();
        const newReadSections = new Set(currentReadSections);
        newReadSections.add(newIndex);

        updateTabReadingState(tabId, {
          currentIndex: newIndex,
          readSections: newReadSections,
        });
        setIsTransitioning(false);
      }, 200);
    },
    [tab, tabId, sections.length, updateTabReadingState]
  );

  const goToNext = useCallback(() => {
    if (currentIndex < sections.length - 1) {
      changeSection(currentIndex + 1);
    }
  }, [currentIndex, sections.length, changeSection]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      changeSection(currentIndex - 1);
    }
  }, [currentIndex, changeSection]);

  const markSectionAsRead = useCallback(
    (index: number) => {
      if (!tab) return;
      const currentReadSections =
        useTabsStore.getState().tabs.find((t) => t.id === tabId)?.readingState.readSections ??
        new Set<number>();
      const newReadSections = new Set(currentReadSections);
      newReadSections.add(index);
      updateTabReadingState(tabId, { readSections: newReadSections });
    },
    [tab, tabId, updateTabReadingState]
  );

  const getSection = useCallback(
    (index: number) => {
      if (index < 0 || index >= sections.length) return null;
      return sections[index];
    },
    [sections]
  );

  const handleScrollProgress = useCallback(
    (progress: number) => {
      updateTabReadingState(tabId, { scrollProgress: progress });
    },
    [tabId, updateTabReadingState]
  );

  const updateCurrentIndex = useCallback(
    (index: number) => {
      if (!tab || index < 0 || index >= sections.length) return;
      updateTabReadingState(tabId, { currentIndex: index });
    },
    [tab, tabId, sections.length, updateTabReadingState]
  );

  return {
    sections,
    readSections,
    currentIndex,
    readingMode,
    scrollProgress,
    isTransitioning,
    goToNext,
    goToPrevious,
    changeSection,
    markSectionAsRead,
    updateCurrentIndex,
    getSection,
    metadata,
    handleScrollProgress,
  };
};
