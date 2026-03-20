import { forwardRef, memo, useEffect, useMemo, useRef } from 'react';

import { cn } from '@/lib/utils';
import type { MarkdownSection } from '@/services/section/parsing';

import { parsePresenterNotes } from '../utils/parse-notes';

interface SlideFilmstripProps {
  sections: MarkdownSection[];
  currentIndex: number;
  visible: boolean;
  onSelect: (index: number) => void;
}

const SlideFilmstrip: React.FC<SlideFilmstripProps> = memo(
  ({ sections, currentIndex, visible, onSelect }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const activeRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
      activeRef.current?.scrollIntoView({
        inline: 'center',
        block: 'nearest',
        behavior: 'smooth',
      });
    }, [currentIndex]);

    return (
      <div
        className={cn(
          'transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'
        )}
      >
        <div
          ref={scrollRef}
          className="flex items-center gap-2 px-5 py-2.5 overflow-x-auto scrollbar-none bg-background/60 backdrop-blur-xl border-t border-foreground/4"
        >
          {sections.map((section, i) => (
            <FilmstripThumb
              key={i}
              ref={i === currentIndex ? activeRef : undefined}
              section={section}
              index={i}
              isActive={i === currentIndex}
              onSelect={() => onSelect(i)}
            />
          ))}
        </div>
      </div>
    );
  }
);

SlideFilmstrip.displayName = 'SlideFilmstrip';

interface FilmstripThumbProps {
  section: MarkdownSection;
  index: number;
  isActive: boolean;
  onSelect: () => void;
}

const FilmstripThumb = memo(
  forwardRef<HTMLButtonElement, FilmstripThumbProps>(
    ({ section, index, isActive, onSelect }, ref) => {
      const heading = useMemo(() => {
        const { slideMarkdown } = parsePresenterNotes(section.content);
        const firstLine = slideMarkdown.split('\n').find((l) => l.trim().length > 0);
        const match = firstLine?.match(/^#{1,6}\s+(.+)$/);
        return match ? match[1] : `Slide ${index + 1}`;
      }, [section.content, index]);

      return (
        <button
          ref={ref}
          onClick={onSelect}
          className={cn(
            'group relative shrink-0 rounded-2xl text-left transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
            isActive
              ? 'bg-primary/10 ring-1 ring-primary/30'
              : 'bg-foreground/3 ring-1 ring-foreground/6 hover:bg-foreground/6 hover:ring-foreground/12'
          )}
        >
          <div className="w-32 h-16 px-2.5 py-2 flex flex-col justify-between overflow-hidden">
            <p
              className={cn(
                'text-[10px] font-medium leading-tight line-clamp-2',
                isActive ? 'text-foreground' : 'text-foreground/60 group-hover:text-foreground/80'
              )}
            >
              {heading}
            </p>
            <span
              className={cn(
                'text-[9px] tabular-nums self-end',
                isActive ? 'text-primary/70' : 'text-muted-foreground/30'
              )}
            >
              {index + 1}
            </span>
          </div>
        </button>
      );
    }
  )
);

FilmstripThumb.displayName = 'FilmstripThumb';

export default SlideFilmstrip;
