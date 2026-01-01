import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hash, Target, Zap, BookOpen, Focus, Brain } from 'lucide-react';

interface LoadingPageProps {
  onComplete: () => void;
  duration?: number;
}

const LoadingPage: React.FC<LoadingPageProps> = ({ onComplete, duration = 2500 }) => {
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const phases = [
      { duration: 500, label: 'Initializing' },
      { duration: 650, label: 'Parsing Structure' },
      { duration: 700, label: 'Creating Sections' },
      { duration: 650, label: 'Optimizing Focus' },
    ];

    let currentTime = 0;
    let currentPhase = 0;

    const progressInterval = setInterval(() => {
      currentTime += 30;
      const totalTime = phases.reduce((sum, p) => sum + p.duration, 0);
      setProgress((currentTime / totalTime) * 100);

      // Check if we should move to next phase
      let phaseTime = 0;
      for (let i = 0; i <= currentPhase; i++) {
        phaseTime += phases[i].duration;
      }

      if (currentTime >= phaseTime && currentPhase < phases.length - 1) {
        currentPhase++;
        setPhase(currentPhase);
      }

      if (currentTime >= totalTime) {
        clearInterval(progressInterval);
        setTimeout(() => onComplete(), 200);
      }
    }, 30);

    return () => clearInterval(progressInterval);
  }, [onComplete, duration]);

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center overflow-hidden font-cascadia-code">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/5 to-secondary/10" />

      {/* Floating Elements */}
      <FloatingElements />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-8 px-4">
        {/* Logo Animation */}
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            className="relative"
          >
            <h1 className="text-6xl md:text-8xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                MDHD
              </span>
            </h1>

            {/* Breathing glow effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/15 to-primary/10 blur-3xl"
              animate={{
                opacity: [0.2, 0.4, 0.2],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
            className="text-lg md:text-xl text-muted-foreground mt-4"
          >
            Markdown High Definition
          </motion.p>
        </div>

        {/* Section Transformation Visual */}
        <div className="w-full max-w-md">
          <SectionTransformation phase={phase} />
        </div>

        {/* Phase Indicator */}
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex items-center gap-3 text-sm text-muted-foreground"
          >
            <LoadingIcon phase={phase} />
            <span>
              {
                [
                  'Preparing your reading experience',
                  'Analyzing document structure',
                  'Creating focused sections',
                  'Optimizing for deep learning',
                ][phase]
              }
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Progress Bar */}
        <div className="w-full max-w-md">
          <div className="relative h-1 bg-secondary/30 rounded-full overflow-hidden">
            <motion.div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary via-primary/90 to-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            />

            {/* Glow effect */}
            <motion.div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary/40 to-transparent rounded-full blur-sm"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress + 8, 100)}%` }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            />
          </div>

          {/* Progress percentage */}
          <motion.div
            className="mt-2 text-center text-xs text-muted-foreground"
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            {Math.round(progress)}%
          </motion.div>
        </div>

        {/* Inspirational Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2, ease: 'easeOut' }}
          className="max-w-lg text-center"
        >
          <p className="text-sm text-muted-foreground/80 italic">
            "The art of reading is to skip judiciously."
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">— Philip Gilbert Hamerton</p>
        </motion.div>
      </div>
    </div>
  );
};

const FloatingElements: React.FC = () => {
  const shapes = [
    { icon: Hash, delay: 0, position: { top: '10%', left: '15%' } },
    { icon: Target, delay: 0.8, position: { top: '20%', right: '20%' } },
    { icon: BookOpen, delay: 1.6, position: { bottom: '25%', left: '10%' } },
    { icon: Brain, delay: 2.4, position: { bottom: '15%', right: '15%' } },
    { icon: Focus, delay: 3.2, position: { top: '60%', left: '5%' } },
    { icon: Zap, delay: 4, position: { top: '70%', right: '8%' } },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none">
      {shapes.map((shape, index) => (
        <motion.div
          key={index}
          className="absolute text-primary/8"
          style={shape.position}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 0.4, 0],
            scale: [0, 1, 0],
            rotate: [0, 180],
          }}
          transition={{
            duration: 6,
            delay: shape.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <shape.icon className="w-5 h-5 md:w-6 md:h-6" />
        </motion.div>
      ))}
    </div>
  );
};

const SectionTransformation: React.FC<{ phase: number }> = ({ phase }) => {
  const textLines = [
    '# Introduction to Learning',
    '## Understanding Focus',
    '### Deep Concentration',
    '## Practical Applications',
  ];

  return (
    <div className="relative bg-card/30 backdrop-blur-sm rounded-2xl p-6 border border-border/20">
      <AnimatePresence mode="wait">
        {phase === 0 && (
          <motion.div
            key="chaotic"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {/* Chaotic text representation */}
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                className="h-2 bg-muted/60 rounded"
                style={{ width: `${60 + Math.random() * 40}%` }}
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 1.5, delay: i * 0.1, repeat: Infinity }}
              />
            ))}
            <div className="text-center text-xs text-muted-foreground mt-4">Overwhelming text</div>
          </motion.div>
        )}

        {phase === 1 && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {textLines.map((line, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-2"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.2 }}
              >
                <motion.div
                  className="text-primary text-xs"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, delay: i * 0.3, repeat: Infinity }}
                >
                  {line.startsWith('###') ? '###' : line.startsWith('##') ? '##' : '#'}
                </motion.div>
                <div className="h-2 bg-primary/30 rounded flex-1" />
              </motion.div>
            ))}
            <div className="text-center text-xs text-muted-foreground mt-4">
              Detecting structure
            </div>
          </motion.div>
        )}

        {phase === 2 && (
          <motion.div
            key="sectioning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {[0, 1, 2].map((sectionIndex) => (
              <motion.div
                key={sectionIndex}
                className="p-3 rounded-lg border-2 border-primary/20 bg-primary/5"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: sectionIndex * 0.3, type: 'spring' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-primary">
                    Section {sectionIndex + 1}
                  </span>
                  <div className="w-6 h-1 bg-primary/40 rounded" />
                </div>
                <div className="mt-2 space-y-1">
                  <div className="h-1.5 bg-muted/50 rounded w-full" />
                  <div className="h-1.5 bg-muted/50 rounded w-3/4" />
                </div>
              </motion.div>
            ))}
            <div className="text-center text-xs text-muted-foreground mt-4">
              Creating focused sections
            </div>
          </motion.div>
        )}

        {phase === 3 && (
          <motion.div
            key="focused"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <motion.div
              className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/30 flex items-center justify-center mb-4"
              animate={{
                scale: [1, 1.1, 1],
                borderColor: [
                  'rgba(var(--primary), 0.3)',
                  'rgba(var(--primary), 0.6)',
                  'rgba(var(--primary), 0.3)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Target className="w-8 h-8 text-primary" />
            </motion.div>
            <div className="text-sm font-medium text-primary mb-2">Perfect Focus Achieved</div>
            <div className="text-xs text-muted-foreground">Ready for distraction-free learning</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LoadingIcon: React.FC<{ phase: number }> = ({ phase }) => {
  const icons = [Hash, BookOpen, Target, Brain];
  const Icon = icons[phase];

  return (
    <motion.div
      key={phase}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 200 }}
      className="w-4 h-4 text-primary"
    >
      <Icon className="w-full h-full" />
    </motion.div>
  );
};

export default LoadingPage;
