import React from 'react';
import { ChevronRight, Folder, FolderOpen, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { FileTreeNode } from '@/services/indexeddb';

interface DirectoryItemProps {
  node: FileTreeNode;
  depth: number;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

export const DirectoryItem: React.FC<DirectoryItemProps> = ({
  node,
  depth,
  isExpanded,
  onToggle,
  onDelete,
}) => {
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  const hasChildren = node.children && node.children.length > 0;

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-accent/50 rounded-sm group transition-colors'
      )}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
      onClick={onToggle}
      onContextMenu={handleContextMenu}
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
      <span className="text-sm truncate flex-1 font-medium">{node.name}</span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleDeleteClick} className="text-destructive">
            Delete folder
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
