import React, { lazy, memo, Suspense, useCallback, useEffect, useRef, useState } from 'react';

import SearchDialog from '@/components/features/content-reading/components/search/search-dialog';
import { useControls } from '@/components/features/content-reading/hooks';
import { ExportSnippetsProvider } from '@/components/features/image-export/context/export-snippets-context';
import { useTabsStore } from '@/components/features/tabs/store/tabs-store';
import FloatingThemePicker from '@/components/shared/theme/components/floating-theme-picker';
import { useThemeFloatingPicker } from '@/components/shared/theme/store/theme-store';
import { cn } from '@/lib/utils';

import { useReadingSettingsStore } from '../../settings/store/reading-settings-store';
import {
  useReadingActions,
  useReadingContent,
  useReadingNavigation,
  useReadingProgress,
  useReadingSections,
  useReadingTabId,
  useReadingZen,
  useZenMode,
} from '../hooks';
import {
  ContentReader,
  NavigationControls,
  ScrollContentReader,
  SectionBreadcrumb,
  SwipeHint,
} from './layout';
import MilestoneCelebration from './layout/milestone-celebration';
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
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}

export interface ReadingCoreProps {
  viewMode: 'preview' | 'edit';
  headerSlot?: (handlers: HeaderHandlers) => React.ReactNode;
  editModeContent?: React.ReactNode;
  onSectionClick?: (sectionIndex: number) => void;
  onPresent?: () => void;
}

/**
 * ReadingCore - Shared reading logic for both fullscreen and inline modes
 *
 * Reads all navigation state from the ReadingTabContext + Zustand store.
 * Only accepts per-consumer customization as props.
 */
const ReadingCore: React.FC<ReadingCoreProps> = memo(
  ({ viewMode, headerSlot, editModeContent, onSectionClick, onPresent }) => {
    const tabId = useReadingTabId();
    const { currentIndex, readingMode } = useReadingNavigation();
    const sections = useReadingSections();
    const { metadata } = useReadingContent();
    const readSections = useReadingProgress();
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
              scrollRef={scrollRef}
              handleDoubleClick={handleContentDoubleClick}
              onSectionClick={onSectionClick}
            />
          ) : (
            <ScrollContentReader
              scrollRef={scrollRef}
              handleDoubleClick={handleContentDoubleClick}
              onScrollProgress={handleScrollProgress}
              onSectionVisible={handleSectionVisible}
              onSectionClick={onSectionClick}
            />
          )}

          {/* Breadcrumb - standalone overlay when there is no header to contain it */}
          {shouldShowControls && readingMode === 'card' && !headerSlot && (
            <div className="absolute top-0 left-0 z-50 p-2">
              <SectionBreadcrumb onNavigate={handleSelectCard} />
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
                    <SectionBreadcrumb onNavigate={handleSelectCard} variant="inline" />
                  ) : undefined,
                mobileBreadcrumb:
                  readingMode === 'card' ? (
                    <SectionBreadcrumb onNavigate={handleSelectCard} variant="mobile" />
                  ) : undefined,
                scrollRef,
              })}
            </div>
          )}

          {/* Swipe hint - shown once on touch devices in card mode */}
          {readingMode === 'card' && <SwipeHint />}

          {/* Navigation Controls - side arrows, hidden in zen mode and scroll mode */}
          {shouldShowControls && readingMode === 'card' && (
            <NavigationControls
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

          {/* Milestone celebrations — card mode only */}
          {readingMode === 'card' && (
            <MilestoneCelebration readCount={readSections.size} total={sections.length} />
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
