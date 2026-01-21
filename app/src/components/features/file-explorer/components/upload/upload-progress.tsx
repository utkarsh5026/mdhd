import React from 'react';
import { Progress } from '@/components/ui/progress';
import type { UploadProgress } from '@/services/indexeddb';

interface UploadProgressIndicatorProps {
  progress: UploadProgress;
}

export const UploadProgressIndicator: React.FC<UploadProgressIndicatorProps> = ({ progress }) => {
  const percentage = progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0;

  return (
    <div className="px-3 py-2 space-y-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Uploading...</span>
        <span>
          {progress.processed}/{progress.total}
        </span>
      </div>
      <Progress value={percentage} className="h-1" />
      {progress.currentFile && (
        <p className="text-xs text-muted-foreground truncate">{progress.currentFile}</p>
      )}
    </div>
  );
};
