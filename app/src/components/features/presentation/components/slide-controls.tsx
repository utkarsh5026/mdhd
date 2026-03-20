import { ChevronLeft, ChevronRight, StickyNote, X } from 'lucide-react';
import { memo } from 'react';

import { cn } from '@/lib/utils';

interface SlideControlsProps {
  currentIndex: number;
  total: number;
  showNotes: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onToggleNotes: () => void;
  onExit: () => void;
}

const SlideControls: React.FC<SlideControlsProps> = memo(
  ({ currentIndex, total, showNotes, onPrevious, onNext, onToggleNotes, onExit }) => {
    const canGoPrev = currentIndex > 0;
    const canGoNext = currentIndex < total - 1;

    return (
      <div className="flex items-center justify-between px-6 py-3 bg-background/90 backdrop-blur-sm border-t border-border/20">
        {/* Left: exit */}
        <button
          onClick={onExit}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm',
            'text-muted-foreground hover:text-red-400 hover:bg-red-400/10',
            'transition-colors duration-150'
          )}
        >
          <X className="h-4 w-4" />
          <span className="hidden sm:inline">Exit</span>
        </button>

        {/* Center: navigation + counter */}
        <div className="flex items-center gap-3">
          <button
            onClick={onPrevious}
            disabled={!canGoPrev}
            aria-label="Previous slide"
            className={cn(
              'p-1.5 rounded-lg transition-colors duration-150',
              canGoPrev
                ? 'text-foreground/60 hover:text-foreground hover:bg-foreground/8'
                : 'text-foreground/20 cursor-not-allowed'
            )}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <span className="text-sm font-medium text-foreground/70 tabular-nums min-w-[4rem] text-center">
            {currentIndex + 1} / {total}
          </span>

          <button
            onClick={onNext}
            disabled={!canGoNext}
            aria-label="Next slide"
            className={cn(
              'p-1.5 rounded-lg transition-colors duration-150',
              canGoNext
                ? 'text-foreground/60 hover:text-foreground hover:bg-foreground/8'
                : 'text-foreground/20 cursor-not-allowed'
            )}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Right: notes toggle */}
        <button
          onClick={onToggleNotes}
          aria-label="Toggle presenter notes"
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm',
            'transition-colors duration-150',
            showNotes
              ? 'text-primary bg-primary/10'
              : 'text-muted-foreground hover:text-foreground hover:bg-foreground/8'
          )}
        >
          <StickyNote className="h-4 w-4" />
          <span className="hidden sm:inline">Notes</span>
        </button>
      </div>
    );
  }
);

SlideControls.displayName = 'SlideControls';

export default SlideControls;
