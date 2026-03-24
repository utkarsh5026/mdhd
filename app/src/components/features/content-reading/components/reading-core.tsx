import { ListOrdered, PanelLeft, PanelRight, X } from 'lucide-react';
import React, { lazy, memo, Suspense, useCallback, useMemo, useState } from 'react';

import SearchDialog from '@/components/features/content-reading/components/search/search-dialog';
import { ExportSnippetsProvider } from '@/components/features/image-export/context/export-snippets-context';
import FloatingThemePicker from '@/components/shared/theme/components/floating-theme-picker';
import { cn } from '@/lib/utils';

import { useReadingSettingsStore } from '../../settings/store/reading-settings-store';
import {
  useReadingContent,
  useReadingNavigation,
  useReadingProgress,
  useReadingSections,
} from '../hooks';
import { useReadingDialogs } from '../hooks/use-reading-dialogs';
import { useReadingInteractions } from '../hooks/use-reading-interactions';
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

import { BottomSheet, BottomSheetContent, BottomSheetTitle } from '@/components/ui/bottom-sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLocalStorage, useMobile } from '@/hooks';

import { TreeOfContents } from './table-of-contents/tree-of-contents';

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
    const { readingMode, currentIndex } = useReadingNavigation();
    const sections = useReadingSections();
    const { metadata } = useReadingContent();
    const readSections = useReadingProgress();

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

    const backgroundType = useReadingSettingsStore((s) => s.settings.background.backgroundType);
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
      <ExportSnippetsProvider sections={sections}>
        <div className="h-full flex">
          {/* Embedded TOC sidebar (desktop) */}
          {!isMobile && (
            <div
              className={cn(
                'h-full shrink-0 overflow-x-clip',
                'transition-[width] duration-300 ease-in-out',
                'bg-background/95 backdrop-blur-xl',
                tocSide === 'left'
                  ? 'order-first border-r border-border/30'
                  : 'order-last border-l border-border/30',
                tocOpen ? 'w-64 sm:w-72' : 'w-0 border-0'
              )}
            >
              {tocOpen && (
                <div className="flex flex-col h-full w-64 sm:w-72">
                  {/* Sidebar header */}
                  <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/30">
                    <div className="flex items-center gap-2">
                      <ListOrdered className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Contents</span>
                      <span className="text-xs text-muted-foreground/60">{sections.length}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={toggleTocSide}
                        className={cn(
                          'p-1 rounded-md',
                          'text-muted-foreground/60 hover:text-foreground',
                          'hover:bg-accent/60 transition-colors'
                        )}
                        aria-label={`Move to ${tocSide === 'left' ? 'right' : 'left'} side`}
                      >
                        {tocSide === 'left' ? (
                          <PanelRight className="h-3.5 w-3.5" />
                        ) : (
                          <PanelLeft className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => setTocOpen(false)}
                        className={cn(
                          'p-1 rounded-md',
                          'text-muted-foreground/60 hover:text-foreground',
                          'hover:bg-accent/60 transition-colors'
                        )}
                        aria-label="Close table of contents"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Scrollable TOC tree */}
                  <ScrollArea className="flex-1">
                    <TreeOfContents
                      sections={flatSections}
                      currentIndex={currentIndex}
                      readSections={readSections}
                      showProgress={showProgress}
                      handleSelectCard={handleSelectCard}
                    />
                  </ScrollArea>
                </div>
              )}
            </div>
          )}

          {/* TOC BottomSheet (mobile) */}
          {isMobile && (
            <BottomSheet open={tocOpen} onOpenChange={setTocOpen}>
              <BottomSheetContent>
                <BottomSheetTitle>Contents</BottomSheetTitle>
                <ScrollArea className="flex-1 max-h-[55vh]">
                  <TreeOfContents
                    sections={flatSections}
                    currentIndex={currentIndex}
                    readSections={readSections}
                    showProgress={showProgress}
                    handleSelectCard={(index) => {
                      handleSelectCard(index);
                      setTocOpen(false);
                    }}
                  />
                </ScrollArea>
              </BottomSheetContent>
            </BottomSheet>
          )}

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
    );
  }
);

ReadingCore.displayName = 'ReadingCore';

export default ReadingCore;
