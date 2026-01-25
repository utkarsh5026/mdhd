import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { attemptAsync } from '@/utils/functions/error';

interface SaveFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultFileName: string;
  onSave: (fileName: string) => Promise<void>;
  isSaving?: boolean;
}

// Strip .md extension from filename if present
const stripMdExtension = (name: string): string => {
  return name.replace(/\.md$/i, '');
};

function validateFileName(name: string): string | null {
  if (!name.trim()) {
    return 'File name is required';
  }

  const invalidCharsRegex = /[.<>:"/\\|?*]/;
  if (invalidCharsRegex.test(name)) {
    return 'File name cannot contain . < > : " / \\ | ? *';
  }
  return null;
}

export const SaveFileDialog: React.FC<SaveFileDialogProps> = ({
  open,
  onOpenChange,
  defaultFileName,
  onSave,
  isSaving = false,
}) => {
  const [fileName, setFileName] = useState(stripMdExtension(defaultFileName));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFileName(stripMdExtension(defaultFileName));
      setError(null);
    }
  }, [open, defaultFileName]);


  const handleFileNameChange = (value: string) => {
    setFileName(value);
    setError(null);
  };

  const handleSave = useCallback(async () => {
    const validationError = validateFileName(fileName);
    if (validationError) {
      setError(validationError);
      return;
    }
    const finalName = `${fileName.trim()}.md`;
    const [error] = await attemptAsync(async () => {
      await onSave(finalName);
      onOpenChange(false);
    })

    if (error) {
      setError(error instanceof Error ? error.message : 'Failed to save file');
    }

  }, [fileName, onSave, onOpenChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !isSaving) {
        e.preventDefault();
        handleSave();
      }
    },
    [handleSave, isSaving]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="font-cascadia-code max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Save File</DialogTitle>
          <DialogDescription>
            Enter a name for your markdown file. It will be saved to your file explorer.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center gap-1">
            <Input
              value={fileName}
              onChange={(e) => handleFileNameChange(e.target.value)}
              placeholder="filename"
              onKeyDown={handleKeyDown}
              autoFocus
              disabled={isSaving}
              className="flex-1"
            />
            <span className="text-muted-foreground text-sm font-medium">.md</span>
          </div>
          {error && <p className="text-destructive text-sm mt-2">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
