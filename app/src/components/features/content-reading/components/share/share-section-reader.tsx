import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSwipeable } from 'react-swipeable';

import CustomMarkdownRenderer from '@/components/features/markdown-render/components/markdown-render';
import { cn } from '@/lib/utils';
import type { MarkdownMetadata, MarkdownSection } from '@/services/section/parsing';

import { READER_PADDING_CLASSES } from '../layout';
import MetadataDisplay from '../layout/metadata-display';
import SectionReadingTime from '../layout/section-reading-time';

interface ShareSectionReaderProps {
  sections: MarkdownSection[];
  metadata: MarkdownMetadata | null;
  sharerName: string | null;
  sharerAvatar: string | null;
}

const ShareSectionReader: React.FC<ShareSectionReaderProps> = ({
  sections,
  metadata,
  sharerName,
  sharerAvatar,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const changeSection = useCallback(
    (nextIndex: number) => {
      if (nextIndex < 0 || nextIndex >= sections.length) return;
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(nextIndex);
        setIsTransitioning(false);
        scrollRef.current?.scrollTo({ top: 0 });
      }, 200);
    },
    [sections.length]
  );

  const goToNext = useCallback(
    () => changeSection(currentIndex + 1),
    [changeSection, currentIndex]
  );
  const goToPrevious = useCallback(
    () => changeSection(currentIndex - 1),
    [changeSection, currentIndex]
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goToPrevious();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goToNext, goToPrevious]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: goToNext,
    onSwipedRight: goToPrevious,
    delta: 50,
    preventScrollOnSwipe: false,
    trackTouch: true,
    trackMouse: false,
    swipeDuration: 500,
  });

  const currentSection = sections[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === sections.length - 1;

  if (!currentSection) return null;

  return (
    <div className="relative h-screen overflow-hidden bg-card">
      {(sharerName ?? sharerAvatar) && (
        <div className="absolute top-0 left-0 right-0 z-40 flex items-center gap-2.5 px-5 py-3 bg-card/80 backdrop-blur-sm border-b border-border/10">
          {sharerAvatar ? (
            <img
              src={sharerAvatar}
              alt={sharerName ?? 'Shared by'}
              className="h-6 w-6 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
              <span className="text-[10px] text-muted-foreground font-medium uppercase">
                {sharerName?.[0] ?? '?'}
              </span>
            </div>
          )}
          <span className="text-xs text-muted-foreground/70">
            Shared by{' '}
            <span className="text-foreground/70 font-medium">{sharerName ?? 'a user'}</span>
          </span>
        </div>
      )}
      <div
        ref={scrollRef}
        className={cn(
          'h-full overflow-y-auto',
          isTransitioning ? 'opacity-0' : 'opacity-100',
          'transition-opacity duration-200',
          (sharerName ?? sharerAvatar) && 'pt-12'
        )}
      >
        <div {...swipeHandlers} className="h-full">
          <div className={cn(READER_PADDING_CLASSES, 'h-auto')}>
            <div className="mx-auto rounded-2xl" style={{ maxWidth: '720px' }}>
              {currentIndex === 0 && metadata && <MetadataDisplay metadata={metadata} />}
              <SectionReadingTime section={currentSection} />
              <div className="prose prose-lg prose-invert max-w-none">
                <CustomMarkdownRenderer
                  markdown={currentSection.content}
                  className="fullscreen-card-content"
                  fontFamily='"Merriweather", serif'
                />
              </div>
              {isLast && (
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

      {/* Navigation controls */}
      <div
        className={cn(
          'absolute bottom-6 left-1/2 -translate-x-1/2 z-50',
          'flex items-center gap-1 rounded-full px-1.5 py-1.5',
          'opacity-30 hover:opacity-100',
          'hover:bg-foreground/5 hover:backdrop-blur-md hover:border hover:border-foreground/10',
          'border border-transparent',
          'transition-all duration-300'
        )}
      >
        <button
          onClick={goToPrevious}
          disabled={isFirst}
          aria-label="Previous section"
          className={cn(
            'touch-manipulation p-2 rounded-full transition-all duration-200',
            !isFirst
              ? 'text-foreground/70 hover:text-foreground hover:bg-foreground/8 active:scale-95'
              : 'text-foreground/15 cursor-not-allowed'
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs text-muted-foreground/50 px-1 select-none">
          {currentIndex + 1} / {sections.length}
        </span>
        <button
          onClick={goToNext}
          disabled={isLast}
          aria-label="Next section"
          className={cn(
            'touch-manipulation p-2 rounded-full transition-all duration-200',
            !isLast
              ? 'text-foreground/70 hover:text-foreground hover:bg-foreground/8 active:scale-95'
              : 'text-foreground/15 cursor-not-allowed'
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

ShareSectionReader.displayName = 'ShareSectionReader';
export default ShareSectionReader;
