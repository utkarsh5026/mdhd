import { useTheme } from '@/hooks';
import { cn } from '@/lib/utils';

import styles from './loading-bar.module.css';

export interface LoadingFallbackProps {
  message?: string;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({ message = 'Loading' }) => {
  useTheme();
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading content"
      className="flex h-screen flex-col items-center justify-center bg-background overflow-hidden gap-14"
    >
      {/* Wordmark */}
      <div className={cn('flex flex-col items-center gap-5', styles.appear)}>
        <span
          className="text-5xl font-light tracking-[0.6em] text-foreground/60 select-none pl-[0.6em]"
          aria-hidden="true"
        >
          MDHD
        </span>

        {/* Sweep line */}
        <div className="relative h-px w-32 overflow-hidden bg-border/25">
          <div className={cn('absolute inset-y-0 w-full bg-primary/70', styles.sweep)} />
        </div>
      </div>

      {/* Status row */}
      <div className={cn('flex items-center gap-3', styles.appearDelayed)}>
        <div className="flex gap-1.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn('h-1 w-1 rounded-full bg-muted-foreground/40', styles.dot)}
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </div>
        <span className="text-xs tracking-widest uppercase text-muted-foreground/40">
          {message}
        </span>
      </div>
    </div>
  );
};
