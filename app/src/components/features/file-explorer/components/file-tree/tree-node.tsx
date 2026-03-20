import React from 'react';

import type { FileTreeNode, StoredFile } from '@/services/indexeddb';
import { fileStorageDB } from '@/services/indexeddb';

import { TreeItem } from './tree-item';

interface TreeNodeProps {
  node: FileTreeNode;
  depth: number;
  selectedPath: string | null;
  expandedPaths: Set<string>;
  onFileClick: (file: StoredFile) => void;
  onDirectoryToggle: (path: string) => void;
  onContextMenu: (node: FileTreeNode, position: { x: number; y: number }) => void;
}

export const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  depth,
  selectedPath,
  expandedPaths,
  onFileClick,
  onDirectoryToggle,
  onContextMenu,
}) => {
  const isExpanded = expandedPaths.has(node.path);
  const isSelected = selectedPath === node.path;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu(node, { x: e.clientX, y: e.clientY });
  };

  if (node.type === 'file') {
    const handleFileClick = async () => {
      const file = await fileStorageDB.getFile(node.id);
      if (file) {
        onFileClick(file);
      }
    };

    return (
      <TreeItem
        type="file"
        node={node}
        depth={depth}
        isSelected={isSelected}
        onClick={handleFileClick}
        onContextMenu={handleContextMenu}
      />
    );
  }

  return (
    <>
      <TreeItem
        type="directory"
        node={node}
        depth={depth}
        isExpanded={isExpanded}
        onToggle={() => onDirectoryToggle(node.path)}
        onContextMenu={handleContextMenu}
      />
      {isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              expandedPaths={expandedPaths}
              onFileClick={onFileClick}
              onDirectoryToggle={onDirectoryToggle}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </>
  );
};
