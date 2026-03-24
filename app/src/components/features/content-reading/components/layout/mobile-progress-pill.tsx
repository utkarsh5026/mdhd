import { memo } from 'react';

interface MobileProgressPillProps {
  currentIndex: number;
  total: number;
}

const MobileProgressPill: React.FC<MobileProgressPillProps> = memo(({ currentIndex, total }) => {
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;

  return (
    <div className="sm:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
      <div className="flex flex-col items-center gap-1.5 px-4 py-2 rounded-full bg-card/90 backdrop-blur-sm border border-border/30 shadow-md">
        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          {currentIndex + 1} / {total}
        </span>
        <div className="w-16 h-0.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary/60 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
});

MobileProgressPill.displayName = 'MobileProgressPill';
export default MobileProgressPill;
