import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { MarkdownSection } from "@/services/section/parsing";
import { CheckCircle } from "lucide-react";

const CompletionAnimation: React.FC<{ onComplete: () => void }> = ({
  onComplete,
}) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="absolute -top-12 left-1/3 -translate-x-1/2 z-50 font-cascadia-code"
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -10 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="flex items-center gap-2 bg-primary/10 backdrop-blur-md border-none rounded-2xl px-2 py-1.5 text-xs font-medium text-primary font-cascadia-code">
        <CheckCircle className="w-4 h-4 text-primary" />
        <span>Reading Complete!</span>
      </div>
    </motion.div>
  );
};

interface WordProgressProps {
  sections: MarkdownSection[];
  currentIndex: number;
  readSections: Set<number>;
}

const WordProgress: React.FC<WordProgressProps> = ({
  sections,
  currentIndex,
  readSections,
}) => {
  const [hasCompletedOnce, setHasCompletedOnce] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  const {
    totalWords,
    wordsRead,
    percentage,
    isCurrentSectionRead,
    completedSections,
  } = useMemo(() => {
    const totalWords = sections.reduce(
      (sum, section) => sum + section.wordCount,
      0
    );

    // Calculate words read based on completed sections from readSections Set
    const wordsRead = sections.reduce((sum, section, index) => {
      return sum + (readSections.has(index) ? section.wordCount : 0);
    }, 0);

    // Include current section in progress if it's being read but not completed
    const currentSectionWords = readSections.has(currentIndex)
      ? 0
      : sections[currentIndex]?.wordCount || 0;
    const wordsReadWithCurrent = wordsRead + currentSectionWords;

    const percentage =
      totalWords > 0
        ? Math.round((wordsReadWithCurrent / totalWords) * 100)
        : 0;
    const isCurrentSectionRead = readSections.has(currentIndex);
    const completedSections = readSections.size;

    return {
      totalWords,
      wordsRead: wordsReadWithCurrent,
      percentage,
      isCurrentSectionRead,
      completedSections,
    };
  }, [sections, currentIndex, readSections]);

  const handleCompletionEnd = useCallback(() => {
    setShowCompletion(false);
  }, []);

  // Check for completion
  useEffect(() => {
    if (percentage === 100 && !hasCompletedOnce) {
      setHasCompletedOnce(true);
      setShowCompletion(true);
    }
  }, [percentage, hasCompletedOnce]);

  return (
    <div className="relative rounded-2xl border-4">
      <AnimatePresence>
        {showCompletion && (
          <CompletionAnimation onComplete={handleCompletionEnd} />
        )}
      </AnimatePresence>

      <motion.div
        className="text-center mb-3 rounded-2xl border-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Main percentage display */}
        <motion.div
          className="relative rounded-2xl border-4"
          animate={{
            scale: percentage === 100 ? [1, 1.05, 1] : 1,
          }}
          transition={{ duration: 0.5 }}
        >
          <motion.span
            className="text-2xl font-bold text-primary tabular-nums"
            animate={{
              color:
                percentage === 100
                  ? [
                      "hsl(var(--primary))",
                      "hsl(var(--primary) / 0.9)",
                      "hsl(var(--primary))",
                    ]
                  : "hsl(var(--primary))",
            }}
            transition={{ duration: 0.3 }}
          >
            {percentage}%
          </motion.span>

          {/* Completion badge */}
          {percentage === 100 && (
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 500 }}
            />
          )}
        </motion.div>

        {/* Word count display */}
        <div className="text-xs text-muted-foreground mt-1.5 space-y-0.5">
          <div className="font-medium">
            {wordsRead.toLocaleString()} / {totalWords.toLocaleString()} words
          </div>

          {/* Progress indicators */}
          <div className="flex items-center justify-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary/60" />
              <span>{completedSections} sections</span>
            </div>

            {!isCurrentSectionRead && (
              <>
                <div className="w-px h-3 bg-border" />
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary/30 animate-pulse" />
                  <span>reading now</span>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

interface MobileProgressIndicatorProps {
  currentIndex: number;
  total: number;
  onSelectSection: (index: number) => void;
  sections: MarkdownSection[];
  readSections: Set<number>;
}

export const MobileProgressIndicator: React.FC<
  MobileProgressIndicatorProps
> = ({ currentIndex, total, onSelectSection, sections, readSections }) => {
  const progress = ((currentIndex + 1) / total) * 100;

  return (
    <div className="space-y-6">
      {/* Word-based Progress Percentage */}
      <WordProgress
        sections={sections}
        currentIndex={currentIndex}
        readSections={readSections}
      />

      {/* Modern Progress Bar */}
      <div className="relative">
        {/* Background track */}
        <div className="h-2 bg-secondary/30 rounded-full overflow-hidden backdrop-blur-sm">
          {/* Active progress */}
          <motion.div
            className="h-full bg-gradient-to-r from-primary via-primary/90 to-primary rounded-full relative"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/60 to-primary/40 rounded-full blur-sm" />
          </motion.div>
        </div>

        {/* Modern Section Indicators */}
        <div className="flex justify-between absolute -bottom-4 left-0 right-0">
          {Array.from({ length: Math.min(total, 10) }).map((_, index) => {
            const actualIndex = Math.floor((index / 9) * (total - 1));
            const isActive = actualIndex === currentIndex;
            const isCompleted = readSections.has(actualIndex);

            return (
              <motion.button
                key={index}
                onClick={() => onSelectSection(actualIndex)}
                className={cn(
                  "relative w-3 h-3 rounded-full transition-all duration-300 group",
                  isActive
                    ? "bg-primary shadow-lg shadow-primary/30 scale-125"
                    : isCompleted
                    ? "bg-primary/70 hover:bg-primary scale-110"
                    : "bg-border hover:bg-secondary scale-100"
                )}
                whileHover={{ scale: isActive ? 1.3 : 1.15 }}
                whileTap={{ scale: 0.95 }}
                title={`Go to section ${actualIndex + 1}`}
              >
                {/* Inner highlight */}
                {isActive && (
                  <div className="absolute inset-0.5 bg-primaryForeground/20 rounded-full" />
                )}

                {/* Completion indicator */}
                {isCompleted && !isActive && (
                  <div className="absolute inset-1 bg-background/30 rounded-full" />
                )}

                {/* Hover glow */}
                <div className="absolute inset-0 bg-primary/20 rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Modern Progress Text */}
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-foreground">
            Section {currentIndex + 1}
          </span>
          <span className="text-xs text-mutedForeground">
            of {total} sections
          </span>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="text-sm font-semibold text-primary">
            {Math.round(progress)}%
          </span>
          <span className="text-xs text-mutedForeground">sections</span>
        </div>
      </div>
    </div>
  );
};

interface DesktopProgressIndicatorProps {
  currentIndex: number;
  total: number;
  onSelectSection: (index: number) => void;
  sections: MarkdownSection[];
  readSections: Set<number>;
}

export const DesktopProgressIndicator: React.FC<
  DesktopProgressIndicatorProps
> = ({ currentIndex, total, onSelectSection, sections, readSections }) => {
  const [hasCompletedOnce, setHasCompletedOnce] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  console.log(readSections);

  const { percentage } = useMemo(() => {
    const totalWords = sections.reduce(
      (sum, section) => sum + section.wordCount,
      0
    );

    // Calculate words read based on completed sections from readSections Set
    const wordsRead = sections.reduce((sum, section, index) => {
      return sum + (readSections.has(index) ? section.wordCount : 0);
    }, 0);

    // Include current section in progress if it's being read but not completed
    const currentSectionWords = readSections.has(currentIndex)
      ? 0
      : sections[currentIndex]?.wordCount || 0;
    const wordsReadWithCurrent = wordsRead + currentSectionWords;

    const percentage =
      totalWords > 0
        ? Math.round((wordsReadWithCurrent / totalWords) * 100)
        : 0;

    return { totalWords, wordsRead: wordsReadWithCurrent, percentage };
  }, [sections, currentIndex, readSections]);

  const handleCompletionEnd = useCallback(() => {
    setShowCompletion(false);
  }, []);

  // Check for completion
  useEffect(() => {
    if (percentage === 100 && !hasCompletedOnce) {
      setHasCompletedOnce(true);
      setShowCompletion(true);
    }
  }, [percentage, hasCompletedOnce]);

  return (
    <div className="hidden lg:block fixed right-8 top-1/2 -translate-y-1/2 z-40">
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 text-center min-w-[80px]">
        <div className="relative">
          <AnimatePresence>
            {showCompletion && (
              <CompletionAnimation onComplete={handleCompletionEnd} />
            )}
          </AnimatePresence>

          <motion.div
            className="bg-background/90 backdrop-blur-xl border-none rounded-2xl px-3 py-2.5 shadow-xl font-cascadia-code"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div
              className="text-lg font-bold text-primary tabular-nums"
              animate={{
                scale: percentage === 100 ? [1, 1.1, 1] : 1,
                color:
                  percentage === 100
                    ? [
                        "hsl(var(--primary))",
                        "hsl(var(--primary) / 0.8)",
                        "hsl(var(--primary))",
                      ]
                    : "hsl(var(--primary))",
              }}
              transition={{ duration: 0.3 }}
            >
              {percentage}%
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Modern vertical container */}
      <div className="relative">
        {/* Background track */}
        <div className="absolute left-1/2 -translate-x-1/2 w-0.5 h-full bg-secondary/20 rounded-full" />

        {/* Progress line */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 w-1 bg-gradient-to-b from-primary to-primary/60 rounded-full"
          initial={{ height: 0 }}
          animate={{
            height: `${((currentIndex + 1) / Math.min(total, 15)) * 100}%`,
          }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        />

        {/* Section indicators */}
        <div className="flex flex-col gap-4">
          {Array.from({ length: Math.min(total, 15) }).map((_, index) => {
            const actualIndex =
              total <= 15 ? index : Math.floor((index / 14) * (total - 1));
            const isActive = actualIndex === currentIndex;
            const isCompleted = readSections.has(actualIndex);
            const section = sections[actualIndex];

            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <motion.button
                    onClick={() => onSelectSection(actualIndex)}
                    className={cn(
                      "relative w-5 h-5 rounded-full transition-all duration-300 group z-10",
                      "border-2 backdrop-blur-sm",
                      isActive
                        ? "bg-primary border-primary shadow-lg shadow-primary/40 scale-125"
                        : isCompleted
                        ? "bg-primary/80 border-primary/80 shadow-md shadow-primary/20"
                        : "bg-cardBg border-border hover:border-secondary hover:bg-secondary/50"
                    )}
                    whileTap={{ scale: 0.9 }}
                  >
                    {/* Active pulse effect */}
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-primary/60"
                        animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}

                    {/* Completion indicator */}
                    {isCompleted && !isActive && (
                      <div className="absolute inset-1 bg-background/40 rounded-full" />
                    )}

                    {/* Hover glow */}
                    <div className="absolute inset-0 bg-primary/10 rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent
                  side="left"
                  sideOffset={12}
                  className="max-w-xs bg-background border border-border shadow-xl font-cascadia-code rounded-2xl backdrop-blur-2xl"
                >
                  <div className="flex flex-col gap-1.5 p-1">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full flex-shrink-0",
                          isActive
                            ? "bg-primary"
                            : isCompleted
                            ? "bg-primary/80"
                            : "bg-muted"
                        )}
                      />
                      <span className="text-xs font-medium text-muted-foreground">
                        Section {actualIndex + 1}
                        {isCompleted && " ✓"}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-foreground leading-snug">
                      {section?.title || `Section ${actualIndex + 1}`}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </div>
  );
};
