import React, { useState, useEffect, useCallback, memo } from 'react';
import { LoadingState } from '@/components/features/content-reading/components/layout';
import { useZenMode } from '@/components/features/content-reading/hooks/use-zen-mode';
import { useTabNavigation } from '../hooks/use-tab-navigation';
import { useTabsStore } from '../store/tabs-store';
import ReadingUI from '@/components/features/content-reading/components/reading-ui';

interface FullscreenMarkdownViewerProps {
  tabId: string;
  onExit: () => void;
}

const FullscreenMarkdownViewer: React.FC<FullscreenMarkdownViewerProps> = memo(
  ({ tabId, onExit }) => {
    // Local zen mode state
    const [isZenMode, setIsZenMode] = useState(false);
    const [zenControlsVisible, setZenControlsVisible] = useState(false);

    const tab = useTabsStore((state) => state.tabs.find((t) => t.id === tabId));

    const {
      sections,
      metadata,
      readSections,
      currentIndex,
      readingMode,
      scrollProgress,
      isTransitioning,
      goToNext,
      goToPrevious,
      changeSection,
      markSectionAsRead,
      getSection,
      handleScrollProgress,
    } = useTabNavigation(tabId);

    const showZenControls = useCallback(() => setZenControlsVisible(true), []);
    const hideZenControls = useCallback(() => setZenControlsVisible(false), []);
    const setZenMode = useCallback((v: boolean) => setIsZenMode(v), []);

    const { handleZenTap, handleZenDoubleTap } = useZenMode({
      isZenMode,
      setZenMode,
      showZenControls,
      hideZenControls,
    });

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

    // Handle history for back button
    useEffect(() => {
      window.history.pushState({ fullscreen: true }, '');

      const handlePopState = () => {
        onExit();
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }, [onExit]);

    const currentSection = getSection(currentIndex);

    if (!tab || sections.length === 0 || !currentSection) {
      return (
        <div className="fixed inset-0 z-50 bg-background text-foreground overflow-hidden">
          <LoadingState />
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-50 bg-background text-foreground overflow-hidden">
        <ReadingUI
          markdown={tab.content}
          metadata={metadata}
          sections={sections}
          readSections={readSections}
          currentIndex={currentIndex}
          currentSection={currentSection}
          isTransitioning={isTransitioning}
          readingMode={readingMode}
          scrollProgress={scrollProgress}
          goToNext={goToNext}
          goToPrevious={goToPrevious}
          changeSection={changeSection}
          markSectionAsRead={markSectionAsRead}
          onScrollProgressChange={handleScrollProgress}
          isZenMode={isZenMode}
          zenControlsVisible={zenControlsVisible}
          isDialogOpen={false}
          onZenTap={handleZenTap}
          onZenDoubleTap={handleZenDoubleTap}
          onExit={onExit}
        />
      </div>
    );
  }
);

FullscreenMarkdownViewer.displayName = 'FullscreenMarkdownViewer';

export default FullscreenMarkdownViewer;
