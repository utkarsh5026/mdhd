import { Share2, Trash2, Unlink } from 'lucide-react';
import React, { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { useKeyPress } from '@/hooks';
import { useIsAuthenticated } from '@/services/auth';
import type { FileTreeNode } from '@/services/indexeddb';

interface TreeContextMenuProps {
  node: FileTreeNode | null;
  position: { x: number; y: number };
  onClose: () => void;
  onDelete: (node: FileTreeNode) => void;
  onShare: (node: FileTreeNode) => void;
  onRevoke: (node: FileTreeNode) => void;
  /** Share token for the current node, if one has been generated this session. */
  shareToken: string | null;
}

export const TreeContextMenu: React.FC<TreeContextMenuProps> = ({
  node,
  position,
  onClose,
  onDelete,
  onShare,
  onRevoke,
  shareToken,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const isAuthenticated = useIsAuthenticated();

  const handleDelete = useCallback(() => {
    if (node) {
      onDelete(node);
      onClose();
    }
  }, [node, onDelete, onClose]);

  const handleShare = useCallback(() => {
    if (node) {
      onShare(node);
      onClose();
    }
  }, [node, onShare, onClose]);

  const handleRevoke = useCallback(() => {
    if (node) {
      onRevoke(node);
      onClose();
    }
  }, [node, onRevoke, onClose]);

  useKeyPress('Escape', () => {
    if (node) onClose();
  });

  useEffect(() => {
    if (!node) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [node, onClose]);

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
  const canShare = isAuthenticated && !isDirectory;

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      className="fixed z-50 min-w-40 rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
      style={{ left: position.x, top: position.y }}
    >
      {canShare && (
        <>
          {shareToken ? (
            <button
              role="menuitem"
              className="relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent transition-colors"
              onClick={handleRevoke}
            >
              <Unlink className="h-4 w-4" />
              Revoke link
            </button>
          ) : (
            <button
              role="menuitem"
              className="relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent transition-colors"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          )}
        </>
      )}
      <button
        role="menuitem"
        autoFocus
        className="relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none hover:bg-accent hover:text-destructive transition-colors"
        onClick={handleDelete}
      >
        <Trash2 className="h-4 w-4" />
        {isDirectory ? 'Delete folder' : 'Delete'}
      </button>
    </div>,
    document.body
  );
};
