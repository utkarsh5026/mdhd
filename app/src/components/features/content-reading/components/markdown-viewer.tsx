import React, { useState, useEffect, useRef, useCallback } from 'react';
import SectionsSheet from './table-of-contents/sections-sheet';
import ReadingSettingsSheet from '@/components/features/settings/components/reading-settings-selector';
import {
  Header,
  NavigationControls,
  DesktopProgressIndicator,
  LoadingState,
  ContentReader,
  ScrollContentReader,
  ZenPositionIndicator,
} from './layout';
import { useControls, useReading } from '@/components/features/content-reading/hooks';
import {
  useIsZenMode,
  useZenControlsVisible,
  useZenModeActions,
  useIsDialogOpen,
  useReadingMode,
  useReadingModeActions,
  useScrollProgress,
} from '@/components/features/content-reading/store/use-reading-store';
import { AnimatePresence } from 'framer-motion';

interface MarkdownViewerProps {
  markdown: string;
}

interface MarkdownViewerProviderProps extends MarkdownViewerProps {
  exitFullScreen: () => void;
}

const MarkdownViewer: React.FC<MarkdownViewerProviderProps> = ({ exitFullScreen, markdown }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const zenControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isZenMode = useIsZenMode();
  const zenControlsVisible = useZenControlsVisible();
  const isDialogOpen = useIsDialogOpen();
  const { setZenMode, showZenControls, hideZenControls } = useZenModeActions();
  const readingMode = useReadingMode();
  const scrollProgress = useScrollProgress();
  const { setScrollProgress } = useReadingModeActions();

  const {
    sections,
    readSections,
    currentIndex,
    isTransitioning,
    goToNext,
    goToPrevious,
    changeSection,
    getSection,
    initializeReading,
    resetReading,
    markSectionAsRead,
  } = useReading(markdown);

  const { isControlsVisible, handleInteraction, handleDoubleClick } = useControls({
    goToNext,
    goToPrevious,
    readingMode,
  });

  /**
   * Initialize reading when sections are loaded
   */
  useEffect(() => {
    initializeReading();
    return () => {
      resetReading();
    };
  }, [initializeReading, resetReading]);

  /**
   * Scroll to top when changing sections (only in card mode)
   */
  useEffect(() => {
    if (readingMode === 'card' && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [currentIndex, readingMode]);

  /**
   * Handle zen mode tap - show controls temporarily
   */
  const handleZenTap = useCallback(() => {
    if (!isZenMode) return;

    // Clear existing timeout
    if (zenControlsTimeoutRef.current) {
      clearTimeout(zenControlsTimeoutRef.current);
    }

    // Show controls
    showZenControls();

    // Hide after 2 seconds
    zenControlsTimeoutRef.current = setTimeout(() => {
      hideZenControls();
    }, 2000);
  }, [isZenMode, showZenControls, hideZenControls]);

  /**
   * Handle double-tap in zen mode - exit zen mode
   */
  const handleZenDoubleTap = useCallback(() => {
    if (isZenMode) {
      setZenMode(false);
    }
  }, [isZenMode, setZenMode]);

  /**
   * Cleanup zen controls timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (zenControlsTimeoutRef.current) {
        clearTimeout(zenControlsTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Handle ESC key to exit zen mode
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isZenMode) {
        setZenMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZenMode, setZenMode]);

  /**
   * Jump to specific section (works in both card and scroll mode)
   */
  const handleSelectCard = useCallback(
    (index: number) => {
      if (readingMode === 'scroll') {
        // In scroll mode, scroll to the section element
        const sectionElement = document.getElementById(`section-${sections[index]?.id}`);
        if (sectionElement) {
          sectionElement.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
        markSectionAsRead(index);
      } else {
        // In card mode, change to that section
        if (index !== currentIndex) changeSection(index);
      }
    },
    [readingMode, sections, currentIndex, changeSection, markSectionAsRead]
  );

  /**
   * Handle scroll progress update from ScrollContentReader
   */
  const handleScrollProgress = useCallback(
    (progress: number) => {
      setScrollProgress(progress);
    },
    [setScrollProgress]
  );

  /**
   * Handle section visibility for marking sections as read in scroll mode
   */
  const handleSectionVisible = useCallback(
    (index: number) => {
      markSectionAsRead(index);
    },
    [markSectionAsRead]
  );

  // Determine if controls should be visible (hide when dialog is open)
  const shouldShowControls = !isDialogOpen && (!isZenMode || zenControlsVisible);

  const currentSection = getSection(currentIndex);

  if (sections.length === 0 || !currentSection) {
    return <LoadingState />;
  }

  // Combined double-click handler for zen mode and regular mode
  const handleContentDoubleClick = () => {
    if (isZenMode) {
      handleZenDoubleTap();
    } else {
      handleDoubleClick();
    }
  };

  // Combined click handler for zen mode tap
  const handleContentClick = () => {
    if (isZenMode) {
      handleZenTap();
    }
  };

  return (
    <>
      {/* Main Reading Area */}
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
            onScrollProgress={handleScrollProgress}
            onSectionVisible={handleSectionVisible}
          />
        )}

        {/* Header - hidden in zen mode unless controls visible */}
        <AnimatePresence>
          {shouldShowControls && (
            <div className="absolute top-0 left-0 right-0 z-50">
              <Header
                onExit={() => {
                  exitFullScreen();
                }}
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
      </div>
    </>
  );
};

const MarkdownViewerProvider: React.FC<
  MarkdownViewerProps & {
    markdown: string;
    exitFullScreen: () => void;
  }
> = ({ markdown, exitFullScreen }) => {
  useEffect(() => {
    window.history.pushState({ fullscreen: true }, '');

    const handlePopState = () => {
      exitFullScreen();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [exitFullScreen]);

  return (
    <div className="fixed inset-0 z-50 bg-background text-foreground overflow-hidden">
      <MarkdownViewer markdown={markdown} exitFullScreen={exitFullScreen} />
    </div>
  );
};

export default MarkdownViewerProvider;
