import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { MarkdownSection } from "@/services/section/parsing";

interface MobileProgressIndicatorProps {
  currentIndex: number;
  total: number;
  onSelectSection: (index: number) => void;
}

export const MobileProgressIndicator: React.FC<
  MobileProgressIndicatorProps
> = ({ currentIndex, total, onSelectSection }) => {
  const progress = ((currentIndex + 1) / total) * 100;

  return (
    <div className="space-y-6">
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
            const isCompleted = actualIndex < currentIndex;

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
          <span className="text-xs text-mutedForeground">complete</span>
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
}

export const DesktopProgressIndicator: React.FC<
  DesktopProgressIndicatorProps
> = ({ currentIndex, total, onSelectSection, sections }) => (
  <div className="hidden lg:block fixed right-8 top-1/2 -translate-y-1/2 z-40">
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
          const isCompleted = actualIndex < currentIndex;
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
