import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import SectionsSheet from '@/components/features/content-reading/components/table-of-contents/sections-sheet';
import ReadingSettingsSheet from '@/components/features/settings/components/reading-settings-selector';
import FloatingThemePicker from '@/components/shared/theme/components/floating-theme-picker';
import { useThemeStore } from '@/components/shared/theme/store/theme-store';
import {
  Header,
  NavigationControls,
  DesktopProgressIndicator,
  LoadingState,
  ContentReader,
  ScrollContentReader,
  ZenPositionIndicator,
} from '@/components/features/content-reading/components/layout';
import { useControls } from '@/components/features/content-reading/hooks';
import { useTabsStore } from '../store/tabs-store';
import { AnimatePresence } from 'framer-motion';

interface FullscreenMarkdownViewerProps {
  tabId: string;
  onExit: () => void;
}

const FullscreenMarkdownViewer: React.FC<FullscreenMarkdownViewerProps> = memo(
  ({ tabId, onExit }) => {
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const zenControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Zen mode state (local to fullscreen)
    const [isZenMode, setIsZenMode] = useState(false);
    const [zenControlsVisible, setZenControlsVisible] = useState(false);
    const [isDialogOpen] = useState(false);

    const pendingFloatingPickerOpen = useThemeStore((state) => state.pendingFloatingPickerOpen);
    const openFloatingPicker = useThemeStore((state) => state.openFloatingPicker);

    // Get tab data from store
    const tab = useTabsStore((state) => state.tabs.find((t) => t.id === tabId));
    const updateTabReadingState = useTabsStore((state) => state.updateTabReadingState);

    // Extract reading state from tab
    const sections = useMemo(() => tab?.readingState.sections ?? [], [tab?.readingState.sections]);
    const readSections = useMemo(
      () => tab?.readingState.readSections ?? new Set<number>(),
      [tab?.readingState.readSections]
    );
    const currentIndex = tab?.readingState.currentIndex ?? 0;
    const readingMode = tab?.readingState.readingMode ?? 'card';
    const scrollProgress = tab?.readingState.scrollProgress ?? 0;

    // Navigation functions
    const changeSection = useCallback(
      (newIndex: number) => {
        if (!tab || newIndex < 0 || newIndex >= sections.length) return;

        setIsTransitioning(true);

        setTimeout(() => {
          const newReadSections = new Set(readSections);
          newReadSections.add(newIndex);

          updateTabReadingState(tabId, {
            currentIndex: newIndex,
            readSections: newReadSections,
          });
          setIsTransitioning(false);
        }, 200);
      },
      [tab, tabId, sections.length, readSections, updateTabReadingState]
    );

    const goToNext = useCallback(() => {
      if (currentIndex < sections.length - 1) {
        changeSection(currentIndex + 1);
      }
    }, [currentIndex, sections.length, changeSection]);

    const goToPrevious = useCallback(() => {
      if (currentIndex > 0) {
        changeSection(currentIndex - 1);
      }
    }, [currentIndex, changeSection]);

    const markSectionAsRead = useCallback(
      (index: number) => {
        if (!tab) return;
        const newReadSections = new Set(readSections);
        newReadSections.add(index);
        updateTabReadingState(tabId, { readSections: newReadSections });
      },
      [tab, tabId, readSections, updateTabReadingState]
    );

    const getSection = useCallback(
      (index: number) => {
        if (index < 0 || index >= sections.length) return null;
        return sections[index];
      },
      [sections]
    );

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

    // Handle zen mode tap - show controls temporarily
    const handleZenTap = useCallback(() => {
      if (!isZenMode) return;

      if (zenControlsTimeoutRef.current) {
        clearTimeout(zenControlsTimeoutRef.current);
      }

      setZenControlsVisible(true);

      zenControlsTimeoutRef.current = setTimeout(() => {
        setZenControlsVisible(false);
      }, 2000);
    }, [isZenMode]);

    // Handle double-tap in zen mode - exit zen mode
    const handleZenDoubleTap = useCallback(() => {
      if (isZenMode) {
        setIsZenMode(false);
      }
    }, [isZenMode]);

    // Cleanup zen controls timeout on unmount
    useEffect(() => {
      return () => {
        if (zenControlsTimeoutRef.current) {
          clearTimeout(zenControlsTimeoutRef.current);
        }
      };
    }, []);

    // Handle ESC key to exit zen mode or fullscreen
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (isZenMode) {
            setIsZenMode(false);
          } else {
            onExit();
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isZenMode, onExit]);

    // Open floating theme picker after settings sheet closes
    useEffect(() => {
      if (!settingsOpen && pendingFloatingPickerOpen) {
        const timer = setTimeout(() => {
          openFloatingPicker();
        }, 350);
        return () => clearTimeout(timer);
      }
    }, [settingsOpen, pendingFloatingPickerOpen, openFloatingPicker]);

    // Handle history for back button
    useEffect(() => {
      window.history.pushState({ fullscreen: true }, '');

      const handlePopState = () => {
        onExit();
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }, [onExit]);

    // Jump to specific section
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

    // Handle scroll progress update
    const handleScrollProgress = useCallback(
      (progress: number) => {
        updateTabReadingState(tabId, { scrollProgress: progress });
      },
      [tabId, updateTabReadingState]
    );

    // Handle section visibility
    const handleSectionVisible = useCallback(
      (index: number) => {
        markSectionAsRead(index);
      },
      [markSectionAsRead]
    );

    // Determine if controls should be visible
    const shouldShowControls = !isDialogOpen && (!isZenMode || zenControlsVisible);

    const currentSection = getSection(currentIndex);

    if (!tab || sections.length === 0 || !currentSection) {
      return (
        <div className="fixed inset-0 z-50 bg-background text-foreground overflow-hidden">
          <LoadingState />
        </div>
      );
    }

    // Combined double-click handler
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
      <div className="fixed inset-0 z-50 bg-background text-foreground overflow-hidden">
        <div className="h-full relative" onClick={handleContentClick}>
          {/* Content Container */}
          {readingMode === 'card' ? (
            <ContentReader
              markdown={tab.content}
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

          {/* Zen Mode Position Indicator */}
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
      </div>
    );
  }
);

FullscreenMarkdownViewer.displayName = 'FullscreenMarkdownViewer';

export default FullscreenMarkdownViewer;
