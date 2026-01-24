import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import SectionsSheet from './table-of-contents/sections-sheet';
import ReadingSettingsSheet from '@/components/features/settings/components/reading-settings-selector';
import FloatingThemePicker from '@/components/shared/theme/components/floating-theme-picker';
import { useThemeStore } from '@/components/shared/theme/store/theme-store';
import {
  Header,
  NavigationControls,
  DesktopProgressIndicator,
  ContentReader,
  ScrollContentReader,
  ZenPositionIndicator,
} from './layout';
import { useControls } from '@/components/features/content-reading/hooks';
import { AnimatePresence } from 'framer-motion';
import type { MarkdownSection } from '@/services/section/parsing';

export interface ReadingUIProps {
  markdown: string;
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
  onScrollProgressChange: (progress: number) => void;
  isZenMode: boolean;
  zenControlsVisible: boolean;
  isDialogOpen: boolean;
  onZenTap: () => void;
  onZenDoubleTap: () => void;
  onExit: () => void;
}

const ReadingUI: React.FC<ReadingUIProps> = memo(
  ({
    markdown,
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
    onScrollProgressChange,
    isZenMode,
    zenControlsVisible,
    isDialogOpen,
    onZenTap,
    onZenDoubleTap,
    onExit,
  }) => {
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const pendingFloatingPickerOpen = useThemeStore((state) => state.pendingFloatingPickerOpen);
    const openFloatingPicker = useThemeStore((state) => state.openFloatingPicker);

    const { isControlsVisible, handleInteraction, handleDoubleClick } = useControls({
      goToNext,
      goToPrevious,
      readingMode,
    });

    // Scroll to top when changing sections (card mode)
    useEffect(() => {
      if (readingMode === 'card' && scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
    }, [currentIndex, readingMode]);

    // Open floating theme picker after settings sheet closes
    useEffect(() => {
      if (!settingsOpen && pendingFloatingPickerOpen) {
        const timer = setTimeout(() => {
          openFloatingPicker();
        }, 350);
        return () => clearTimeout(timer);
      }
    }, [settingsOpen, pendingFloatingPickerOpen, openFloatingPicker]);

    // Jump to specific section (works in both card and scroll mode)
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

    // Handle section visibility for marking sections as read in scroll mode
    const handleSectionVisible = useCallback(
      (index: number) => {
        markSectionAsRead(index);
      },
      [markSectionAsRead]
    );

    // Determine if controls should be visible (hide when dialog is open)
    const shouldShowControls = !isDialogOpen && (!isZenMode || zenControlsVisible);

    // Combined double-click handler for zen mode and regular mode
    const handleContentDoubleClick = () => {
      if (isZenMode) {
        onZenDoubleTap();
      } else {
        handleDoubleClick();
      }
    };

    // Combined click handler for zen mode tap
    const handleContentClick = () => {
      if (isZenMode) {
        onZenTap();
      }
    };

    return (
      <div className="h-full relative bg-background text-foreground" onClick={handleContentClick}>
        {/* Content Container - Card Mode or Scroll Mode */}
        {readingMode === 'card' ? (
          <ContentReader
            markdown={markdown}
            goToNext={goToNext}
            goToPrevious={goToPrevious}
            isTransitioning={isTransitioning}
            scrollRef={scrollRef}
            handleDoubleClick={handleContentDoubleClick}
            currentSection={currentSection}
          />
        ) : (
          <ScrollContentReader
            sections={sections}
            scrollRef={scrollRef}
            handleDoubleClick={handleContentDoubleClick}
            onScrollProgress={onScrollProgressChange}
            onSectionVisible={handleSectionVisible}
          />
        )}

        {/* Header - hidden in zen mode unless controls visible */}
        <AnimatePresence>
          {shouldShowControls && (
            <div className="absolute top-0 left-0 right-0 z-50">
              <Header
                onExit={onExit}
                onSettings={() => {
                  setSettingsOpen(true);
                  handleInteraction();
                }}
                onMenu={() => {
                  setMenuOpen(true);
                  handleInteraction();
                }}
                isVisible={isControlsVisible || zenControlsVisible}
              />
            </div>
          )}
        </AnimatePresence>

        {/* Navigation Controls - hidden in zen mode and scroll mode */}
        <AnimatePresence>
          {shouldShowControls && readingMode === 'card' && (
            <div className="absolute bottom-0 left-0 right-0 z-50">
              <NavigationControls
                currentIndex={currentIndex}
                total={sections.length}
                onPrevious={() => {
                  goToPrevious();
                  handleInteraction();
                }}
                onNext={() => {
                  goToNext();
                  handleInteraction();
                }}
                isVisible={isControlsVisible || zenControlsVisible}
              />
            </div>
          )}
        </AnimatePresence>

        {/* Desktop side progress - hidden in zen mode */}
        {!isZenMode && (
          <DesktopProgressIndicator
            currentIndex={currentIndex}
            total={sections.length}
            onSelectSection={(index) => handleSelectCard(index)}
            sections={sections}
            readSections={readSections}
            readingMode={readingMode}
            scrollProgress={scrollProgress}
          />
        )}

        {/* Zen Mode Position Indicator - only shown in zen mode */}
        {isZenMode && <ZenPositionIndicator currentIndex={currentIndex} total={sections.length} />}

        {/* Sections Sheet */}
        <SectionsSheet
          currentIndex={currentIndex}
          handleSelectCard={handleSelectCard}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          sections={sections}
          readSections={readSections}
        />

        {/* Reading Settings Sheet */}
        <ReadingSettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />

        {/* Floating Theme Picker */}
        <FloatingThemePicker />
      </div>
    );
  }
);

ReadingUI.displayName = 'ReadingUI';

export default ReadingUI;
