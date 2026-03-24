import React, { lazy, memo, Suspense, useCallback, useState } from 'react';

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
    const { readingMode } = useReadingNavigation();
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
      setSettingsOpen,
      setPdfExportOpen,
      handleSettingsOpen,
      handlePdfExportOpen,
    } = useReadingDialogs(handleInteraction);

    const backgroundType = useReadingSettingsStore((s) => s.settings.background.backgroundType);
    const hasCustomBackground = backgroundType !== 'theme';

    if (viewMode === 'edit' && editModeContent) {
      return <div className="h-full relative bg-background text-foreground">{editModeContent}</div>;
    }

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
                onSearch: openSearch,
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
