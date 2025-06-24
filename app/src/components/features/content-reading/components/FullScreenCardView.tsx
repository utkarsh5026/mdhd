import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import CustomMarkdownRenderer from "@/components/features/markdown-render/components/MarkdownRenderer";
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
import EnhancedChatSidebar from "../../chat-llm/components/ChatBar";
import LLMProvider from "../../chat-llm/context/llm/LLMProvider";
import { useConversationLLM, useComponent } from "../../chat-llm/hooks";
import { ComponentSelection } from "../../markdown-render/services/component-service";
import { useActiveConversation } from "../../chat-llm/store/conversation-store";

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

  const { askAboutComponent } = useConversationLLM();
  const { addComponentToConversation } = useComponent();
  const activeConversation = useActiveConversation();

  const handleComponentAddToChat = useCallback(
    (component: ComponentSelection) => {
      if (!activeConversation?.id) {
        return;
      }
      addComponentToConversation(component, activeConversation.id);
    },
    [addComponentToConversation, activeConversation?.id]
  );

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
      isChatSidebarVisible: chatSidebarVisible,
    });

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
                  {/* Enhanced Markdown Renderer with Conversation Integration */}
                  <CustomMarkdownRenderer
                    markdown={currentSection.content}
                    className="fullscreen-card-content leading-relaxed"
                    fontFamily={fontFamily}
                    sectionId={currentSection.id}
                    sectionTitle={currentSection.title}
                    enableInteractions
                    onComponentAsk={askAboutComponent}
                    onComponentAddToChat={handleComponentAddToChat}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Header */}
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

        {/* Navigation controls */}
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

      {/* Enhanced Chat Sidebar */}
      <EnhancedChatSidebar
        isVisible={chatSidebarVisible}
        onToggle={() => setChatSidebarVisible(!chatSidebarVisible)}
        sections={sections}
        currentSection={currentSection}
      />

      {/* Enhanced Ask Dialog */}
      {/* <EnhancedAskDialog /> */}
    </>
  );
};

/**
 * Main FullscreenCardView Component with Enhanced Chat Integration
 */
const FullscreenCardView: React.FC<
  FullscreenCardViewProps & {
    markdown: string;
    exitFullScreen: () => void;
  }
> = ({ markdown, exitFullScreen }) => {
  /**
   * Handle browser back button to exit fullscreen
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
    <LLMProvider
      config={{
        openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY,
        anthropicApiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
        googleApiKey: import.meta.env.VITE_GOOGLE_API_KEY,
      }}
    >
      <ReadingSettingsProvider>
        <div className="fixed inset-0 z-50 bg-background text-foreground overflow-hidden">
          <FullscreenCardContent
            markdown={markdown}
            exitFullScreen={exitFullScreen}
          />
        </div>
      </ReadingSettingsProvider>
    </LLMProvider>
  );
};

export default FullscreenCardView;
