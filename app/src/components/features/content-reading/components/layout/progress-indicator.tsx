import { cn } from '@/lib/utils';
import React, { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { MarkdownSection } from '@/services/section/parsing';
import useViewportDots from '@/hooks/utils/use-viewport-dots';
import styles from './progress-indicator.module.css';

interface DesktopProgressIndicatorProps {
  currentIndex: number;
  total: number;
  onSelectSection: (index: number) => void;
  sections: MarkdownSection[];
  readSections: Set<number>;
  readingMode?: 'card' | 'scroll';
  scrollProgress?: number;
}

export const DesktopProgressIndicator: React.FC<DesktopProgressIndicatorProps> = ({
  currentIndex,
  total,
  onSelectSection,
  sections,
  readSections,
  readingMode = 'card',
  scrollProgress = 0,
}) => {
  const maxVisibleDots = useViewportDots();

  const { percentage } = useMemo(() => {
    if (readingMode === 'scroll') {
      return { totalWords: 0, wordsRead: 0, percentage: Math.round(scrollProgress) };
    }

    const totalWords = sections.reduce((sum, section) => sum + section.wordCount, 0);
    const wordsRead = sections.reduce((sum, section, index) => {
      return sum + (readSections.has(index) ? section.wordCount : 0);
    }, 0);

    const currentSectionWords = readSections.has(currentIndex)
      ? 0
      : sections[currentIndex]?.wordCount || 0;
    const wordsReadWithCurrent = wordsRead + currentSectionWords;

    const percentage = totalWords > 0 ? Math.round((wordsReadWithCurrent / totalWords) * 100) : 0;

    return { totalWords, wordsRead: wordsReadWithCurrent, percentage };
  }, [sections, currentIndex, readSections, readingMode, scrollProgress]);

  return (
    <div className="hidden lg:block fixed right-8 top-1/2 -translate-y-1/2 z-40">
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 text-center min-w-20">
        <div className="bg-background/60 backdrop-blur-sm border border-border/40 rounded-2xl px-3 py-2 shadow-sm font-cascadia-code">
          <div className="text-sm font-medium text-muted-foreground tabular-nums">
            {percentage}%
          </div>
        </div>
      </div>

      <div className="relative">
        <div
          className={styles.progressBar}
          style={{
            height:
              readingMode === 'scroll'
                ? `${scrollProgress}%`
                : `${((currentIndex + 1) / Math.min(total, maxVisibleDots)) * 100}%`,
          }}
        />

        <div className="flex flex-col gap-4">
          {Array.from({ length: Math.min(total, maxVisibleDots) }).map((_, index) => {
            const actualIndex =
              total <= maxVisibleDots
                ? index
                : Math.floor((index / (maxVisibleDots - 1)) * (total - 1));
            const isActive = actualIndex === currentIndex;
            const isCompleted = readSections.has(actualIndex);
            const section = sections[actualIndex];

            return (
              <SectionToolTip
                key={index}
                index={index}
                actualIndex={actualIndex}
                isActive={isActive}
                isCompleted={isCompleted}
                section={section}
                onSelectSection={onSelectSection}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface SectionToolTipProps {
  index: number;
  actualIndex: number;
  isActive: boolean;
  isCompleted: boolean;
  section?: MarkdownSection;
  onSelectSection: (index: number) => void;
}
const SectionToolTip: React.FC<SectionToolTipProps> = ({
  index,
  actualIndex,
  isActive,
  isCompleted,
  section,
  onSelectSection,
}) => {
  return (
    <Tooltip key={index}>
      <TooltipTrigger asChild>
        <button
          onClick={() => onSelectSection(actualIndex)}
          className={cn(
            'relative w-4 h-4 rounded-full transition-all duration-300 group z-10',
            'border backdrop-blur-sm active:scale-90',
            isActive
              ? 'bg-muted-foreground/60 border-muted-foreground/60 shadow-sm scale-110'
              : isCompleted
                ? 'bg-muted-foreground/30 border-muted-foreground/30'
                : 'bg-background/80 border-border/50 hover:border-muted-foreground/40 hover:bg-muted-foreground/10'
          )}
        >
          {isCompleted && !isActive && (
            <div className="absolute inset-0.5 bg-background/60 rounded-full" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="left"
        sideOffset={12}
        className="max-w-xs bg-background/95 border border-border/60 shadow-sm font-cascadia-code rounded-2xl backdrop-blur-sm"
      >
        <div className="flex flex-col gap-1.5 p-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-normal text-muted-foreground/80">
              Section {actualIndex + 1}
              {isCompleted && ' ✓'}
            </span>
          </div>
          <p className="text-sm font-medium text-foreground/90 leading-snug">
            {section?.title || `Section ${actualIndex + 1}`}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
