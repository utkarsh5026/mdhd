import React from "react";
import { cn } from "@/lib/utils";
import { Clock, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface ReadingProgressProps {
  percentage: number;
  documentProgress: number;
  isRead: boolean;
  minutesLeft: number;
}

/**
 * ReadingProgress Component
 *
 * A mobile-optimized progress indicator that shows the user's reading progress
 * for the current section and overall document.
 *
 * Features:
 * - Smooth progress bar animations
 * - Section completion indicator
 * - Estimated reading time left
 * - Overall document progress tracking
 */
const ReadingProgress: React.FC<ReadingProgressProps> = ({
  percentage,
  documentProgress,
  isRead,
  minutesLeft,
}) => {
  const validPercentage = Math.min(100, Math.max(0, percentage));

  const getProgressColor = (percent: number) => {
    if (percent >= 100 || isRead) return "bg-primary";
    if (percent >= 75) return "bg-primary/90";
    if (percent >= 50) return "bg-primary/80";
    if (percent >= 25) return "bg-primary/70";
    return "bg-primary/60";
  };

  return (
    <div className="w-full py-0.5 bg-background/5 backdrop-blur-sm border-b border-border/50">
      <div className="relative h-1 w-full bg-secondary/30">
        <motion.div
          className={cn(
            "absolute left-0 top-0 h-full",
            getProgressColor(validPercentage)
          )}
          style={{ width: `${validPercentage}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${validPercentage}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />

        {/* Document progress indicator (small bar above) */}
        <div className="absolute -top-1 left-0 w-full h-0.5 bg-secondary/20">
          <div
            className="absolute left-0 top-0 h-full bg-primary/30"
            style={{ width: `${documentProgress}%` }}
          />
        </div>
      </div>

      {/* Mobile-optimized status indicators */}
      <div className="flex items-center justify-between px-4 py-1 text-xs font-cascadia-code text-muted-foreground/80">
        <div className="flex items-center gap-1.5">
          {isRead ? (
            <div className="flex items-center gap-1 text-primary/90">
              <CheckCircle2 className="h-3 w-3" />
              <span>Section completed</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="font-medium">{validPercentage}%</span>
              <span>complete</span>
            </div>
          )}
        </div>

        {!isRead && minutesLeft > 0 && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>~{minutesLeft} min left</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadingProgress;
