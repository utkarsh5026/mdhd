import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { FileTreeNode } from '@/services/indexeddb';

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: FileTreeNode | null;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export const DeleteDialog: React.FC<DeleteDialogProps> = ({
  open,
  onOpenChange,
  node,
  onConfirm,
  isDeleting = false,
}) => {
  if (!node) return null;

  const isDirectory = node.type === 'directory';
  const childCount = node.children?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='font-cascadia-code max-w-md rounded-2xl'>
        <DialogHeader>
          <DialogTitle>Delete {isDirectory ? 'folder' : 'file'}?</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{node.name}</strong>?
            {isDirectory && childCount > 0 && (
              <span className="block mt-2 text-destructive">
                This will also delete {childCount} item{childCount > 1 ? 's' : ''} inside this
                folder.
              </span>
            )}
            <span className="block mt-2">This action cannot be undone.</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
