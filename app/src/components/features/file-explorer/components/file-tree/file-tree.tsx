import { FolderOpen } from 'lucide-react';
import React, { useCallback, useState } from 'react';

import type { FileTreeNode, StoredFile } from '@/services/indexeddb';

import { TreeContextMenu } from './tree-context-menu';
import { TreeNode } from './tree-node';

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
      <div className="flex flex-col items-center justify-center h-full gap-3 px-6 py-12 text-center">
        <div className="rounded-xl bg-muted/30 p-3">
          <FolderOpen className="h-5 w-5 text-muted-foreground/35" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground/55">No files yet</p>
          <p className="text-[11px] text-muted-foreground/40 leading-relaxed">
            Upload markdown files or drag & drop to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-auto">
        <div className="py-2 min-w-max">
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
      </div>
      <TreeContextMenu
        node={contextMenu.node}
        position={contextMenu.position}
        onClose={handleCloseContextMenu}
        onDelete={onDelete}
      />
    </>
  );
};
