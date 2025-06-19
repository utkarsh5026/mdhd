import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import CustomMarkdownRenderer from "@/components/features/markdown-render/MarkdownRenderer";
import SectionsSheet from "./table-of-contents/SectionsSheet";
import ReadingSettingsSheet from "@/components/features/settings/components/ReadingSettingsSheet";
import { ReadingSettingsProvider } from "@/components/features/settings/context/ReadingSettingsProvider";
import {
  useReadingSettings,
  fontFamilyMap,
} from "@/components/features/settings/context/ReadingContext";
import {
  Header,
  NavigationControls,
  DesktopProgressIndicator,
  LoadingState,
} from "./layout";
import { useSwipeable } from "react-swipeable";
import {
  useControls,
  useReading,
} from "@/components/features/content-reading/hooks";
import { RAGProvider } from "../../chat-llm/context/RagContext";
import MDHDChatSidebar from "../../chat-llm/components/ChatBar";
import { AskDialog } from "../../chat-llm/components/ChatDialog";
import { ComponentSelection } from "../../markdown-render/services/component-service";
import { useSimpleChatStore } from "../../chat-llm/store/chat-store";
interface FullscreenCardViewProps {
  markdown: string;
}

interface FullscreenCardContentProps extends FullscreenCardViewProps {
  exitFullScreen: () => void;
}

const FullscreenCardContent: React.FC<FullscreenCardContentProps> = ({
  exitFullScreen,
  markdown,
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatSidebarVisible, setChatSidebarVisible] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { settings } = useReadingSettings();

  const setCurrentSection = useSimpleChatStore(
    (state) => state.setCurrentSection
  );
  const openAskDialog = useSimpleChatStore((state) => state.openAskDialog);
  const addComponentToChat = useSimpleChatStore(
    (state) => state.addComponentToChat
  );
  const toggleVisibility = useSimpleChatStore(
    (state) => state.toggleVisibility
  );

  const handleComponentAsk = useCallback(
    (component: ComponentSelection) => {
      openAskDialog(component);
    },
    [openAskDialog]
  );

  useEffect(() => {
    toggleVisibility();
  }, [toggleVisibility]);

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

  useEffect(() => {
    console.log("currentIndex", currentIndex);
    const section = getSection(currentIndex);
    if (section) {
      setCurrentSection(section.id, section.title);
    }
  }, [currentIndex, getSection, setCurrentSection]);

  const { isControlsVisible, handleInteraction, handleDoubleClick } =
    useControls({
      goToNext,
      goToPrevious,
      isChatSidebarVisible: chatSidebarVisible,
    });

  const handleComponentAddToChat = useCallback(
    (component: ComponentSelection) => {
      addComponentToChat(component);
      console.log(`Added ${component.type} to chat context`);
    },
    [addComponentToChat]
  );

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

  /**
   * 📚 Initializes the reading when the sections are loaded
   */
  useEffect(() => {
    initializeReading();

    return () => {
      resetReading();
    };
  }, [initializeReading, resetReading]);

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

  const currentSection = getSection(currentIndex);

  if (sections.length === 0 || !currentSection) {
    return <LoadingState />;
  }

  const fontFamily = fontFamilyMap[settings.fontFamily];

  return (
    <>
      {/* Main Reading Area - adjusts when chat is visible */}
      <div
        className={cn(
          "h-full transition-all duration-300 ease-out relative",
          chatSidebarVisible ? "ml-[33.333%]" : "ml-0"
        )}
      >
        {/* Content Container */}
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
            onDoubleClick={handleDoubleClick}
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
                    sectionId={currentSection.id}
                    sectionTitle={currentSection.title}
                    enableInteractions
                    onComponentAsk={handleComponentAsk}
                    onComponentAddToChat={handleComponentAddToChat}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Header - now positioned relative to main reading area */}
        <div className="absolute top-0 left-0 right-0 z-50">
          <Header
            onChat={() => {
              setChatSidebarVisible(true);
              handleInteraction();
            }}
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

        {/* Navigation controls - now positioned relative to main reading area */}
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

        {/* Desktop side progress - stays within main reading area */}
        <DesktopProgressIndicator
          currentIndex={currentIndex}
          total={sections.length}
          onSelectSection={(index) => handleSelectCard(index)}
          sections={sections}
          readSections={readSections}
        />

        {/* Sections Sheet - stays within main reading area */}
        <SectionsSheet
          currentIndex={currentIndex}
          handleSelectCard={handleSelectCard}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          sections={sections}
          readSections={readSections}
        />

        {/* Reading Settings Sheet - stays within main reading area */}
        <ReadingSettingsSheet
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
        />
      </div>

      {/* Chat Sidebar - completely separate */}
      <MDHDChatSidebar
        isVisible={chatSidebarVisible}
        onToggle={() => setChatSidebarVisible(!chatSidebarVisible)}
        sections={sections}
        currentSection={currentSection}
      />

      <AskDialog />
    </>
  );
};

const FullscreenCardView: React.FC<
  FullscreenCardViewProps & {
    markdown: string;
    exitFullScreen: () => void;
  }
> = ({ markdown, exitFullScreen }) => {
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
    <RAGProvider>
      <ReadingSettingsProvider>
        <div className="fixed inset-0 z-50 bg-background text-foreground overflow-hidden">
          {/* Content Area */}
          <FullscreenCardContent
            markdown={markdown}
            exitFullScreen={exitFullScreen}
          />
        </div>
      </ReadingSettingsProvider>
    </RAGProvider>
  );
};

export default FullscreenCardView;
