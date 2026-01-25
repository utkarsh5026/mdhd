import React, { useEffect } from 'react';
import { LoadingState } from './layout';
import { useReading } from '@/components/features/content-reading/hooks';
import { useZenMode } from '@/components/features/content-reading/hooks/use-zen-mode';
import {
  useIsZenMode,
  useZenControlsVisible,
  useZenModeActions,
  useIsDialogOpen,
  useReadingMode,
  useScrollProgress,
  useReadingModeActions,
} from '@/components/features/content-reading/store/use-reading-store';
import ReadingUI from './reading-ui';

interface MarkdownViewerProps {
  markdown: string;
}

interface MarkdownViewerProviderProps extends MarkdownViewerProps {
  exitFullScreen: () => void;
}

const MarkdownViewer: React.FC<MarkdownViewerProviderProps> = ({ exitFullScreen, markdown }) => {
  const {
    sections,
    metadata,
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

  const isZenMode = useIsZenMode();
  const zenControlsVisible = useZenControlsVisible();
  const isDialogOpen = useIsDialogOpen();
  const { setZenMode, showZenControls, hideZenControls } = useZenModeActions();
  const readingMode = useReadingMode();
  const scrollProgress = useScrollProgress();
  const { setScrollProgress } = useReadingModeActions();

  const { handleZenTap, handleZenDoubleTap } = useZenMode({
    isZenMode,
    setZenMode,
    showZenControls,
    hideZenControls,
  });

  // Initialize reading when sections are loaded
  useEffect(() => {
    initializeReading();
    return () => {
      resetReading();
    };
  }, [initializeReading, resetReading]);

  // Handle ESC key to exit zen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isZenMode) {
        setZenMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZenMode, setZenMode]);

  const currentSection = getSection(currentIndex);

  console.log('MarkdownViewer Render:', {
    sections,
    currentIndex,
    currentSection,
  });

  if (sections.length === 0 || !currentSection) {
    return <LoadingState />;
  }

  return (
    <ReadingUI
      markdown={markdown}
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
      onScrollProgressChange={setScrollProgress}
      isZenMode={isZenMode}
      zenControlsVisible={zenControlsVisible}
      isDialogOpen={isDialogOpen}
      onZenTap={handleZenTap}
      onZenDoubleTap={handleZenDoubleTap}
      onExit={exitFullScreen}
    />
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
