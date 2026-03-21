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
  const isSelected = isFile && props.isSelected;
  const onClick = isFile ? props.onClick : props.onToggle;

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'group relative flex items-center gap-1.5 py-[3px] pr-3 cursor-pointer rounded-sm transition-colors duration-100',
        isSelected ? 'bg-accent/70' : 'hover:bg-accent/40'
      )}
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      onContextMenu={onContextMenu}
    >
      {isSelected && (
        <div className="absolute left-0 inset-y-[3px] w-0.5 bg-primary rounded-r-full" />
      )}

      {isFile ? (
        <FileText
          className={cn(
            'h-3.5 w-3.5 shrink-0 transition-colors',
            isSelected
              ? 'text-primary/70'
              : 'text-muted-foreground/45 group-hover:text-muted-foreground/70'
          )}
        />
      ) : (
        <>
          <ChevronRight
            className={cn(
              'h-3 w-3 shrink-0 transition-transform duration-150 text-muted-foreground/35',
              props.isExpanded && 'rotate-90',
              !(node.children && node.children.length > 0) && 'invisible'
            )}
          />
          {props.isExpanded ? (
            <FolderOpen className="h-3.5 w-3.5 text-amber-400/75 shrink-0" />
          ) : (
            <Folder className="h-3.5 w-3.5 text-muted-foreground/45 group-hover:text-amber-400/65 shrink-0 transition-colors" />
          )}
        </>
      )}

      <span
        className={cn(
          'text-xs whitespace-nowrap transition-colors',
          isFile
            ? isSelected
              ? 'text-foreground font-medium'
              : 'text-muted-foreground/75 group-hover:text-foreground/85'
            : 'text-foreground/75 group-hover:text-foreground/95 font-medium'
        )}
      >
        {node.name}
      </span>
    </div>
  );
};
