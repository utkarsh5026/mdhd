import { ChevronRight, FileText, Folder, FolderOpen } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';
import type { FileTreeNode } from '@/services/indexeddb';

type TreeItemProps =
  | {
      type: 'file';
      node: FileTreeNode;
      depth: number;
      isSelected: boolean;
      onClick: () => void;
      onContextMenu: (e: React.MouseEvent) => void;
    }
  | {
      type: 'directory';
      node: FileTreeNode;
      depth: number;
      isExpanded: boolean;
      onToggle: () => void;
      onContextMenu: (e: React.MouseEvent) => void;
    };

export const TreeItem: React.FC<TreeItemProps> = (props) => {
  const { type, node, depth, onContextMenu } = props;
  const isFile = type === 'file';
  const onClick = isFile ? props.onClick : props.onToggle;

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'group flex items-center gap-1.5 px-2 py-0.5 cursor-pointer rounded-md transition-all duration-150',
        'hover:bg-accent/40',
        isFile && props.isSelected && 'bg-primary/10 text-primary'
      )}
      style={{ paddingLeft: `${depth * 14 + 10}px` }}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      onContextMenu={onContextMenu}
    >
      {isFile ? (
        <FileText
          className={cn(
            'h-3.5 w-3.5 shrink-0 transition-colors',
            props.isSelected
              ? 'text-primary/70'
              : 'text-muted-foreground/60 group-hover:text-muted-foreground'
          )}
        />
      ) : (
        <>
          <ChevronRight
            className={cn(
              'h-3 w-3 text-muted-foreground/50 shrink-0 transition-transform duration-200',
              props.isExpanded && 'rotate-90',
              !(node.children && node.children.length > 0) && 'opacity-0'
            )}
          />
          {props.isExpanded ? (
            <FolderOpen className="h-3.5 w-3.5 text-amber-500/70 shrink-0" />
          ) : (
            <Folder className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-amber-500/60 shrink-0 transition-colors" />
          )}
        </>
      )}
      <span
        className={cn(
          'text-xs truncate flex-1 transition-colors',
          isFile
            ? props.isSelected
              ? 'text-primary font-medium'
              : 'text-muted-foreground group-hover:text-foreground/80'
            : 'text-foreground/70 group-hover:text-foreground/90 font-medium'
        )}
      >
        {node.name}
      </span>
    </div>
  );
};
