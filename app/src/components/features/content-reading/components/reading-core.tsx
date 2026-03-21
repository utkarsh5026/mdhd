import React, { lazy, memo, Suspense, useCallback, useEffect, useRef, useState } from 'react';

import SearchDialog from '@/components/features/content-reading/components/search/search-dialog';
import { useControls } from '@/components/features/content-reading/hooks';
import { ExportSnippetsProvider } from '@/components/features/image-export/context/export-snippets-context';
import FloatingThemePicker from '@/components/shared/theme/components/floating-theme-picker';
import { useThemeFloatingPicker } from '@/components/shared/theme/store/theme-store';
import { cn } from '@/lib/utils';
import type { MarkdownMetadata, MarkdownSection } from '@/services/section/parsing';

import { useReadingSettingsStore } from '../../settings/store/reading-settings-store';
import {
  ContentReader,
  NavigationControls,
  ScrollContentReader,
  SectionBreadcrumb,
} from './layout';
import ReadingBackground from './reading-background';

const ReadingSettingsSheet = lazy(() =>
  import('@/components/features/settings').then((module) => ({
    default: module.ReadingSettingsSheet,
  }))
);

const PdfExportDialog = lazy(() =>
  import('@/components/features/pdf-export').then((module) => ({
    default: module.PdfExportDialog,
  }))
);

interface HeaderHandlers {
  onSettings: () => void;
  onSearch: () => void;
  onPresent?: () => void;
  onPdfExport: () => void;
  isVisible: boolean;
  breadcrumb?: React.ReactNode;
  mobileBreadcrumb?: React.ReactNode;
}

export interface ReadingCoreProps {
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

  // Source file path (for path breadcrumb)
  sourcePath?: string;

  // View mode
  viewMode: 'preview' | 'edit';

  // Header customization - render function that receives handlers
  headerSlot?: (handlers: HeaderHandlers) => React.ReactNode;

  editModeContent?: React.ReactNode;
  onSectionClick?: (sectionIndex: number) => void;

  isZenMode?: boolean;
  zenControlsVisible?: boolean;
  isDialogOpen?: boolean;
  onZenTap?: () => void;
  onZenDoubleTap?: () => void;

  onPresent?: () => void;
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
    sourcePath,
    viewMode,
    headerSlot,
    editModeContent,
    onSectionClick,
    isZenMode = false,
    zenControlsVisible = false,
    isDialogOpen = false,
    onZenTap,
    onZenDoubleTap,
    onPresent,
  }) => {
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [pdfExportOpen, setPdfExportOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const backgroundType = useReadingSettingsStore((s) => s.settings.background.backgroundType);
    const hasCustomBackground = backgroundType !== 'theme';

    const { openFloatingPicker, pendingFloatingPickerOpen } = useThemeFloatingPicker();

    const { isControlsVisible, handleInteraction, handleDoubleClick } = useControls({
      goToNext,
      goToPrevious,
      readingMode,
      onSearch: () => setSearchOpen(true),
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

    const handlePdfExportOpen = useCallback(() => {
      setPdfExportOpen(true);
      handleInteraction();
    }, [handleInteraction]);

    if (viewMode === 'edit' && editModeContent) {
      return <div className="h-full relative bg-background text-foreground">{editModeContent}</div>;
    }

    // Determine if controls should be visible
    const shouldShowControls = !isDialogOpen && (!isZenMode || zenControlsVisible);

    return (
      <ExportSnippetsProvider sections={sections}>
        <div
          className={cn('h-full relative text-foreground', !hasCustomBackground && 'bg-card')}
          onClick={handleContentClick}
        >
          <ReadingBackground />
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
              onSectionClick={onSectionClick}
            />
          ) : (
            <ScrollContentReader
              sections={sections}
              metadata={metadata}
              scrollRef={scrollRef}
              handleDoubleClick={handleContentDoubleClick}
              onScrollProgress={onScrollProgressChange}
              onSectionVisible={handleSectionVisible}
              onSectionClick={onSectionClick}
            />
          )}

          {/* Breadcrumb - standalone overlay when there is no header to contain it */}
          {shouldShowControls && readingMode === 'card' && !headerSlot && (
            <div className="absolute top-0 left-0 z-50 p-2">
              <SectionBreadcrumb
                sections={sections}
                currentIndex={currentIndex}
                onNavigate={handleSelectCard}
                sourcePath={sourcePath}
              />
            </div>
          )}

          {/* Header - breadcrumb is always injected into the header when one exists */}
          {shouldShowControls && headerSlot && (
            <div className="absolute top-0 left-0 right-0 z-50">
              {headerSlot({
                onSettings: handleSettingsOpen,
                onSearch: () => setSearchOpen(true),
                onPresent,
                onPdfExport: handlePdfExportOpen,
                isVisible: isControlsVisible || zenControlsVisible,
                breadcrumb:
                  readingMode === 'card' ? (
                    <SectionBreadcrumb
                      sections={sections}
                      currentIndex={currentIndex}
                      onNavigate={handleSelectCard}
                      sourcePath={sourcePath}
                      variant="inline"
                    />
                  ) : undefined,
                mobileBreadcrumb:
                  readingMode === 'card' ? (
                    <SectionBreadcrumb
                      sections={sections}
                      currentIndex={currentIndex}
                      onNavigate={handleSelectCard}
                      sourcePath={sourcePath}
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

          {/* Reading Settings Sheet - Lazy loaded */}
          {settingsOpen && (
            <Suspense fallback={null}>
              <ReadingSettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
            </Suspense>
          )}

          {/* PDF Export Dialog - Lazy loaded */}
          {pdfExportOpen && (
            <Suspense fallback={null}>
              <PdfExportDialog
                open={pdfExportOpen}
                onOpenChange={setPdfExportOpen}
                title={(metadata?.title as string) ?? sections[0]?.title ?? 'Document'}
                sections={sections}
                metadata={metadata}
              />
            </Suspense>
          )}

          {/* Search Dialog */}
          <SearchDialog
            open={searchOpen}
            onOpenChange={setSearchOpen}
            sections={sections}
            onSelectSection={handleSelectCard}
          />

          {/* Floating Theme Picker */}
          <FloatingThemePicker />
        </div>
      </ExportSnippetsProvider>
    );
  }
);

ReadingCore.displayName = 'ReadingCore';

export default ReadingCore;
