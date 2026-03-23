import { Check, X } from 'lucide-react';
import React, { memo, useCallback, useRef, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { MarkdownSection } from '@/services/section/parsing';

import MarkdownCodeMirrorEditor from './markdown-codemirror-editor';

interface SectionEditorOverlayProps {
  section: MarkdownSection;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (newContent: string) => void;
}

const SectionEditorOverlay: React.FC<SectionEditorOverlayProps> = memo(
  ({ section, open, onOpenChange, onSave }) => {
    const [editedContent, setEditedContent] = useState(section.content);
    const contentRef = useRef(editedContent);
    contentRef.current = editedContent;

    const handleSave = useCallback(() => {
      onSave(contentRef.current);
      onOpenChange(false);
    }, [onSave, onOpenChange]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          e.preventDefault();
          handleSave();
        }
      },
      [handleSave]
    );

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-4xl rounded-2xl h-[70vh] flex flex-col p-0 gap-0"
          onKeyDown={handleKeyDown}
        >
          <DialogHeader className="px-4 py-3 border-b border-border/30 shrink-0">
            <div className="flex items-center justify-between pr-10">
              <div className="min-w-0">
                <DialogTitle className="truncate text-sm">{section.title}</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground/70">
                  Edit section &middot; Ctrl+S to save
                </DialogDescription>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Check className="size-3.5" />
                  Save
                </button>
                <button
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                >
                  <X className="size-3.5" />
                  Cancel
                </button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <MarkdownCodeMirrorEditor content={section.content} onChange={setEditedContent} />
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

SectionEditorOverlay.displayName = 'SectionEditorOverlay';

export default SectionEditorOverlay;
