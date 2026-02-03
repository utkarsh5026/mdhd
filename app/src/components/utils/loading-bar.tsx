import { cn } from '@/lib/utils';
import styles from './loading-bar.module.css';
import { useTheme } from '@/hooks';

interface LoadingFallbackProps {
  message?: string;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({ message = 'Loading' }) => {
  useTheme();
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading content"
      className="relative flex h-screen items-center justify-center bg-background overflow-hidden"
    >
      {/* Background pattern */}
      <div className={styles.backgroundPattern} aria-hidden="true" />

      {/* Main content container */}
      <div className="relative z-10 flex flex-col items-center gap-12">
        {/* Circular container with dots */}
        <div className="relative">
          {/* Outer decorative ring */}
          <div
            className={cn(
              'absolute inset-0 rounded-full border-2 border-muted/20',
              styles.outerRing
            )}
            aria-hidden="true"
          />

          {/* Glow effect */}
          <div className={styles.glowOverlay} aria-hidden="true" />

          {/* Inner container */}
          <div className="relative z-10 flex items-center justify-center w-32 h-32 rounded-full bg-card/30 backdrop-blur-sm border border-border/50">
            <div className="flex items-center gap-4">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={cn(
                    'w-4 h-4 bg-primary rounded-full shadow-lg shadow-primary/50',
                    styles.dot
                  )}
                  style={{ animationDelay: `${index * 0.15}s` }}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Loading text with additional info */}
        <div className="flex flex-col items-center gap-3">
          <p
            className={cn(
              'text-muted-foreground font-cascadia-code text-2xl font-medium',
              styles.text
            )}
          >
            {message}
          </p>
          <div className="flex items-center gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn('w-1.5 h-1.5 rounded-full bg-muted-foreground/40', styles.subDot)}
                style={{ animationDelay: `${i * 0.2}s` }}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
