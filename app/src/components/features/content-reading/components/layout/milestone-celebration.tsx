import React from 'react';

import { useMilestone } from '@/hooks';
import { cn } from '@/lib/utils';

interface MilestoneCelebrationProps {
  readCount: number;
  total: number;
}

const MilestoneCelebration: React.FC<MilestoneCelebrationProps> = ({ readCount, total }) => {
  const { milestone, visible } = useMilestone(readCount, total);

  if (!milestone) return null;

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-100',
        'pointer-events-none select-none',
        'transition-all duration-300 ease-out',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      )}
    >
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/90 backdrop-blur-sm border border-border/30 shadow-lg">
        <span className="text-base">{milestone.emoji}</span>
        <span className="text-xs font-medium text-foreground">{milestone.label}</span>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {Math.round((readCount / total) * 100)}%
        </span>
      </div>
    </div>
  );
};

MilestoneCelebration.displayName = 'MilestoneCelebration';
export default MilestoneCelebration;
