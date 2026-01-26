import React from 'react';
import { cn } from '@/lib/utils';
import styles from './zen-position-indicator.module.css';

interface ZenPositionIndicatorProps {
  currentIndex: number;
  total: number;
  className?: string;
}

/**
 * Minimal position indicator for Zen Mode
 *
 * Shows a subtle dot indicator on the right side of the screen
 * representing the current reading position.
 */
const ZenPositionIndicator: React.FC<ZenPositionIndicatorProps> = ({
  currentIndex,
  total,
  className,
}) => {
  // Calculate position percentage (0 to 100)
  const progressPercent = total > 1 ? (currentIndex / (total - 1)) * 100 : 0;

  return (
    <div
      className={cn(
        'fixed right-3 top-1/2 -translate-y-1/2 h-32 flex items-center justify-center z-40',
        className
      )}
    >
      {/* Track line */}
      <div className="w-0.5 h-full bg-white/10 rounded-full relative">
        {/* Position indicator dot */}
        <div
          className={styles.indicator}
          style={{
            top: `${progressPercent}%`,
          }}
        />
      </div>
    </div>
  );
};

export default ZenPositionIndicator;
