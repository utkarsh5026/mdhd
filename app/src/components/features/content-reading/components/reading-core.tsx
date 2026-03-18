import React, { lazy, memo, Suspense, useCallback, useEffect, useRef, useState } from 'react';

import { useControls } from '@/components/features/content-reading/hooks';
import FloatingThemePicker from '@/components/shared/theme/components/floating-theme-picker';
import { useThemeFloatingPicker } from '@/components/shared/theme/store/theme-store';
import type { MarkdownMetadata, MarkdownSection } from '@/services/section/parsing';

import {
  ContentReader,
  NavigationControls,
  ScrollContentReader,
  SectionBreadcrumb,
} from './layout';
import SectionsSheet from './table-of-contents/sections-sheet';

const ReadingSettingsSheet = lazy(() =>
  import('@/components/features/settings').then((module) => ({
    default: module.ReadingSettingsSheet,
  }))
);

interface HeaderHandlers {
  onSettings: () => void;
  onMenu: () => void;
  isVisible: boolean;
  breadcrumb?: React.ReactNode;
  mobileBreadcrumb?: React.ReactNode;
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
  updateCurrentIndex: (index: number) => void;
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
    goToNext,
    goToPrevious,
    changeSection,
    markSectionAsRead,
    updateCurrentIndex,
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

    useEffect(() => {
      if (readingMode === 'card' && scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
    }, [currentIndex, readingMode]);

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

    const handleSectionVisible = useCallback(
      (index: number) => {
        markSectionAsRead(index);
        updateCurrentIndex(index);
      },
      [markSectionAsRead, updateCurrentIndex]
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

        {/* Breadcrumb - standalone overlay when there is no header to contain it */}
        {shouldShowControls && readingMode === 'card' && !headerSlot && (
          <div className="absolute top-0 left-0 z-50 p-2">
            <SectionBreadcrumb
              sections={sections}
              currentIndex={currentIndex}
              onNavigate={handleSelectCard}
            />
          </div>
        )}

        {/* Header - breadcrumb is always injected into the header when one exists */}
        {shouldShowControls && headerSlot && (
          <div className="absolute top-0 left-0 right-0 z-50">
            {headerSlot({
              onSettings: handleSettingsOpen,
              onMenu: handleMenuOpen,
              isVisible: isControlsVisible || zenControlsVisible,
              breadcrumb:
                readingMode === 'card' ? (
                  <SectionBreadcrumb
                    sections={sections}
                    currentIndex={currentIndex}
                    onNavigate={handleSelectCard}
                    variant="inline"
                  />
                ) : undefined,
              mobileBreadcrumb:
                readingMode === 'card' ? (
                  <SectionBreadcrumb
                    sections={sections}
                    currentIndex={currentIndex}
                    onNavigate={handleSelectCard}
                    variant="mobile"
                  />
                ) : undefined,
            })}
          </div>
        )}

        {/* Navigation Controls - side arrows, hidden in zen mode and scroll mode */}
        {shouldShowControls && readingMode === 'card' && (
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
          />
        )}

        {/* Sections Sheet */}
        <SectionsSheet
          currentIndex={currentIndex}
          handleSelectCard={handleSelectCard}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          sections={sections}
          readSections={readSections}
        />

        {/* Reading Settings Sheet - Lazy loaded */}
        {settingsOpen && (
          <Suspense fallback={null}>
            <ReadingSettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
          </Suspense>
        )}

        {/* Floating Theme Picker */}
        <FloatingThemePicker />
      </div>
    );
  }
);

ReadingCore.displayName = 'ReadingCore';

export default ReadingCore;
