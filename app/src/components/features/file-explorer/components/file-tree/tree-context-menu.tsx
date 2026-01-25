import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Trash2 } from 'lucide-react';
import type { FileTreeNode } from '@/services/indexeddb';

interface TreeContextMenuProps {
  node: FileTreeNode | null;
  position: { x: number; y: number };
  onClose: () => void;
  onDelete: (node: FileTreeNode) => void;
}

export const TreeContextMenu: React.FC<TreeContextMenuProps> = ({
  node,
  position,
  onClose,
  onDelete,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  const handleDelete = useCallback(() => {
    if (node) {
      onDelete(node);
      onClose();
    }
  }, [node, onDelete, onClose]);

  useEffect(() => {
    if (!node) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [node, onClose]);

  // Adjust position to prevent overflow
  useEffect(() => {
    if (!node || !menuRef.current) return;

    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedX = position.x;
    let adjustedY = position.y;

    if (position.x + rect.width > viewportWidth) {
      adjustedX = viewportWidth - rect.width - 8;
    }

    if (position.y + rect.height > viewportHeight) {
      adjustedY = viewportHeight - rect.height - 8;
    }

    menu.style.left = `${adjustedX}px`;
    menu.style.top = `${adjustedY}px`;
  }, [node, position]);

  if (!node) return null;

  const isDirectory = node.type === 'directory';

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-50 min-w-40 rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
      style={{ left: position.x, top: position.y }}
    >
      <button
        className="relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none hover:bg-accent hover:text-destructive transition-colors font-cascadia-code"
        onClick={handleDelete}
      >
        <Trash2 className="h-4 w-4" />
        {isDirectory ? 'Delete folder' : 'Delete'}
      </button>
    </div>,
    document.body
  );
};
