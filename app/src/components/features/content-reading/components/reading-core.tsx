import React, { lazy, memo, Suspense, useCallback, useMemo, useState } from 'react';

import SearchDialog from '@/components/features/content-reading/components/search/search-dialog';
import { ExportSnippetsProvider } from '@/components/features/image-export/context/export-snippets-context';
import FloatingThemePicker from '@/components/shared/theme/components/floating-theme-picker';
import { useLocalStorage, useMobile } from '@/hooks';
import { cn } from '@/lib/utils';

import { useReadingTimer } from '../../analytics/hooks/use-reading-timer';
import { useReadingSettingsStore } from '../../settings/store/reading-settings-store';
import TTSContext from '../context/tts-context';
import {
  useReadingContent,
  useReadingNavigation,
  useReadingProgress,
  useReadingSections,
  useReadingTabId,
} from '../hooks';
import { useReadingDialogs } from '../hooks/use-reading-dialogs';
import { useReadingInteractions } from '../hooks/use-reading-interactions';
import { useTTS } from '../hooks/use-tts';
import {
  ContentReader,
  NavigationControls,
  ScrollContentReader,
  SectionBreadcrumb,
  SwipeHint,
  TTSControls,
} from './layout';
import MilestoneCelebration from './layout/milestone-celebration';
import ReadingBackground from './reading-background';
import ReadingToc from './table-of-contents/reading-toc';

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
  onToc: () => void;
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
    const { readingMode, currentIndex } = useReadingNavigation();
    const sections = useReadingSections();
    const { metadata } = useReadingContent();
    const readSections = useReadingProgress();

    useReadingTimer(tabId);

    const [searchOpen, setSearchOpen] = useState(false);
    const openSearch = useCallback(() => setSearchOpen(true), []);

    const {
      isControlsVisible,
      shouldShowControls,
      zenControlsVisible,
      scrollRef,
      handleInteraction,
      handleContentClick,
      handleContentDoubleClick,
      handleSelectCard,
      handleSectionVisible,
      goToNext,
      goToPrevious,
      handleScrollProgress,
    } = useReadingInteractions(openSearch);

    const {
      settingsOpen,
      pdfExportOpen,
      tocOpen,
      setSettingsOpen,
      setPdfExportOpen,
      setTocOpen,
      handleSettingsOpen,
      handlePdfExportOpen,
      handleTocOpen,
    } = useReadingDialogs(handleInteraction);

    const { isMobile } = useMobile();

    const tts = useTTS();

    const backgroundType = useReadingSettingsStore((s) => s.background.backgroundType);
    const hasCustomBackground = backgroundType !== 'theme';

    const { storedValue: showProgress } = useLocalStorage('showCardProgress', true);
    const { storedValue: tocSide, setValue: setTocSide } = useLocalStorage<'left' | 'right'>(
      'tocSide',
      'left'
    );
    const toggleTocSide = useCallback(
      () => setTocSide(tocSide === 'left' ? 'right' : 'left'),
      [tocSide, setTocSide]
    );

    const flatSections = useMemo(
      () => sections.map(({ title, level }, index) => ({ id: index, title, level })),
      [sections]
    );

    if (viewMode === 'edit' && editModeContent) {
      return <div className="h-full relative bg-background text-foreground">{editModeContent}</div>;
    }

    return (
      <TTSContext.Provider value={tts}>
        <ExportSnippetsProvider sections={sections}>
          <div className="h-full flex">
            <ReadingToc
              isMobile={isMobile}
              tocOpen={tocOpen}
              setTocOpen={setTocOpen}
              tocSide={tocSide}
              toggleTocSide={toggleTocSide}
              sectionCount={sections.length}
              flatSections={flatSections}
              currentIndex={currentIndex}
              readSections={readSections}
              showProgress={showProgress}
              handleSelectCard={handleSelectCard}
            />

            {/* Main reading area */}
            <div
              className={cn(
                'flex-1 h-full relative text-foreground min-w-0',
                !hasCustomBackground && 'bg-card'
              )}
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
                    onSearch: openSearch,
                    onPresent,
                    onPdfExport: handlePdfExportOpen,
                    onToc: handleTocOpen,
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

              {/* TTS Controls — self-contained, shown only when actively playing or paused */}
              {shouldShowControls && (
                <TTSControls
                  className={cn(
                    'absolute left-1/2 -translate-x-1/2 z-50',
                    readingMode === 'card' ? 'bottom-16' : 'bottom-6'
                  )}
                />
              )}

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
          </div>
        </ExportSnippetsProvider>
      </TTSContext.Provider>
    );
  }
);

ReadingCore.displayName = 'ReadingCore';

export default ReadingCore;
