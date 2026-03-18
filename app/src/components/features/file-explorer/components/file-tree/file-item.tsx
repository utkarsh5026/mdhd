import { FileText } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';
import type { FileTreeNode } from '@/services/indexeddb';

interface FileItemProps {
  node: FileTreeNode;
  depth: number;
  isSelected: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export const FileItem: React.FC<FileItemProps> = ({
  node,
  depth,
  isSelected,
  onClick,
  onContextMenu,
}) => {
  return (
    <div
      className={cn(
        'group flex items-center gap-1.5 px-2 py-0.5 cursor-pointer rounded-md transition-all duration-150',
        'hover:bg-accent/40',
        isSelected && 'bg-primary/10 text-primary'
      )}
      style={{ paddingLeft: `${depth * 14 + 10}px` }}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <FileText
        className={cn(
          'h-3.5 w-3.5 shrink-0 transition-colors',
          isSelected
            ? 'text-primary/70'
            : 'text-muted-foreground/60 group-hover:text-muted-foreground'
        )}
      />
      <span
        className={cn(
          'text-xs truncate flex-1 transition-colors',
          isSelected
            ? 'text-primary font-medium'
            : 'text-muted-foreground group-hover:text-foreground/80'
        )}
      >
        {node.name}
      </span>
    </div>
  );
};
