import { Progress } from '../ui/progress';
import React from "react";

interface ProgressBarWithLabelProps {
  progressPercentage: number;
}

/**
 * ProgressBarWithLabel component displays a progress bar with a label showing the percentage.
 *
 * @param {ProgressBarWithLabelProps} props - The component props.
 * @param {number} props.progressPercentage - The percentage of progress to display.
 *
 * @returns {React.ReactElement} The ProgressBarWithLabel component.
 */
const ProgressBarWithLabel: React.FC<ProgressBarWithLabelProps> = ({ progressPercentage }: ProgressBarWithLabelProps): React.ReactElement => {
  return (
    <div className="relative">
      <div className="h-2.5 w-full bg-secondary/20 rounded-full overflow-hidden">
        <Progress value={progressPercentage} />
      </div>

      {/* Progress percentage label */}
      <div
        className="absolute -top-5 text-xs text-primary font-medium transition-all duration-300"
        style={{
          left: `${Math.min(Math.max(progressPercentage, 0), 100)}%`,
          transform: `translateX(-${progressPercentage > 50 ? 100 : 0}%)`,
        }}
      >
        {Math.round(progressPercentage)}%
      </div>
    </div>
  );
};

export default ProgressBarWithLabel;
