import { cn } from "@/lib/utils";
import { useSwipeable } from "react-swipeable";
import CustomMarkdownRenderer from "@/components/features/markdown-render/components/markdown-render";
import type { MarkdownSection } from "@/services/section/parsing";
import {
  useReadingSettings,
  fontFamilyMap,
} from "@/components/features/settings/context/ReadingContext";
import { RefObject } from "react";

interface ContentReaderProps {
  markdown: string;
  goToNext: () => void;
  goToPrevious: () => void;
  isTransitioning: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
  handleDoubleClick: () => void;
  currentSection: MarkdownSection;
}

const ContentReader: React.FC<ContentReaderProps> = ({
  goToNext,
  goToPrevious,
  isTransitioning,
  scrollRef,
  handleDoubleClick,
  currentSection,
}) => {
  const { settings } = useReadingSettings();
  const fontFamily = fontFamilyMap[settings.fontFamily];
  const { fontSize, lineHeight, contentWidth } = settings;

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
    delta: 50,
    preventScrollOnSwipe: false,
    trackTouch: true,
    trackMouse: false,
    swipeDuration: 500,
  });

  return (
    <div
      className={cn(
        "h-full overflow-y-auto bg-background",
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
          <div
            className="mx-auto rounded-2xl"
            style={{ maxWidth: `${contentWidth}px` }}
          >
            <div
              key={currentSection.id}
              className="prose prose-lg prose-invert max-w-none"
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: lineHeight,
              }}
            >
              <CustomMarkdownRenderer
                markdown={currentSection.content}
                className="fullscreen-card-content"
                fontFamily={fontFamily}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentReader;
