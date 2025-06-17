import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import CustomMarkdownRenderer from "@/components/features/markdown/MarkdownRenderer";
import SectionsSheet from "./sidebar/SectionsSheet";
import ReadingSettingsSheet from "./settings/ReadingSettingsSheet";
import { ReadingSettingsProvider } from "./context/ReadingSettingsProvider";
import { useReadingSettings, fontFamilyMap } from "./context/ReadingContext";
import type { MarkdownSection } from "@/services/section/parsing";
import {
  Header,
  NavigationControls,
  DesktopProgressIndicator,
} from "./components";
import { useSwipeable } from "react-swipeable";

interface FullscreenCardViewProps {
  onExit: () => Promise<void>;
  onChangeSection: (index: number) => Promise<boolean>;
  sections: MarkdownSection[];
  getSection: (index: number) => MarkdownSection | null;
  readSections: Set<number>;
  markdown: string;
}

const CONTROLS_TIMEOUT = 4000;

interface FullscreenCardContentProps extends FullscreenCardViewProps {
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  exitFullScreen: () => void;
}

const FullscreenCardContent: React.FC<FullscreenCardContentProps> = ({
  settingsOpen,
  setSettingsOpen,
  menuOpen,
  setMenuOpen,
  exitFullScreen,
  onExit,
  onChangeSection,
  sections,
  getSection,
  readSections,
  markdown,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(Date.now());
  const { settings } = useReadingSettings();

  const initializedRef = useRef(false);

  /**
   * 🔄 Smoothly transitions to a new section with a nice fade effect
   * Tracks reading time and updates analytics too! 📊
   */
  const changeSection = useCallback(
    async (newIndex: number) => {
      await onExit();

      setIsTransitioning(true);

      setTimeout(async () => {
        setCurrentIndex(newIndex);
        setIsTransitioning(false);
        await onChangeSection(newIndex);
        startTimeRef.current = Date.now();
      }, 200);
    },
    [onExit, onChangeSection]
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

  const swipeHandlers = useSwipeable({
    onSwipedLeft: (eventData) => {
      if (eventData.event.target instanceof Element) {
        const target = eventData.event.target.closest(".no-swipe");
        if (target) return;
      }
      goToNext();
    },
    onSwipedRight: (eventData) => {
      if (eventData.event.target instanceof Element) {
        const target = eventData.event.target.closest(".no-swipe");
        if (target) return;
      }
      goToPrevious();
    },
    delta: 10,
    preventScrollOnSwipe: true,
    trackTouch: true,
    trackMouse: true,
  });

  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    setIsControlsVisible(true);

    controlsTimeoutRef.current = setTimeout(() => {
      setIsControlsVisible(false);
    }, CONTROLS_TIMEOUT);
  }, []);

  const handleInteraction = useCallback(() => {
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  // 🖱️ Handle mouse movement to show controls when hovering at top
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      // Show controls when mouse is within 80px of the top or bottom
      if (e.clientY <= 80 || e.clientY >= window.innerHeight - 80) {
        handleInteraction();
      }
    },
    [handleInteraction]
  );

  /**
   * 📚 Initializes the reading when the markdown is loaded
   */
  useEffect(() => {
    if (!markdown) return;
    setCurrentIndex(0);
  }, [markdown]);

  /**
   * 📚 Initializes the reading when the sections are loaded
   */
  useEffect(() => {
    if (initializedRef.current) return;

    const initializeReading = async () => {
      initializedRef.current = true;
      startTimeRef.current = Date.now();
    };

    initializeReading();

    return () => {
      if (initializedRef.current) {
        console.info("Will unmount");
        onExit();
        initializedRef.current = false;
      }
    };
  }, [onExit]);

  /**
   * 📜 Scrolls back to the top when changing sections
   * No one likes starting in the middle! 😉
   */
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [currentIndex]);

  /**
   * 🎯 Jump directly to a specific section
   */
  const handleSelectCard = (index: number) => {
    if (index !== currentIndex) changeSection(index);
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
        case "ArrowUp":
          goToPrevious();
          handleInteraction();
          break;
        case "ArrowRight":
        case "ArrowDown":
        case " ":
          e.preventDefault();
          goToNext();
          handleInteraction();
          break;
        case "Escape":
          setIsControlsVisible(false);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [goToNext, goToPrevious, handleInteraction, isControlsVisible]);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [resetControlsTimeout]);

  // Add mouse movement listener for hover-at-top functionality
  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [handleMouseMove]);

  const currentSection = getSection(currentIndex);

  if (sections.length === 0 || !currentSection) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="animate-spin h-8 w-8 border-t-2 border-primary rounded-full mr-3"></div>
        <span>Loading content...</span>
      </div>
    );
  }

  const fontFamily = fontFamilyMap[settings.fontFamily];

  return (
    <>
      <div
        className={cn(
          "h-full overflow-y-auto bg-card",
          isTransitioning ? "opacity-0" : "opacity-100",
          "transition-opacity duration-200"
        )}
        ref={scrollRef}
      >
        <div
          {...swipeHandlers}
          onDoubleClick={() => {
            setIsControlsVisible(true);
            resetControlsTimeout();
          }}
          className="h-full"
        >
          <div className="px-6 md:px-12 lg:px-20 xl:px-32 py-20 md:py-24 h-auto">
            <div className="max-w-2xl mx-auto rounded-2xl">
              <div
                key={currentIndex}
                className="prose prose-lg prose-invert max-w-none"
              >
                <CustomMarkdownRenderer
                  markdown={currentSection.content}
                  className="fullscreen-card-content leading-relaxed"
                  fontFamily={fontFamily}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
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

      {/* Navigation controls for mobile */}
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

      {/* Desktop side progress */}
      <DesktopProgressIndicator
        currentIndex={currentIndex}
        total={sections.length}
        onSelectSection={(index) => handleSelectCard(index)}
        sections={sections}
        readSections={readSections}
      />

      {/* Swipe hint indicators for mobile */}

      <SectionsSheet
        currentIndex={currentIndex}
        handleSelectCard={handleSelectCard}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        sections={sections}
        readSections={readSections}
      />

      <ReadingSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </>
  );
};

const FullscreenCardView: React.FC<
  FullscreenCardViewProps & {
    markdown: string;
    exitFullScreen: () => void;
  }
> = ({
  markdown,
  onExit,
  onChangeSection,
  sections,
  getSection,
  readSections,
  exitFullScreen,
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  /**
   * 🔙 Handle browser back button to exit fullscreen
   * When user presses browser back button, we want to exit fullscreen
   * just like clicking the exit button
   */
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
        {/* Content Area */}
        <FullscreenCardContent
          markdown={markdown}
          settingsOpen={settingsOpen}
          setSettingsOpen={setSettingsOpen}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          onExit={onExit}
          onChangeSection={onChangeSection}
          sections={sections}
          getSection={getSection}
          readSections={readSections}
          exitFullScreen={exitFullScreen}
        />
      </div>
    </ReadingSettingsProvider>
  );
};

export default FullscreenCardView;
