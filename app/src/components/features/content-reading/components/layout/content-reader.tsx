import { memo, type RefObject } from 'react';
import { useSwipeable } from 'react-swipeable';

import CustomMarkdownRenderer from '@/components/features/markdown-render/components/markdown-render';
import {
  useReadingSettings,
  useReadingSettingsStore,
} from '@/components/features/settings/store/reading-settings-store';
import { fontFamilyMap } from '@/lib/font';
import { cn } from '@/lib/utils';
import type { MarkdownMetadata, MarkdownSection } from '@/services/section/parsing';

import { READER_PADDING_CLASSES } from '.';
import MetadataDisplay from './metadata-display';

interface ContentReaderProps {
  markdown: string;
  metadata: MarkdownMetadata | null;
  currentIndex: number;
  goToNext: () => void;
  goToPrevious: () => void;
  isTransitioning: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
  handleDoubleClick: () => void;
  currentSection: MarkdownSection;
  onSectionClick?: (sectionIndex: number) => void;
}

const ContentReader: React.FC<ContentReaderProps> = memo(
  ({
    metadata,
    currentIndex,
    goToNext,
    goToPrevious,
    isTransitioning,
    scrollRef,
    handleDoubleClick,
    currentSection,
    onSectionClick,
  }) => {
    const { settings } = useReadingSettings();
    const fontFamily = fontFamilyMap[settings.fontFamily];
    const { fontSize, lineHeight, contentWidth } = settings;
    const hasCustomBackground =
      useReadingSettingsStore((s) => s.settings.background.backgroundType) !== 'theme';

    const swipeHandlers = useSwipeable({
      onSwipedLeft: (eventData) => {
        if (eventData.event.target instanceof Element) {
          const target = eventData.event.target.closest('.no-swipe');
          if (target) return;
        }
        goToNext();
      },
      onSwipedRight: (eventData) => {
        if (eventData.event.target instanceof Element) {
          const target = eventData.event.target.closest('.no-swipe');
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
          'h-full overflow-y-auto',
          !hasCustomBackground && 'bg-card',
          isTransitioning ? 'opacity-0' : 'opacity-100',
          'transition-opacity duration-200'
        )}
        ref={scrollRef}
      >
        <div {...swipeHandlers} onDoubleClick={handleDoubleClick} className="h-full">
          <div className={cn(READER_PADDING_CLASSES, 'h-auto')}>
            <div
              className={cn(
                'mx-auto rounded-2xl',
                hasCustomBackground && 'bg-card/80 backdrop-blur-sm p-6'
              )}
              style={{ maxWidth: `${contentWidth}px` }}
            >
              {/* Show metadata only on the first section */}
              {currentIndex === 0 && metadata && <MetadataDisplay metadata={metadata} />}
              <div
                key={currentSection.id}
                className="prose prose-lg prose-invert max-w-none cursor-text"
                style={{
                  fontSize: `${fontSize}px`,
                  lineHeight: lineHeight,
                }}
                onClick={(e) => {
                  if (onSectionClick && !(e.target instanceof HTMLAnchorElement)) {
                    onSectionClick(currentIndex);
                  }
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
  }
);

ContentReader.displayName = 'ContentReader';

export default ContentReader;
