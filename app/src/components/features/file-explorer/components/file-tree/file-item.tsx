import React from 'react';
import { FileText } from 'lucide-react';
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
        'flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-accent/50 rounded-sm transition-colors',
        isSelected && 'bg-accent'
      )}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-sm truncate flex-1 text-muted-foreground">{node.name}</span>
    </div>
  );
};
