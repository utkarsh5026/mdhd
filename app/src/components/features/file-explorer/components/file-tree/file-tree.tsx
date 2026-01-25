import React, { useState, useCallback } from 'react';
import { TreeNode } from './tree-node';
import { TreeContextMenu } from './tree-context-menu';
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

interface ContextMenuState {
  node: FileTreeNode | null;
  position: { x: number; y: number };
}

export const FileTree: React.FC<FileTreeProps> = ({
  nodes,
  selectedPath,
  expandedPaths,
  onFileClick,
  onDirectoryToggle,
  onDelete,
}) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    node: null,
    position: { x: 0, y: 0 },
  });

  const handleContextMenu = useCallback(
    (node: FileTreeNode, position: { x: number; y: number }) => {
      setContextMenu({ node, position });
    },
    []
  );

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu({ node: null, position: { x: 0, y: 0 } });
  }, []);

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground px-4 py-8">
        <p className="text-center">
          No files yet. Upload markdown files or folders to get started.
        </p>
      </div>
    );
  }

  return (
    <>
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
              onContextMenu={handleContextMenu}
            />
          ))}
        </div>
      </ScrollArea>
      <TreeContextMenu
        node={contextMenu.node}
        position={contextMenu.position}
        onClose={handleCloseContextMenu}
        onDelete={onDelete}
      />
    </>
  );
};
