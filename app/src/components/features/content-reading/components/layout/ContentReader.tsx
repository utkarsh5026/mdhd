import { cn } from "@/lib/utils";
import { useSwipeable } from "react-swipeable";
import CustomMarkdownRenderer from "@/components/features/markdown-render/components/MarkdownRenderer";
import type { MarkdownSection } from "@/services/section/parsing";
import {
  useReadingSettings,
  fontFamilyMap,
} from "@/components/features/settings/context/ReadingContext";
import {
  useActiveConversation,
  useComponent,
  useConversationLLM,
} from "@/components/features/chat-llm/hooks";
import type { ComponentSelection } from "@/components/features/markdown-render/services/component-service";
import { useCallback, RefObject } from "react";

interface ContentReaderProps {
  markdown: string;
  goToNext: () => void;
  goToPrevious: () => void;
  isTransitioning: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
  handleDoubleClick: () => void;
  currentSection: MarkdownSection;
}

const ContentReader = ({
  goToNext,
  goToPrevious,
  isTransitioning,
  scrollRef,
  handleDoubleClick,
  currentSection,
}: ContentReaderProps) => {
  const { settings } = useReadingSettings();
  const fontFamily = fontFamilyMap[settings.fontFamily];
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
  return (
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
              key={currentSection.id}
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
  );
};

export default ContentReader;
