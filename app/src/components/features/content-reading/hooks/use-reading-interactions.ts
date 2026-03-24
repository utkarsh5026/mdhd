import { useCallback, useEffect, useRef } from 'react';

import { useTabsStore } from '@/components/features/tabs/store/tabs-store';

import {
  useReadingActions,
  useReadingNavigation,
  useReadingSections,
  useReadingTabId,
  useReadingZen,
  useZenMode,
} from '.';
import { useControls } from './use-controls';

/** Return shape for {@link useReadingInteractions}. */
interface UseReadingInteractionsReturn {
  isControlsVisible: boolean;
  zenControlsVisible: boolean;
  isZenMode: boolean;
  isDialogOpen: boolean;
  shouldShowControls: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  handleInteraction: () => void;
  handleContentClick: () => void;
  handleContentDoubleClick: () => void;
  handleSelectCard: (index: number) => void;
  handleSectionVisible: (index: number) => void;
  goToNext: () => void;
  goToPrevious: () => void;
  handleScrollProgress: (progress: number) => void;
}

/**
 * Centralizes reading-mode interaction logic for {@link ReadingCore}.
 *
 * Wires zen-mode actions to the tab store, combines zen and controls into
 * unified click/double-click handlers, manages section selection and
 * visibility tracking, and resets scroll position on card changes.
 *
 * @hook
 * @param onSearch - Optional callback forwarded to {@link useControls} for
 *   the Ctrl/Cmd+F keyboard shortcut.
 * @returns UI state flags, a scroll ref, and all interaction handlers needed
 *   by the reading layout.
 */
export const useReadingInteractions = (onSearch?: () => void): UseReadingInteractionsReturn => {
  const tabId = useReadingTabId();
  const { currentIndex, readingMode } = useReadingNavigation();
  const sections = useReadingSections();
  const { isZenMode, zenControlsVisible, isDialogOpen } = useReadingZen();
  const {
    goToNext,
    goToPrevious,
    changeSection,
    markSectionAsRead,
    updateCurrentIndex,
    handleScrollProgress,
  } = useReadingActions();

  const updateTabReadingState = useTabsStore((s) => s.updateTabReadingState);
  const setZenMode = useCallback(
    (v: boolean) => updateTabReadingState(tabId, { isZenMode: v, zenControlsVisible: false }),
    [tabId, updateTabReadingState]
  );
  const showZenControls = useCallback(
    () => updateTabReadingState(tabId, { zenControlsVisible: true }),
    [tabId, updateTabReadingState]
  );
  const hideZenControls = useCallback(
    () => updateTabReadingState(tabId, { zenControlsVisible: false }),
    [tabId, updateTabReadingState]
  );
  const { handleZenTap, handleZenDoubleTap } = useZenMode({
    isZenMode,
    setZenMode,
    showZenControls,
    hideZenControls,
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  const { isControlsVisible, handleInteraction, handleDoubleClick } = useControls({
    goToNext,
    goToPrevious,
    readingMode,
    onSearch,
  });

  useEffect(() => {
    if (readingMode === 'card' && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [currentIndex, readingMode]);

  const handleSelectCard = useCallback(
    (index: number) => {
      if (readingMode === 'scroll') {
        const sectionElement = document.getElementById(`section-${sections[index]?.id}`);
        if (sectionElement) {
          sectionElement.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
        markSectionAsRead(index);
      } else {
        if (index !== currentIndex) changeSection(index);
      }
    },
    [readingMode, sections, currentIndex, changeSection, markSectionAsRead]
  );

  const handleSectionVisible = useCallback(
    (index: number) => {
      markSectionAsRead(index);
      updateCurrentIndex(index);
    },
    [markSectionAsRead, updateCurrentIndex]
  );

  const handleContentDoubleClick = useCallback(() => {
    if (isZenMode) {
      handleZenDoubleTap();
    } else {
      handleDoubleClick();
    }
  }, [isZenMode, handleZenDoubleTap, handleDoubleClick]);

  const handleContentClick = useCallback(() => {
    if (isZenMode) {
      handleZenTap();
    }
  }, [isZenMode, handleZenTap]);

  const shouldShowControls = !isDialogOpen && (!isZenMode || zenControlsVisible);

  return {
    isControlsVisible,
    zenControlsVisible,
    isZenMode,
    isDialogOpen,
    shouldShowControls,
    scrollRef,
    handleInteraction,
    handleContentClick,
    handleContentDoubleClick,
    handleSelectCard,
    handleSectionVisible,
    goToNext,
    goToPrevious,
    handleScrollProgress,
  };
};
