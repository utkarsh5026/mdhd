import React, { useState, useEffect, useRef } from "react";
import SectionsSheet from "./table-of-contents/sections-sheet";
import ReadingSettingsSheet from "@/components/features/settings/components/reading-settings-selector";
import { ReadingSettingsProvider } from "@/components/features/settings/context/ReadingSettingsProvider";
import {
  Header,
  NavigationControls,
  DesktopProgressIndicator,
  LoadingState,
  ContentReader,
} from "./layout";
import {
  useControls,
  useReading,
} from "@/components/features/content-reading/hooks";

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
   * Jump to specific section
   */
  const handleSelectCard = (index: number) => {
    if (index !== currentIndex) changeSection(index);
  };

  const currentSection = getSection(currentIndex);

  if (sections.length === 0 || !currentSection) {
    return <LoadingState />;
  }

  return (
    <>
      {/* Main Reading Area */}
      <div className="h-full relative">
        {/* Content Container */}
        <ContentReader
          markdown={markdown}
          goToNext={goToNext}
          goToPrevious={goToPrevious}
          isTransitioning={isTransitioning}
          scrollRef={scrollRef}
          handleDoubleClick={handleDoubleClick}
          currentSection={currentSection}
        />

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
            isVisible={isControlsVisible}
          />
        </div>

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
            isVisible={isControlsVisible}
          />
        </div>

        {/* Desktop side progress */}
        <DesktopProgressIndicator
          currentIndex={currentIndex}
          total={sections.length}
          onSelectSection={(index) => handleSelectCard(index)}
          sections={sections}
          readSections={readSections}
        />

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
