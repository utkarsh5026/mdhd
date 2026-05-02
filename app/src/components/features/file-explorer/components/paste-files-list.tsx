import { Clipboard, Trash2 } from 'lucide-react';
import React, { memo } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/utils/time';

import { usePasteFilesList } from '../hooks/use-paste-files-list';
import type { PasteFileMetadata } from '../store/file-store';
import { DeleteDialog } from './actions/delete-dialog';

interface PasteFilesListProps {
  files: PasteFileMetadata[];
  onDelete: (id: string) => Promise<void>;
  onBatchDelete: (ids: string[]) => Promise<void>;
  className?: string;
}

const PasteFilesList: React.FC<PasteFilesListProps> = memo(
  ({ files, onDelete, onBatchDelete, className }) => {
    const {
      deleteTarget,
      setDeleteTarget,
      isDeleting,
      selectedIds,
      handleFileClick,
      handleConfirmDelete,
      handleBatchDelete,
      toggleSelect,
      toggleSelectAll,
    } = usePasteFilesList(files, onDelete, onBatchDelete);

    const hasSelection = selectedIds.size > 0;
    const allSelected = selectedIds.size === files.length;

    return (
      <>
        {hasSelection && (
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/30 bg-accent/30">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleSelectAll}
                className="h-3.5 w-3.5"
              />
              <span className="text-[11px] text-muted-foreground/70">
                {selectedIds.size} selected
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleBatchDelete}
              disabled={isDeleting}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          </div>
        )}

        <div className={cn('flex flex-col', className)}>
          {files.map((file) => {
            const displayName = file.name.replace(/\.md$/, '');
            const isSelected = selectedIds.has(file.id);

            return (
              <div
                key={file.id}
                className={cn(
                  'group flex items-center gap-2 px-3 py-1 cursor-pointer transition-colors rounded-sm',
                  isSelected ? 'bg-accent/60' : 'hover:bg-accent/50'
                )}
                onClick={() => handleFileClick(file)}
              >
                <div
                  className={cn(
                    'shrink-0 transition-opacity',
                    hasSelection ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  )}
                  onClick={(e) => toggleSelect(file.id, e)}
                >
                  <Checkbox checked={isSelected} className="h-3.5 w-3.5" />
                </div>

                {!hasSelection && (
                  <Clipboard
                    className={cn(
                      'h-3.5 w-3.5 shrink-0 transition-colors',
                      isSelected
                        ? 'text-primary/70'
                        : 'text-muted-foreground/60 group-hover:text-muted-foreground/80'
                    )}
                  />
                )}

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground/85 truncate group-hover:text-foreground transition-colors">
                    {displayName}
                  </div>
                  <div className="text-[10px] text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors">
                    {formatRelativeTime(file.createdAt)}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(file);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-destructive transition-colors" />
                </Button>
              </div>
            );
          })}
        </div>

        <DeleteDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          node={
            deleteTarget
              ? {
                  id: deleteTarget.id,
                  name: deleteTarget.name.replace(/\.md$/, ''),
                  path: deleteTarget.path,
                  type: 'file',
                }
              : null
          }
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
        />
      </>
    );
  }
);

PasteFilesList.displayName = 'PasteFilesList';
export default PasteFilesList;
