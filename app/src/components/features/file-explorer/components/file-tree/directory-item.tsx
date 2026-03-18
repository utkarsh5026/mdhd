import { ChevronRight, Folder, FolderOpen } from 'lucide-react';
import React from 'react';

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
        'group flex items-center gap-1 px-2 py-0.5 cursor-pointer rounded-md transition-all duration-150',
        'hover:bg-accent/40'
      )}
      style={{ paddingLeft: `${depth * 14 + 10}px` }}
      onClick={onToggle}
      onContextMenu={onContextMenu}
    >
      <ChevronRight
        className={cn(
          'h-3 w-3 text-muted-foreground/50 shrink-0 transition-transform duration-200',
          isExpanded && 'rotate-90',
          !hasChildren && 'opacity-0'
        )}
      />
      {isExpanded ? (
        <FolderOpen className="h-3.5 w-3.5 text-amber-500/70 shrink-0" />
      ) : (
        <Folder className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-amber-500/60 shrink-0 transition-colors" />
      )}
      <span className="text-xs truncate flex-1 text-foreground/70 group-hover:text-foreground/90 font-medium transition-colors">
        {node.name}
      </span>
    </div>
  );
};
