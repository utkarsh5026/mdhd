import React from 'react';
import { ChevronRight, Folder, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FileTreeNode } from '@/services/indexeddb';

interface DirectoryItemProps {
  node: FileTreeNode;
  depth: number;
  isExpanded: boolean;
  onToggle: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export const DirectoryItem: React.FC<DirectoryItemProps> = ({
  node,
  depth,
  isExpanded,
  onToggle,
  onContextMenu,
}) => {
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-accent/50 rounded-sm transition-colors'
      )}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
      onClick={onToggle}
      onContextMenu={onContextMenu}
    >
      <ChevronRight
        className={cn(
          'h-4 w-4 text-muted-foreground shrink-0 transition-transform',
          isExpanded && 'rotate-90',
          !hasChildren && 'opacity-0'
        )}
      />
      {isExpanded ? (
        <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
      ) : (
        <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
      )}
      <span className="text-sm truncate flex-1 text-muted-foreground">{node.name}</span>
    </div>
  );
};
