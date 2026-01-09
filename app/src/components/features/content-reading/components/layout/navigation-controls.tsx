import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationControlsProps {
  currentIndex: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
  isVisible: boolean;
}

interface NavigationButtonProps {
  onClick: () => void;
  disabled: boolean;
  icon: LucideIcon;
}

const NavigationButton: React.FC<NavigationButtonProps> = ({
  onClick,
  disabled,
  icon: Icon,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'relative group touch-manipulation',
      'p-3 sm:p-3.5 lg:p-4 rounded-full',
      'transition-all duration-300 ease-out',
      'border-2 backdrop-blur-md shadow-lg',
      disabled
        ? 'bg-secondary/20 border-border/30 text-mutedForeground/50 cursor-not-allowed opacity-50'
        : 'bg-cardBg/80 border-border/50 text-foreground hover:border-border hover:bg-cardBg/90 hover:text-primary hover:shadow-xl hover:scale-105 hover:-translate-y-0.5 active:scale-95'
    )}
  >
    {/* Icon */}
    <Icon
      className={cn(
        'relative z-10 transition-all duration-300',
        'h-5 w-5 sm:h-6 sm:w-6 lg:h-6 lg:w-6',
        !disabled && 'group-hover:scale-110'
      )}
    />
  </button>
);

const NavigationControls: React.FC<NavigationControlsProps> = ({
  currentIndex,
  total,
  onPrevious,
  onNext,
  isVisible,
}) => {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'relative w-full z-50',
        'animate-in fade-in slide-in-from-bottom-4 duration-500'
      )}
    >
      {/* Modern gradient background with sophisticated blur */}
      <div className="relative">
        {/* Content container */}
        <div className="relative flex items-center justify-center p-4 sm:p-5 lg:p-6">
          {/* Premium control group */}
          <div className="flex items-center gap-6 sm:gap-7 lg:gap-8">
            {/* Previous Button */}
            <NavigationButton
              onClick={onPrevious}
              disabled={currentIndex === 0}
              icon={ChevronLeft}
            />

            {/* Modern separator with gradient */}
            <div className="relative">
              <div className="w-px h-6 sm:h-8 lg:h-10 bg-gradient-to-b from-transparent via-border to-transparent" />
              <div className="absolute inset-0 w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent blur-sm" />
            </div>

            {/* Next Button */}
            <NavigationButton
              onClick={onNext}
              disabled={currentIndex === total - 1}
              icon={ChevronRight}
            />
          </div>

          {/* Optional: Page indicator dots for mobile */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 sm:hidden">
            <div className="flex gap-2">
              {Array.from({ length: Math.min(total, 5) }).map((_, index) => {
                const actualIndex = total <= 5 ? index : Math.floor((index / 4) * (total - 1));
                const isActive = actualIndex === currentIndex;

                return (
                  <div
                    key={index}
                    className={cn(
                      'w-1.5 h-1.5 rounded-full transition-all duration-300',
                      isActive ? 'bg-primary scale-125' : 'bg-border/50'
                    )}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationControls;
