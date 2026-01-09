import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { MarkdownSection } from '@/services/section/parsing';

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
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 text-center min-w-[80px]">
        <div className="bg-background/90 backdrop-blur-xl border-none rounded-2xl px-3 py-2.5 shadow-xl font-cascadia-code">
          <div className="text-lg font-bold text-primary tabular-nums">{percentage}%</div>
        </div>
      </div>

      <div className="relative">
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 w-1 bg-gradient-to-b from-primary to-primary/60 rounded-full"
          initial={{ height: 0 }}
          animate={{
            height:
              readingMode === 'scroll'
                ? `${scrollProgress}%`
                : `${((currentIndex + 1) / Math.min(total, 15)) * 100}%`,
          }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        />

        <div className="flex flex-col gap-4">
          {Array.from({ length: Math.min(total, 15) }).map((_, index) => {
            const actualIndex = total <= 15 ? index : Math.floor((index / 14) * (total - 1));
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
            'relative w-5 h-5 rounded-full transition-all duration-300 group z-10',
            'border-2 backdrop-blur-sm active:scale-90',
            isActive
              ? 'bg-primary border-primary shadow-lg shadow-primary/40 scale-125'
              : isCompleted
                ? 'bg-primary/80 border-primary/80 shadow-md shadow-primary/20'
                : 'bg-cardBg border-border hover:border-secondary hover:bg-secondary/50'
          )}
        >
          {isCompleted && !isActive && (
            <div className="absolute inset-1 bg-background/40 rounded-full" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="left"
        sideOffset={12}
        className="max-w-xs bg-background border border-border shadow-xl font-cascadia-code rounded-2xl backdrop-blur-2xl"
      >
        <div className="flex flex-col gap-1.5 p-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Section {actualIndex + 1}
              {isCompleted && ' ✓'}
            </span>
          </div>
          <p className="text-sm font-semibold text-foreground leading-snug">
            {section?.title || `Section ${actualIndex + 1}`}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
