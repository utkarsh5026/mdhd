import React, { useState, useEffect, useRef, useCallback } from "react";
import SectionsSheet from "./table-of-contents/sections-sheet";
import ReadingSettingsSheet from "@/components/features/settings/components/reading-settings-selector";
import { ReadingSettingsProvider } from "@/components/features/settings/context/ReadingSettingsProvider";
import {
  Header,
  NavigationControls,
  DesktopProgressIndicator,
  LoadingState,
  ContentReader,
  ZenPositionIndicator,
} from "./layout";
import {
  useControls,
  useReading,
} from "@/components/features/content-reading/hooks";
import {
  useIsZenMode,
  useZenControlsVisible,
  useZenModeActions,
} from "@/components/features/content-reading/store/use-reading-store";
import { AnimatePresence } from "framer-motion";

interface MarkdownViewerProps {
  markdown: string;
}

interface MarkdownViewerProviderProps extends MarkdownViewerProps {
  exitFullScreen: () => void;
}

const MarkdownViewer: React.FC<MarkdownViewerProviderProps> = ({
  exitFullScreen,
  markdown,
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const zenControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isZenMode = useIsZenMode();
  const zenControlsVisible = useZenControlsVisible();
  const { setZenMode, showZenControls, hideZenControls } = useZenModeActions();

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
  } = useReading(markdown);

  const { isControlsVisible, handleInteraction, handleDoubleClick } =
    useControls({
      goToNext,
      goToPrevious,
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
   * Scroll to top when changing sections
   */
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [currentIndex]);

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
      if (e.key === "Escape" && isZenMode) {
        setZenMode(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isZenMode, setZenMode]);

  /**
   * Jump to specific section
   */
  const handleSelectCard = (index: number) => {
    if (index !== currentIndex) changeSection(index);
  };

  // Determine if controls should be visible
  const shouldShowControls = !isZenMode || zenControlsVisible;

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
      <div
        className="h-full relative bg-background text-foreground"
        onClick={handleContentClick}
      >
        {/* Content Container */}
        <ContentReader
          markdown={markdown}
          goToNext={goToNext}
          goToPrevious={goToPrevious}
          isTransitioning={isTransitioning}
          scrollRef={scrollRef}
          handleDoubleClick={handleContentDoubleClick}
          currentSection={currentSection}
        />

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

        {/* Navigation Controls - hidden in zen mode unless controls visible */}
        <AnimatePresence>
          {shouldShowControls && (
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
          />
        )}

        {/* Zen Mode Position Indicator - only shown in zen mode */}
        {isZenMode && (
          <ZenPositionIndicator
            currentIndex={currentIndex}
            total={sections.length}
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

        {/* Reading Settings Sheet */}
        <ReadingSettingsSheet
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
        />
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
    window.history.pushState({ fullscreen: true }, "");

    const handlePopState = () => {
      exitFullScreen();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [exitFullScreen]);

  return (
    <ReadingSettingsProvider>
      <div className="fixed inset-0 z-50 bg-background text-foreground overflow-hidden">
        <MarkdownViewer markdown={markdown} exitFullScreen={exitFullScreen} />
      </div>
    </ReadingSettingsProvider>
  );
};

export default MarkdownViewerProvider;
