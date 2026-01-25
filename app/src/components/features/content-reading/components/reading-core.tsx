import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useThemeFloatingPicker } from '@/components/shared/theme/store/theme-store';
import { useControls } from '@/components/features/content-reading/hooks';
import {
  NavigationControls,
  DesktopProgressIndicator,
  ContentReader,
  ScrollContentReader,
  ZenPositionIndicator,
} from './layout';
import SectionsSheet from './table-of-contents/sections-sheet';
import { ReadingSettingsSheet } from '@/components/features/settings';
import FloatingThemePicker from '@/components/shared/theme/components/floating-theme-picker';
import type { MarkdownSection, MarkdownMetadata } from '@/services/section/parsing';

interface HeaderHandlers {
  onSettings: () => void;
  onMenu: () => void;
  isVisible: boolean;
}

export interface ReadingCoreProps {
  // Content data
  markdown: string;
  metadata: MarkdownMetadata | null;
  sections: MarkdownSection[];
  readSections: Set<number>;
  currentIndex: number;
  currentSection: MarkdownSection;
  isTransitioning: boolean;
  readingMode: 'card' | 'scroll';
  scrollProgress: number;

  // Navigation callbacks
  goToNext: () => void;
  goToPrevious: () => void;
  changeSection: (index: number) => void;
  markSectionAsRead: (index: number) => void;
  onScrollProgressChange: (progress: number) => void;

  // View mode
  viewMode: 'preview' | 'edit';

  // Header customization - render function that receives handlers
  headerSlot?: (handlers: HeaderHandlers) => React.ReactNode;

  // Edit mode content (for inline viewer)
  editModeContent?: React.ReactNode;

  // Zen mode props (optional, for fullscreen only)
  isZenMode?: boolean;
  zenControlsVisible?: boolean;
  isDialogOpen?: boolean;
  onZenTap?: () => void;
  onZenDoubleTap?: () => void;
}

/**
 * ReadingCore - Shared reading logic for both fullscreen and inline modes
 *
 * This component contains all the shared logic between ReadingUI and InlineMarkdownViewer:
 * - Content rendering (card/scroll modes)
 * - Navigation controls
 * - Progress indicators
 * - Sections/Settings sheets
 * - Section navigation callbacks
 * - Scroll management
 *
 * The only differences between fullscreen and inline are handled via props:
 * - headerSlot: Custom header component (Exit button vs Fullscreen button)
 * - isZenMode: Zen mode support (fullscreen only)
 * - editModeContent: Edit mode support (inline only)
 */
const ReadingCore: React.FC<ReadingCoreProps> = memo(
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
    onScrollProgressChange,
    viewMode,
    headerSlot,
    editModeContent,
    isZenMode = false,
    zenControlsVisible = false,
    isDialogOpen = false,
    onZenTap,
    onZenDoubleTap,
  }) => {
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const { openFloatingPicker, pendingFloatingPickerOpen } = useThemeFloatingPicker();

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

    // Combined double-click handler for zen mode and regular mode
    const handleContentDoubleClick = useCallback(() => {
      if (isZenMode && onZenDoubleTap) {
        onZenDoubleTap();
      } else {
        handleDoubleClick();
      }
    }, [isZenMode, onZenDoubleTap, handleDoubleClick]);

    // Combined click handler for zen mode tap
    const handleContentClick = useCallback(() => {
      if (isZenMode && onZenTap) {
        onZenTap();
      }
    }, [isZenMode, onZenTap]);

    // Handle sheet interactions
    const handleSettingsOpen = useCallback(() => {
      setSettingsOpen(true);
      handleInteraction();
    }, [handleInteraction]);

    const handleMenuOpen = useCallback(() => {
      setMenuOpen(true);
      handleInteraction();
    }, [handleInteraction]);

    // If in edit mode, show edit content
    if (viewMode === 'edit' && editModeContent) {
      return <div className="h-full relative bg-background text-foreground">{editModeContent}</div>;
    }

    // Determine if controls should be visible
    const shouldShowControls = !isDialogOpen && (!isZenMode || zenControlsVisible);

    return (
      <div className="h-full relative bg-background text-foreground" onClick={handleContentClick}>
        {/* Content Container - Card Mode or Scroll Mode */}
        {readingMode === 'card' ? (
          <ContentReader
            markdown={markdown}
            metadata={metadata}
            currentIndex={currentIndex}
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
            metadata={metadata}
            scrollRef={scrollRef}
            handleDoubleClick={handleContentDoubleClick}
            onScrollProgress={onScrollProgressChange}
            onSectionVisible={handleSectionVisible}
          />
        )}

        {/* Header - passed from parent */}
        <AnimatePresence>
          {shouldShowControls && headerSlot && (
            <div className="absolute top-0 left-0 right-0 z-50">
              {headerSlot({
                onSettings: handleSettingsOpen,
                onMenu: handleMenuOpen,
                isVisible: isControlsVisible || zenControlsVisible,
              })}
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

ReadingCore.displayName = 'ReadingCore';

export default ReadingCore;
