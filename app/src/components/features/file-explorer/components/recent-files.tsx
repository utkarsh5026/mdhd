import React, { memo, useMemo } from 'react';
import { toast } from 'sonner';

import { useCustomIconForFile } from '@/components/features/tabs';
import { cn } from '@/lib/utils';
import { fileStorageDB, type StoredFile } from '@/services/indexeddb';
import { generateCover } from '@/utils/notion-cover';

import { type RecentFileEntry, useFileStoreActions, useRecentFiles } from '../store/file-store';

function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const RecentFileIcon: React.FC<{ id: string; contentHash?: string }> = ({ id, contentHash }) => {
  const customIcon = useCustomIconForFile(id);
  const autoIcon = useMemo(() => generateCover(contentHash || id).icon, [contentHash, id]);
  return (
    <span
      className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-[12px] leading-none select-none"
      aria-hidden
    >
      {customIcon || autoIcon}
    </span>
  );
};

const RecentFileItem: React.FC<{
  entry: RecentFileEntry;
  isSelected: boolean;
  onClick: () => void;
}> = memo(({ entry, isSelected, onClick }) => (
  <div
    role="button"
    tabIndex={0}
    className={cn(
      'group relative flex items-center gap-2 px-3 py-1 cursor-pointer transition-colors duration-100',
      isSelected ? 'bg-accent/60' : 'hover:bg-accent/35'
    )}
    onClick={onClick}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    }}
  >
    {isSelected && <div className="absolute left-0 inset-y-1 w-0.5 bg-primary/60 rounded-r-full" />}
    <RecentFileIcon id={entry.id} contentHash={entry.contentHash} />
    <span
      className={cn(
        'text-xs truncate flex-1 transition-colors',
        isSelected
          ? 'text-foreground/80 font-medium'
          : 'text-muted-foreground/60 group-hover:text-foreground/75'
      )}
    >
      {entry.name}
    </span>
    <span className="text-[10px] text-muted-foreground/30 shrink-0 group-hover:text-muted-foreground/45 transition-colors tabular-nums">
      {timeAgo(entry.accessedAt)}
    </span>
  </div>
));
RecentFileItem.displayName = 'RecentFileItem';

interface RecentFilesSectionProps {
  selectedFilePath: string | null;
  onFileSelect?: (file: StoredFile) => void;
}

const RecentFilesSection: React.FC<RecentFilesSectionProps> = memo(
  ({ selectedFilePath, onFileSelect }) => {
    const recentFiles = useRecentFiles();
    const { selectFile } = useFileStoreActions();

    if (recentFiles.length === 0) return null;

    const handleClick = async (entry: RecentFileEntry) => {
      try {
        const file = await fileStorageDB.getFile(entry.id);
        if (file) {
          selectFile(file);
          onFileSelect?.(file);
        } else {
          toast.error(`"${entry.name}" not found`);
        }
      } catch {
        toast.error(`Failed to open "${entry.name}"`);
      }
    };

    return (
      <div className="border-b border-border/25">
        <div className="flex items-center gap-1.5 px-3 py-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/35 select-none">
            Recent
          </span>
        </div>
        <div className="pb-1">
          {recentFiles.map((entry) => (
            <RecentFileItem
              key={entry.id}
              entry={entry}
              isSelected={selectedFilePath === entry.path}
              onClick={() => handleClick(entry)}
            />
          ))}
        </div>
      </div>
    );
  }
);
RecentFilesSection.displayName = 'RecentFilesSection';
export { RecentFilesSection };
