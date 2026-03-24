import { use, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useTabsStore } from '@/components/features/tabs/store/tabs-store';
import type { TabReadingState, TabsState } from '@/components/features/tabs/store/types';
import type { MarkdownMetadata, MarkdownSection } from '@/services/section/parsing';

import ReadingTabContext from '../context/reading-tab-context';

/** Looks up a tab by its unique ID from the store state snapshot. */
function findTab(s: TabsState, tabId: string) {
  return s.tabs.find((t) => t.id === tabId);
}

/** Looks up the reading state for a given tab from the store state snapshot. */
function findReadingState(s: TabsState, tabId: string) {
  return findTab(s, tabId)?.readingState;
}

/** Checks whether a section index is within the bounds of the sections array. */
function isValidIndex(rs: TabReadingState, index: number) {
  return index >= 0 && index < rs.sections.length;
}

/** Returns a new `Set` with the given index added to the existing read-sections set. */
function withSectionMarked(readSections: Set<number>, index: number) {
  const next = new Set(readSections);
  next.add(index);
  return next;
}

/**
 * Imperatively reads a tab's reading state from the store outside of
 * React's render cycle. Used inside callbacks that need the latest state.
 */
function getTabReadingState(tabId: string) {
  return findReadingState(useTabsStore.getState(), tabId) ?? null;
}

/**
 * Reads the current tab ID from `ReadingTabContext`.
 *
 * @hook
 * @returns The active tab's unique identifier.
 * @throws {Error} If called outside a `ReadingTabProvider`.
 */
export function useReadingTabId(): string {
  const tabId = use(ReadingTabContext);
  if (!tabId) {
    throw new Error('useReadingTabId must be used within a ReadingTabProvider');
  }
  return tabId;
}

/**
 * Subscribes to the navigation scalars for the current tab.
 *
 * @hook
 * @returns `{ currentIndex, isTransitioning, readingMode }`.
 */
export function useReadingNavigation() {
  const tabId = useReadingTabId();
  return useTabsStore(
    useShallow((s) => {
      const rs = findReadingState(s, tabId);
      return {
        currentIndex: rs?.currentIndex ?? 0,
        isTransitioning: rs?.isTransitioning ?? false,
        readingMode: (rs?.readingMode ?? 'card') as 'card' | 'scroll',
      };
    })
  );
}

/**
 * Subscribes to the parsed sections array for the current tab.
 *
 * @hook
 * @returns The array of `MarkdownSection` objects, or `[]` if unavailable.
 */
export function useReadingSections(): MarkdownSection[] {
  const tabId = useReadingTabId();
  return useTabsStore((s) => findReadingState(s, tabId)?.sections ?? []);
}

/**
 * Subscribes to the raw markdown content, parsed metadata, and source
 * path for the current tab.
 *
 * @hook
 * @returns `{ markdown, metadata, sourcePath }`.
 */
export function useReadingContent() {
  const tabId = useReadingTabId();
  return useTabsStore(
    useShallow((s) => {
      const tab = findTab(s, tabId);
      return {
        markdown: tab?.content ?? '',
        metadata: (tab?.readingState.metadata ?? null) as MarkdownMetadata | null,
        sourcePath: tab?.sourcePath,
      };
    })
  );
}

/**
 * Subscribes to the set of section indices the user has already read.
 *
 * @hook
 * @returns A `Set<number>` of read section indices.
 */
export function useReadingProgress(): Set<number> {
  const tabId = useReadingTabId();
  return useTabsStore((s) => findReadingState(s, tabId)?.readSections ?? new Set<number>());
}

/**
 * Subscribes to zen-mode flags for the current tab.
 *
 * @hook
 * @returns `{ isZenMode, zenControlsVisible, isDialogOpen }`.
 */
export function useReadingZen() {
  const tabId = useReadingTabId();
  return useTabsStore(
    useShallow((s) => {
      const rs = findReadingState(s, tabId);
      return {
        isZenMode: rs?.isZenMode ?? false,
        zenControlsVisible: rs?.zenControlsVisible ?? false,
        isDialogOpen: rs?.isDialogOpen ?? false,
      };
    })
  );
}

/**
 * Derives the currently active section from sections and currentIndex.
 *
 * @hook
 * @returns The active `MarkdownSection`, or `null` if the tab has no state.
 */
export function useReadingCurrentSection(): MarkdownSection | null {
  const tabId = useReadingTabId();
  return useTabsStore((s) => {
    const rs = findReadingState(s, tabId);
    if (!rs) return null;
    return rs.sections[rs.currentIndex] ?? null;
  });
}

/**
 * Provides the full set of reading actions for the current tab (from context).
 *
 * Extends {@link useReadingActionsById} with directional navigation
 * (`goToNext`, `goToPrevious`) and section lookup (`getSection`).
 *
 * @hook
 * @returns Navigation, progress, and section-access actions.
 */
export function useReadingActions() {
  const tabId = useReadingTabId();
  const { changeSection, markSectionAsRead, updateCurrentIndex, handleScrollProgress } =
    useReadingActionsById(tabId);

  const navigate = useCallback(
    (direction: 1 | -1) => {
      const rs = getTabReadingState(tabId);
      if (!rs) return;
      const nextIndex = rs.currentIndex + direction;
      if (isValidIndex(rs, nextIndex)) {
        changeSection(nextIndex);
        navigator.vibrate?.(10);
      }
    },
    [tabId, changeSection]
  );

  const goToNext = useCallback(() => navigate(1), [navigate]);
  const goToPrevious = useCallback(() => navigate(-1), [navigate]);

  const getSection = useCallback(
    (index: number): MarkdownSection | null => {
      const rs = getTabReadingState(tabId);
      if (!rs || !isValidIndex(rs, index)) return null;
      return rs.sections[index];
    },
    [tabId]
  );

  return {
    goToNext,
    goToPrevious,
    changeSection,
    markSectionAsRead,
    updateCurrentIndex,
    handleScrollProgress,
    getSection,
  };
}

/**
 * Provides core reading actions for a specific tab by ID.
 *
 * Suitable for use outside of `ReadingTabContext` (e.g. sidebar, tab bar).
 * Exposes `changeSection` (with 200 ms transition), `markSectionAsRead`,
 * `updateCurrentIndex`, and `handleScrollProgress`.
 *
 * @hook
 * @param tabId - The tab to operate on.
 * @returns Core reading-state mutation actions.
 */
export function useReadingActionsById(tabId: string) {
  const updateTabReadingState = useTabsStore((s) => s.updateTabReadingState);

  const changeSection = useCallback(
    (newIndex: number) => {
      const rs = getTabReadingState(tabId);
      if (!rs || !isValidIndex(rs, newIndex)) return;

      updateTabReadingState(tabId, { isTransitioning: true });

      setTimeout(() => {
        const freshRs = getTabReadingState(tabId);
        if (!freshRs) return;

        updateTabReadingState(tabId, {
          currentIndex: newIndex,
          readSections: withSectionMarked(freshRs.readSections, newIndex),
          isTransitioning: false,
        });
      }, 200);
    },
    [tabId, updateTabReadingState]
  );

  const markSectionAsRead = useCallback(
    (index: number) => {
      const rs = getTabReadingState(tabId);
      if (!rs) return;
      updateTabReadingState(tabId, { readSections: withSectionMarked(rs.readSections, index) });
    },
    [tabId, updateTabReadingState]
  );

  const updateCurrentIndex = useCallback(
    (index: number) => {
      const rs = getTabReadingState(tabId);
      if (!rs || !isValidIndex(rs, index)) return;
      updateTabReadingState(tabId, { currentIndex: index });
    },
    [tabId, updateTabReadingState]
  );

  const handleScrollProgress = useCallback(
    (progress: number) => {
      updateTabReadingState(tabId, { scrollProgress: progress });
    },
    [tabId, updateTabReadingState]
  );

  return { changeSection, markSectionAsRead, updateCurrentIndex, handleScrollProgress };
}
