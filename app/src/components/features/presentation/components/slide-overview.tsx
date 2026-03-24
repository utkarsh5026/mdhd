import { memo, useEffect, useMemo, useRef } from 'react';

import { cn } from '@/lib/utils';
import type { MarkdownSection } from '@/services/section/parsing';

import { parsePresenterNotes } from '../utils/parse-notes';

interface SlideOverviewProps {
  sections: MarkdownSection[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onClose: () => void;
}

const SlideOverview: React.FC<SlideOverviewProps> = memo(
  ({ sections, currentIndex, onSelect, onClose }) => {
    const activeRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
      activeRef.current?.scrollIntoView({ block: 'center', behavior: 'instant' });
    }, []);

    return (
      <div className="fixed inset-0 z-70 flex flex-col bg-background/97 backdrop-blur-2xl animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-10 py-4 sm:py-6">
          <div>
            <h2 className="text-base font-medium text-foreground/90">Slide Overview</h2>
            <p className="text-xs text-muted-foreground/50 mt-0.5">{sections.length} slides</p>
          </div>
          <button
            onClick={onClose}
            className="text-[13px] text-muted-foreground/60 hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-foreground/6 transition-colors duration-200"
          >
            Close <kbd className="ml-2 text-[11px] text-muted-foreground/35 font-mono">esc</kbd>
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-10 pb-6 sm:pb-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 max-w-7xl mx-auto">
            {sections.map((section, i) => (
              <SlideThumb
                key={i}
                ref={i === currentIndex ? activeRef : undefined}
                section={section}
                index={i}
                isActive={i === currentIndex}
                onSelect={() => {
                  onSelect(i);
                  onClose();
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }
);

SlideOverview.displayName = 'SlideOverview';

interface SlideThumbProps {
  section: MarkdownSection;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  ref?: React.Ref<HTMLButtonElement>;
}

const SlideThumb = memo(({ section, index, isActive, onSelect, ref }: SlideThumbProps) => {
  const { heading, bodyLines } = useMemo(() => {
    const { slideMarkdown } = parsePresenterNotes(section.content);
    const lines = slideMarkdown.split('\n').filter((l) => l.trim().length > 0);
    const headingMatch = lines[0]?.match(/^#{1,6}\s+(.+)$/);
    const h = headingMatch ? headingMatch[1] : `Slide ${index + 1}`;
    const rest = (headingMatch ? lines.slice(1) : lines).slice(0, 5).map((l) =>
      l
        .replace(/^#{1,6}\s+/, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`(.*?)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/^[-*+]\s+/, '\u2022 ')
        .replace(/^\d+\.\s+/, '\u2022 ')
    );
    return { heading: h, bodyLines: rest };
  }, [section.content, index]);

  return (
    <button
      ref={ref}
      onClick={onSelect}
      className={cn(
        'group relative flex flex-col rounded-2xl text-left ',
        'transition-all duration-250 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        isActive
          ? 'bg-primary/[0.07] ring-1 ring-primary/25 shadow-sm'
          : 'bg-foreground/3 hover:bg-foreground/6 ring-1 ring-foreground/6 hover:ring-foreground/12'
      )}
    >
      {/* Slide number */}
      <div
        className={cn(
          'absolute -top-2.5 -left-2 min-w-6 h-6 px-1.5 rounded-full flex items-center justify-center text-[11px] font-semibold z-10',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted/80 text-muted-foreground/70 group-hover:bg-muted group-hover:text-muted-foreground'
        )}
      >
        {index + 1}
      </div>

      <div className="aspect-16/10 p-4 pt-5 overflow-hidden flex flex-col gap-2.5">
        <p
          className={cn(
            'text-xs font-medium leading-snug line-clamp-2',
            isActive ? 'text-foreground' : 'text-foreground/80 group-hover:text-foreground'
          )}
        >
          {heading}
        </p>
        {bodyLines.length > 0 && (
          <div className="flex flex-col gap-px">
            {bodyLines.map((line, i) => (
              <p key={i} className="text-[10px] leading-relaxed text-muted-foreground/50 truncate">
                {line}
              </p>
            ))}
          </div>
        )}
      </div>
    </button>
  );
});

SlideThumb.displayName = 'SlideThumb';

export default SlideOverview;
