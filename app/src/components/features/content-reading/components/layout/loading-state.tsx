import React from 'react';
import styles from './loading-state.module.css';

const LoadingState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      {/* Breathing dots */}
      <div className="flex items-center gap-3">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={`w-3 h-3 bg-primary rounded-full ${styles.dot}`}
          />
        ))}
      </div>

      {/* Simple loading text */}
      <p className="text-sm text-muted-foreground">
        Loading content...
      </p>
    </div>
  );
};

export default LoadingState;
