import React from 'react';
import ProgressBarWithLabel from '@/components/utils/ProgressBarWithLabel';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progressPercentage: number;
  readSectionsIndexes: Set<number>;
  sections: { id: number; title: string }[];
  currentIndex: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progressPercentage,
  readSectionsIndexes,
  sections,
  currentIndex,
}) => {
  const getSectionBarClass = (isRead: boolean, isCurrent: boolean) => {
    if (isRead) return 'bg-primary/70';
    if (isCurrent) return 'bg-primary/30';
    return 'bg-secondary/30';
  };

  const readSectionsCount = readSectionsIndexes.size;

  return (
    <div className="space-y-2 mt-6">
      <ProgressBarWithLabel progressPercentage={progressPercentage} />

      <div className="flex justify-between items-center text-xs text-muted-foreground py-1">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-primary/80">{readSectionsCount}</span> of{' '}
          <span className="font-medium">{sections.length}</span> sections read
        </div>

        <div className="text-xs">
          {sections.length - readSectionsCount > 0 ? (
            <span title="Estimated based on average reading speed">
              ~{Math.ceil((sections.length - readSectionsCount) * 1.5)} min left
            </span>
          ) : (
            <span className="text-primary/80 font-medium">Complete!</span>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center pt-1">
        <div className="text-xs text-muted-foreground">
          {readSectionsCount > 0 ? (
            <span>Last read: {new Date().toLocaleDateString()}</span>
          ) : (
            <span>Not started yet</span>
          )}
        </div>
      </div>

      {/* Progress stages visualization */}
      <div className="flex gap-0.5 items-center mt-1">
        {sections.map((section, idx) => (
          <div
            key={section.id}
            className={cn(
              'h-1 flex-grow transition-all duration-300',
              getSectionBarClass(readSectionsIndexes.has(section.id), idx === currentIndex)
            )}
            title={`${section.title} (${readSectionsIndexes.has(section.id) ? 'Read' : 'Unread'})`}
          />
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;
