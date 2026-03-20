import type { LucideIcon } from 'lucide-react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  GalleryHorizontal,
  Grid3X3,
  StickyNote,
  X,
} from 'lucide-react';
import { memo, useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

interface ControlButtonProps {
  onClick: () => void;
  icon: LucideIcon;
  label?: string;
  ariaLabel?: string;
  disabled?: boolean;
  active?: boolean;
}

const ControlButton: React.FC<ControlButtonProps> = ({
  onClick,
  icon: Icon,
  label,
  ariaLabel,
  disabled,
  active,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
    className={cn(
      'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] transition-colors duration-200',
      disabled
        ? 'text-foreground/12 cursor-not-allowed'
        : active
          ? 'text-primary bg-primary/8'
          : 'text-muted-foreground/60 hover:text-foreground hover:bg-foreground/6'
    )}
  >
    <Icon className="h-3.5 w-3.5" />
    {label && <span className="hidden sm:inline">{label}</span>}
  </button>
);

interface SlideControlsProps {
  currentIndex: number;
  total: number;
  showNotes: boolean;
  showFilmstrip: boolean;
  startTime: number | null;
  visible: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onToggleNotes: () => void;
  onToggleOverview: () => void;
  onToggleFilmstrip: () => void;
  onExit: () => void;
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const SlideControls: React.FC<SlideControlsProps> = memo(
  ({
    currentIndex,
    total,
    showNotes,
    showFilmstrip,
    startTime,
    visible,
    onPrevious,
    onNext,
    onToggleNotes,
    onToggleOverview,
    onToggleFilmstrip,
    onExit,
  }) => {
    const canGoPrev = currentIndex > 0;
    const canGoNext = currentIndex < total - 1;
    const progress = total > 1 ? ((currentIndex + 1) / total) * 100 : 100;

    const [elapsed, setElapsed] = useState(0);
    useEffect(() => {
      if (!startTime) return;
      setElapsed(Date.now() - startTime);
      const interval = setInterval(() => setElapsed(Date.now() - startTime), 1000);
      return () => clearInterval(interval);
    }, [startTime]);

    return (
      <div
        className={cn(
          'transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'
        )}
      >
        {/* Progress bar */}
        <div className="h-0.5 bg-foreground/4">
          <div
            className="h-full bg-primary/50 transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between px-5 py-2.5 bg-background/80 backdrop-blur-xl">
          {/* Left: exit + timer */}
          <div className="flex items-center gap-4 min-w-40">
            <ControlButton onClick={onExit} icon={X} label="Exit" />

            {startTime && (
              <div className="flex items-center gap-1.5 text-muted-foreground/35">
                <Clock className="h-3 w-3" />
                <span className="text-xs tabular-nums font-mono">{formatElapsed(elapsed)}</span>
              </div>
            )}
          </div>

          {/* Center: navigation */}
          <div className="flex items-center gap-1">
            <ControlButton
              onClick={onPrevious}
              disabled={!canGoPrev}
              icon={ChevronLeft}
              ariaLabel="Previous slide"
            />

            <button
              onClick={onToggleOverview}
              className={cn(
                'text-[13px] font-medium tabular-nums min-w-18 text-center',
                'px-3 py-1.5 rounded-lg transition-colors duration-200',
                'text-foreground/50 hover:text-foreground hover:bg-foreground/6'
              )}
              title="Slide overview (G)"
            >
              {currentIndex + 1}
              <span className="text-foreground/20 mx-1">/</span>
              {total}
            </button>

            <ControlButton
              onClick={onNext}
              disabled={!canGoNext}
              icon={ChevronRight}
              ariaLabel="Next slide"
            />
          </div>

          {/* Right: grid + notes */}
          <div className="flex items-center gap-1 min-w-40 justify-end">
            <ControlButton
              onClick={onToggleFilmstrip}
              icon={GalleryHorizontal}
              label="Slides"
              ariaLabel="Toggle slide filmstrip"
              active={showFilmstrip}
            />
            <ControlButton
              onClick={onToggleOverview}
              icon={Grid3X3}
              label="Grid"
              ariaLabel="Slide overview"
            />
            <ControlButton
              onClick={onToggleNotes}
              icon={StickyNote}
              label="Notes"
              ariaLabel="Toggle presenter notes"
              active={showNotes}
            />
          </div>
        </div>
      </div>
    );
  }
);

SlideControls.displayName = 'SlideControls';

export default SlideControls;
