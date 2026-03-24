import { ChevronLeft, ChevronRight } from 'lucide-react';
import { memo } from 'react';

import { cn } from '@/lib/utils';

import { useReadingNavigation, useReadingSections } from '../../hooks';

interface NavigationControlsProps {
  onPrevious: () => void;
  onNext: () => void;
}

const NavigationControls: React.FC<NavigationControlsProps> = memo(({ onPrevious, onNext }) => {
  const { currentIndex } = useReadingNavigation();
  const sections = useReadingSections();
  const total = sections.length;

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < total - 1;

  return (
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
        onClick={onPrevious}
        disabled={!canGoPrev}
        aria-label="Previous section"
        className={cn(
          'touch-manipulation p-2 rounded-full transition-all duration-200',
          canGoPrev
            ? 'text-foreground/70 hover:text-foreground hover:bg-foreground/8 active:scale-95'
            : 'text-foreground/15 cursor-not-allowed'
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        onClick={onNext}
        disabled={!canGoNext}
        aria-label="Next section"
        className={cn(
          'touch-manipulation p-2 rounded-full transition-all duration-200',
          canGoNext
            ? 'text-foreground/70 hover:text-foreground hover:bg-foreground/8 active:scale-95'
            : 'text-foreground/15 cursor-not-allowed'
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
});

NavigationControls.displayName = 'NavigationControls';

export default NavigationControls;
