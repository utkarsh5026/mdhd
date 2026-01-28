import React, { memo } from 'react';
import ReadingCore from './reading-core';
import { Header } from './layout';
import type { MarkdownSection, MarkdownMetadata } from '@/services/section/parsing';

export interface ReadingUIProps {
  markdown: string;
  metadata: MarkdownMetadata | null;
  sections: MarkdownSection[];
  readSections: Set<number>;
  currentIndex: number;
  currentSection: MarkdownSection;
  isTransitioning: boolean;
  readingMode: 'card' | 'scroll';
  scrollProgress: number;
  goToNext: () => void;
  goToPrevious: () => void;
  changeSection: (index: number) => void;
  markSectionAsRead: (index: number) => void;
  updateCurrentIndex: (index: number) => void;
  onScrollProgressChange: (progress: number) => void;
  isZenMode: boolean;
  zenControlsVisible: boolean;
  isDialogOpen: boolean;
  onZenTap: () => void;
  onZenDoubleTap: () => void;
  onExit: () => void;
}

/**
 * 🎯 ReadingUI - Fullscreen reading mode wrapper
 *
 * This component wraps ReadingCore and adds:
 * - Exit button header (instead of fullscreen button)
 * - Zen mode support
 * - Fullscreen-specific controls
 */
const ReadingUI: React.FC<ReadingUIProps> = memo(
  ({
    markdown,
    metadata,
    sections,
    readSections,
    currentIndex,
    currentSection,
    isTransitioning,
    readingMode,
    scrollProgress,
    goToNext,
    goToPrevious,
    changeSection,
    markSectionAsRead,
    updateCurrentIndex,
    onScrollProgressChange,
    isZenMode,
    zenControlsVisible,
    isDialogOpen,
    onZenTap,
    onZenDoubleTap,
    onExit,
  }) => {
    return (
      <ReadingCore
        markdown={markdown}
        metadata={metadata}
        sections={sections}
        readSections={readSections}
        currentIndex={currentIndex}
        currentSection={currentSection}
        isTransitioning={isTransitioning}
        readingMode={readingMode}
        scrollProgress={scrollProgress}
        goToNext={goToNext}
        goToPrevious={goToPrevious}
        changeSection={changeSection}
        markSectionAsRead={markSectionAsRead}
        updateCurrentIndex={updateCurrentIndex}
        onScrollProgressChange={onScrollProgressChange}
        viewMode="preview"
        isZenMode={isZenMode}
        zenControlsVisible={zenControlsVisible}
        isDialogOpen={isDialogOpen}
        onZenTap={onZenTap}
        onZenDoubleTap={onZenDoubleTap}
        headerSlot={({ onSettings, onMenu, isVisible }) => (
          <Header onExit={onExit} onSettings={onSettings} onMenu={onMenu} isVisible={isVisible} />
        )}
      />
    );
  }
);

ReadingUI.displayName = 'ReadingUI';

export default ReadingUI;
