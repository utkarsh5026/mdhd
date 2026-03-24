import { memo, useEffect, useMemo, useRef } from 'react';

import CustomMarkdownRenderer from '@/components/features/markdown-render/components/markdown-render';
import { useReadingSettings } from '@/components/features/settings/store/reading-settings-store';
import { fontFamilyMap } from '@/lib/font';
import { cn } from '@/lib/utils';
import type { MarkdownSection } from '@/services/section/parsing';

import type { SlideDirection } from '../store/types';
import { parsePresenterNotes } from '../utils/parse-notes';

interface PresentationSlideProps {
  section: MarkdownSection;
  isTransitioning: boolean;
  direction: SlideDirection;
}

/**
 * Detects "title slides" — only an h1 and optionally 1-2 subtitle lines.
 */
function isTitleSlide(markdown: string): boolean {
  const lines = markdown
    .trim()
    .split('\n')
    .filter((l) => l.trim().length > 0);
  if (lines.length === 0) return false;
  if (!lines[0].startsWith('# ') || lines[0].startsWith('## ')) return false;
  if (lines.length > 3) return false;
  return !lines.slice(1).some((l) => l.startsWith('#'));
}

const PresentationSlide: React.FC<PresentationSlideProps> = memo(
  ({ section, isTransitioning, direction }) => {
    const { settings } = useReadingSettings();
    const fontFamily = fontFamilyMap[settings.fontFamily];
    const scrollRef = useRef<HTMLDivElement>(null);

    const { slideMarkdown } = useMemo(
      () => parsePresenterNotes(section.content),
      [section.content]
    );

    const isTitle = useMemo(() => isTitleSlide(slideMarkdown), [slideMarkdown]);

    useEffect(() => {
      scrollRef.current?.scrollTo(0, 0);
    }, [section.content]);

    const transitionTransform = isTransitioning
      ? direction === 'left'
        ? 'translate-x-[-5%] scale-[0.98]'
        : direction === 'right'
          ? 'translate-x-[5%] scale-[0.98]'
          : 'scale-[0.98]'
      : 'translate-x-0 scale-100';

    return (
      <div
        ref={scrollRef}
        className={cn(
          'flex h-full w-full overflow-y-auto',
          'transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
          isTransitioning ? 'opacity-0' : 'opacity-100',
          transitionTransform
        )}
      >
        <div
          className={cn(
            'w-full px-5 py-8 sm:px-16 sm:py-20 m-auto',
            isTitle ? 'max-w-5xl' : 'max-w-4xl'
          )}
        >
          <div
            className={cn(
              'prose prose-xl max-w-none',
              // Headings
              'prose-headings:text-center prose-headings:mb-10 prose-headings:font-semibold prose-headings:tracking-tight',
              // Inline
              'prose-strong:text-foreground prose-strong:font-semibold',
              'prose-code:text-[0.85em] prose-code:bg-foreground/[0.06] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-normal',
              'prose-a:text-primary/90 prose-a:no-underline prose-a:font-medium hover:prose-a:underline',
              // Blocks
              'prose-blockquote:text-base sm:prose-blockquote:text-xl prose-blockquote:border-primary/25 prose-blockquote:italic prose-blockquote:text-foreground/60 prose-blockquote:font-light',
              'prose-img:rounded-2xl prose-img:shadow-xl',
              'prose-hr:border-border/20 prose-hr:my-12',
              'prose-pre:rounded-xl prose-pre:shadow-lg prose-pre:bg-foreground/[0.04]',
              isTitle
                ? [
                    'prose-h1:text-4xl sm:prose-h1:text-7xl prose-h1:font-bold prose-h1:leading-[1.08] prose-h1:mb-4 sm:prose-h1:mb-6',
                    'prose-p:text-lg sm:prose-p:text-2xl prose-p:text-muted-foreground prose-p:text-center prose-p:mt-4 prose-p:leading-relaxed prose-p:font-light',
                  ]
                : [
                    'prose-h1:text-2xl sm:prose-h1:text-5xl prose-h1:leading-tight',
                    'prose-h2:text-xl sm:prose-h2:text-4xl prose-h2:leading-snug',
                    'prose-h3:text-lg sm:prose-h3:text-3xl prose-h3:leading-snug',
                    'prose-p:text-base sm:prose-p:text-[1.35rem] prose-p:leading-[1.75] prose-p:text-foreground/80',
                    'prose-li:text-base sm:prose-li:text-xl prose-li:leading-[1.75] prose-li:text-foreground/80',
                    'prose-li:marker:text-primary/40',
                  ]
            )}
          >
            <CustomMarkdownRenderer markdown={slideMarkdown} fontFamily={fontFamily} />
          </div>
        </div>
      </div>
    );
  }
);

PresentationSlide.displayName = 'PresentationSlide';

export default PresentationSlide;
