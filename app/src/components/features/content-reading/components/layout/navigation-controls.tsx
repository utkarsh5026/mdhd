import { ChevronLeft, ChevronRight } from 'lucide-react';
import { memo } from 'react';

import { cn } from '@/lib/utils';

interface NavigationControlsProps {
  currentIndex: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
}

const NavigationControls: React.FC<NavigationControlsProps> = memo(
  ({ currentIndex, total, onPrevious, onNext }) => {
    const canGoPrev = currentIndex > 0;
    const canGoNext = currentIndex < total - 1;

    return (
      <>
        {/* Left arrow */}
        <button
          onClick={onPrevious}
          disabled={!canGoPrev}
          aria-label="Previous section"
          className={cn(
            'absolute left-3 top-1/2 -translate-y-1/2 z-50',
            'touch-manipulation p-2 rounded-full',
            'transition-all duration-200',
            canGoPrev
              ? 'text-foreground/50 hover:text-foreground hover:bg-foreground/8 active:scale-95'
              : 'text-foreground/15 cursor-not-allowed'
          )}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Right arrow */}
        <button
          onClick={onNext}
          disabled={!canGoNext}
          aria-label="Next section"
          className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2 z-50',
            'touch-manipulation p-2 rounded-full',
            'transition-all duration-200',
            canGoNext
              ? 'text-foreground/50 hover:text-foreground hover:bg-foreground/8 active:scale-95'
              : 'text-foreground/15 cursor-not-allowed'
          )}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </>
    );
  }
);

NavigationControls.displayName = 'NavigationControls';

export default NavigationControls;
