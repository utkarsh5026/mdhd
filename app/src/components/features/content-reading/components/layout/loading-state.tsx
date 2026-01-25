import React from 'react';
import { motion } from 'framer-motion';
import { generateArrayWithUniqueIds } from '@/utils/array';

const contentSkeleton = generateArrayWithUniqueIds(3);

const LoadingState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-linear-to-br from-background via-primary/5 to-secondary/10 relative overflow-hidden font-cascadia-code">
      {/* Main loading content */}
      <div className="relative z-10 flex flex-col items-center space-y-8">
        {/* Animated logo/icon */}
        <motion.div
          className="relative"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="relative w-20 h-20">
            {/* Outer ring */}
            <motion.div
              className="absolute inset-0 border-4 border-primary/30 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />

            {/* Inner ring */}
            <motion.div
              className="absolute inset-2 border-4 border-primary/60 rounded-full border-t-primary"
              animate={{ rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />

            {/* Center dot */}
            <motion.div
              className="absolute inset-6 bg-primary rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>
        </motion.div>

        {/* Loading text */}
        <motion.div
          className="text-center space-y-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <h3 className="text-2xl font-semibold text-foreground">
            Preparing Your Reading Experience
          </h3>

          <motion.p
            className="text-muted-foreground text-lg"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            Parsing sections and optimizing content...
          </motion.p>
        </motion.div>

        {/* Progress indicators */}
        <motion.div
          className="flex space-x-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          {contentSkeleton.map((skeleton, index) => (
            <motion.div
              key={skeleton}
              className="w-3 h-3 bg-primary/60 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: index * 0.3,
                ease: 'easeInOut',
              }}
            />
          ))}
        </motion.div>

        {/* Content skeleton preview */}
        <motion.div
          className="w-full max-w-2xl space-y-4 mt-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <div className="text-sm text-muted-foreground/60 text-center mb-6">
            Preview of your content structure
          </div>

          {/* Skeleton content */}
          <div className="space-y-4">
            {/* Title skeleton */}
            <div className="space-y-2">
              <motion.div
                className="h-8 bg-linear-to-r from-primary/20 to-secondary/20 rounded-lg"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{ width: '75%' }}
              />
            </div>

            {/* Paragraph skeletons */}
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <motion.div
                  className="h-4 bg-linear-to-r from-muted/40 to-muted/20 rounded"
                  animate={{ opacity: [0.2, 0.4, 0.2] }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: 'easeInOut',
                  }}
                  style={{ width: `${85 + Math.random() * 15}%` }}
                />
                <motion.div
                  className="h-4 bg-linear-to-r from-muted/30 to-muted/15 rounded"
                  animate={{ opacity: [0.15, 0.35, 0.15] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3 + 0.5,
                    ease: 'easeInOut',
                  }}
                  style={{ width: `${70 + Math.random() * 20}%` }}
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tip text */}
        <motion.div
          className="text-center text-sm text-muted-foreground/80 max-w-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
        >
          <motion.span
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            💡 Tip: Use arrow keys or swipe gestures to navigate between sections
          </motion.span>
        </motion.div>
      </div>
    </div>
  );
};

export default LoadingState;
