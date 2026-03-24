import { FileText, Upload } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useToggle } from '@/hooks';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  onStartReading: (content: string) => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onStartReading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const { state: showPasteArea, setTrue: openPasteArea, setFalse: closePasteArea } = useToggle();
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  useEffect(() => {
    if (showPasteArea) {
      textareaRef.current?.focus();
    }
  }, [showPasteArea]);

  // Global paste → instantly start reading
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (showPasteArea) return;
      const pasted = e.clipboardData?.getData('text');
      if (pasted?.trim()) {
        onStartReading(pasted);
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [showPasteArea, onStartReading]);

  const readAndStart = useCallback(
    async (files: File[]) => {
      const mdFile = files.find((f) => f.name.endsWith('.md') || f.name.endsWith('.markdown'));
      if (!mdFile) return;
      const content = await mdFile.text();
      if (content.trim()) onStartReading(content);
    },
    [onStartReading]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current++;
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsDragging(false);
      readAndStart(Array.from(e.dataTransfer.files));
    },
    [readAndStart]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length > 0) {
        readAndStart(files);
        e.target.value = '';
      }
    },
    [readAndStart]
  );

  const handleSubmit = useCallback(() => {
    if (text.trim()) {
      onStartReading(text);
      setText('');
      closePasteArea();
    }
  }, [text, onStartReading, closePasteArea]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        handleSubmit();
      }
      if (e.key === 'Escape') {
        closePasteArea();
        setText('');
      }
    },
    [handleSubmit, closePasteArea]
  );

  return (
    <div
      className={cn(
        'h-full flex items-center justify-center transition-colors duration-150',
        isDragging && 'bg-primary/5'
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div
        className={cn(
          'w-full max-w-md mx-auto px-6 space-y-5 transition-all duration-150',
          isDragging && 'scale-[0.98] opacity-60'
        )}
      >
        {/* App name */}
        <p className="text-center text-xs font-semibold tracking-widest uppercase text-muted-foreground/40 select-none">
          mdhd
        </p>

        {/* Drop zone */}
        <div
          className={cn(
            'rounded-2xl border-2 border-dashed p-10 text-center transition-colors duration-150',
            isDragging
              ? 'border-primary/60 bg-primary/5'
              : 'border-border/30 hover:border-border/50'
          )}
        >
          {isDragging ? (
            <p className="text-primary text-sm font-medium">Drop to open</p>
          ) : (
            <div className="space-y-1">
              <p className="text-muted-foreground/70 text-sm">
                Drop a <span className="font-mono text-xs">.md</span> file here
              </p>
              <p className="text-muted-foreground/40 text-xs">
                or press <kbd className="font-mono">Ctrl+V</kbd> to paste anywhere
              </p>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border/20" />
          <span className="text-[11px] text-muted-foreground/30">or</span>
          <div className="h-px flex-1 bg-border/20" />
        </div>

        {/* Actions */}
        {!showPasteArea ? (
          <div className="flex gap-2.5">
            <Button
              variant="outline"
              className="flex-1 gap-2 rounded h-10 text-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-3.5 h-3.5" />
              Open file
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2 rounded h-10 text-sm"
              onClick={() => openPasteArea()}
            >
              <FileText className="w-3.5 h-3.5" />
              Type / paste
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste or type markdown here..."
              className={cn(
                'w-full h-44 p-4 rounded-xl border border-border/40 resize-none',
                'bg-card/50 text-sm leading-relaxed placeholder:text-muted-foreground/40',
                'focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40',
                'transition-all duration-150'
              )}
            />
            <div className="flex gap-2 justify-end items-center">
              <span className="text-[11px] text-muted-foreground/30 mr-auto">⌘↵ to start</span>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg h-8 text-xs text-muted-foreground"
                onClick={() => {
                  closePasteArea();
                  setText('');
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="rounded-lg h-8 text-xs gap-1.5"
                disabled={!text.trim()}
                onClick={handleSubmit}
              >
                Start reading
              </Button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.markdown"
          multiple
          className="sr-only"
          onChange={handleFileSelect}
        />
      </div>
    </div>
  );
};

EmptyState.displayName = 'EmptyState';
export default EmptyState;
