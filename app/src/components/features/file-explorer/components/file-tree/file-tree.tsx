import React from 'react';
import { TreeNode } from './tree-node';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { FileTreeNode, StoredFile } from '@/services/indexeddb';

interface FileTreeProps {
  nodes: FileTreeNode[];
  selectedPath: string | null;
  expandedPaths: Set<string>;
  onFileClick: (file: StoredFile) => void;
  onDirectoryToggle: (path: string) => void;
  onDelete: (node: FileTreeNode) => void;
}

export const FileTree: React.FC<FileTreeProps> = ({
  nodes,
  selectedPath,
  expandedPaths,
  onFileClick,
  onDirectoryToggle,
  onDelete,
}) => {
  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground px-4 py-8">
        <p className="text-center">No files yet. Upload markdown files or folders to get started.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="py-2">
        {nodes.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            depth={0}
            selectedPath={selectedPath}
            expandedPaths={expandedPaths}
            onFileClick={onFileClick}
            onDirectoryToggle={onDirectoryToggle}
            onDelete={onDelete}
          />
        ))}
      </div>
    </ScrollArea>
  );
};
