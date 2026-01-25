import React from 'react';
import { FileItem } from './file-item';
import { DirectoryItem } from './directory-item';
import type { FileTreeNode, StoredFile } from '@/services/indexeddb';

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
    return (
      <FileItem
        node={node}
        depth={depth}
        isSelected={isSelected}
        onClick={() =>
          onFileClick({
            id: node.id,
            name: node.name,
            path: node.path,
            parentPath: node.path.substring(0, node.path.lastIndexOf('/')),
            content: node.content || '',
            size: node.size || 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })
        }
        onContextMenu={handleContextMenu}
      />
    );
  }

  return (
    <>
      <DirectoryItem
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
