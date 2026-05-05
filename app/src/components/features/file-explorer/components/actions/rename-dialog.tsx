import React, { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { FileTreeNode } from '@/services/indexeddb';

import { validateFileName } from '../../utils/filename';

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: FileTreeNode | null;
  onConfirm: (newName: string) => Promise<void> | void;
  isRenaming?: boolean;
  error?: string | null;
}

function splitFileName(name: string): { base: string; ext: string } {
  const dot = name.lastIndexOf('.');
  // Treat ".env" and "file." as having no editable extension.
  if (dot <= 0 || dot === name.length - 1) return { base: name, ext: '' };
  return { base: name.slice(0, dot), ext: name.slice(dot) };
}

export const RenameDialog: React.FC<RenameDialogProps> = ({
  open,
  onOpenChange,
  node,
  onConfirm,
  isRenaming = false,
  error,
}) => {
  const [baseValue, setBaseValue] = useState('');
  const [extValue, setExtValue] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && node) {
      if (node.type === 'file') {
        const parts = splitFileName(node.name);
        setBaseValue(parts.base);
        setExtValue(parts.ext);
      } else {
        setBaseValue(node.name);
        setExtValue('');
      }
      setLocalError(null);
      requestAnimationFrame(() => {
        const input = inputRef.current;
        if (!input) return;
        input.focus();
        input.select();
      });
    }
  }, [open, node]);

  if (!node) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedBase = baseValue.trim();
    const validationMsg = validateFileName(trimmedBase, {
      fixedExtension: node.type === 'file' ? extValue : undefined,
    });
    if (validationMsg) return setLocalError(validationMsg);

    const nextName = `${trimmedBase}${extValue}`;
    if (nextName === node.name) {
      onOpenChange(false);
      return;
    }
    await onConfirm(nextName);
  };

  const displayError = localError ?? error ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename {node.type === 'directory' ? 'folder' : 'file'}</DialogTitle>
            <DialogDescription>
              Enter a new name for <strong>{node.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 space-y-2">
            <div className="flex items-stretch gap-2">
              <Input
                ref={inputRef}
                value={baseValue}
                onChange={(e) => {
                  setBaseValue(e.target.value);
                  if (localError) setLocalError(null);
                }}
                disabled={isRenaming}
                autoComplete="off"
                spellCheck={false}
              />
              {node.type === 'file' && extValue ? (
                <div className="inline-flex items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">
                  {extValue}
                </div>
              ) : null}
            </div>
            {displayError && <p className="text-xs text-destructive">{displayError}</p>}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isRenaming}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isRenaming || !baseValue.trim()}>
              {isRenaming ? 'Renaming...' : 'Rename'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
