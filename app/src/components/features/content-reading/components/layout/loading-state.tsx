import React from 'react';
import { motion } from 'framer-motion';

const LoadingState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      {/* Breathing dots */}
      <div className="flex items-center gap-3">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-3 h-3 bg-primary rounded-full"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: index * 0.2,
              ease: 'easeInOut',
            }}
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
