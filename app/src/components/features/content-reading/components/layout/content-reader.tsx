import { memo, type RefObject } from 'react';
import { useSwipeable } from 'react-swipeable';

import CustomMarkdownRenderer from '@/components/features/markdown-render/components/markdown-render';
import {
  useReadingDisplay,
  useReadingSettingsStore,
  useTypography,
} from '@/components/features/settings/store/reading-settings-store';
import { fontFamilyMap } from '@/lib/font';
import { cn } from '@/lib/utils';

import {
  useReadingActions,
  useReadingContent,
  useReadingCurrentSection,
  useReadingNavigation,
  useReadingSections,
} from '../../hooks';
import { READER_PADDING_CLASSES } from '.';
import MetadataDisplay from './metadata-display';
import SectionReadingTime from './section-reading-time';

interface ContentReaderProps {
  scrollRef: RefObject<HTMLDivElement | null>;
  handleDoubleClick: () => void;
  onSectionClick?: (sectionIndex: number) => void;
}

const ContentReader: React.FC<ContentReaderProps> = memo(
  ({ scrollRef, handleDoubleClick, onSectionClick }) => {
    const { currentIndex, isTransitioning } = useReadingNavigation();
    const { metadata } = useReadingContent();
    const currentSection = useReadingCurrentSection();
    const sections = useReadingSections();
    const { goToNext, goToPrevious } = useReadingActions();
    const isLastSection = currentIndex === sections.length - 1;

    const { typography } = useTypography();
    const { settings } = useReadingDisplay();
    const fontFamily = fontFamilyMap[typography.fontFamily];
    const { fontSize, lineHeight } = typography;
    const { contentWidth } = settings;
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

    if (!currentSection) return null;

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
              <SectionReadingTime section={currentSection} />
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
              {isLastSection && (
                <div className="flex items-center justify-center gap-3 pt-8 pb-4 text-muted-foreground/60">
                  <span className="h-px w-8 bg-muted-foreground/20" />
                  <span className="text-sm italic tracking-wide">The End</span>
                  <span className="h-px w-8 bg-muted-foreground/20" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ContentReader.displayName = 'ContentReader';

export default ContentReader;
