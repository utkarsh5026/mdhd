import { FileText, FolderOpen, Upload } from 'lucide-react';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';

import {
  useFileStoreActions,
  useFileTree,
  useIsFileStoreInitialized,
} from '@/components/features/file-explorer';
import { cn } from '@/lib/utils';
import type { FileTreeNode } from '@/services/indexeddb';

interface WelcomeScreenProps {
  onStartReading: (content: string) => void;
  onFileNodeOpen: (node: FileTreeNode) => void;
}

function flattenFiles(nodes: FileTreeNode[]): FileTreeNode[] {
  const files: FileTreeNode[] = [];
  const visit = (node: FileTreeNode) => {
    if (node.type === 'file') files.push(node);
    node.children?.forEach(visit);
  };
  nodes.forEach(visit);
  return files;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = memo(({ onStartReading, onFileNodeOpen }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const fileTree = useFileTree();
  const isInitialized = useIsFileStoreInitialized();
  const { initialize } = useFileStoreActions();

  useEffect(() => {
    if (!isInitialized) initialize();
  }, [isInitialized, initialize]);

  useEffect(() => {
    if (showPasteArea) textareaRef.current?.focus();
  }, [showPasteArea]);

  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (showPasteArea) return;
      const pasted = e.clipboardData?.getData('text');
      if (pasted?.trim()) onStartReading(pasted);
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
      setShowPasteArea(false);
    }
  }, [text, onStartReading]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
      if (e.key === 'Escape') {
        setShowPasteArea(false);
        setText('');
      }
    },
    [handleSubmit]
  );

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const greeting = (() => {
    const h = now.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const timeString = now.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const dateString = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const storedFiles = flattenFiles(fileTree);

  return (
    <div
      className={cn(
        'h-full overflow-auto transition-colors duration-150',
        isDragging && 'bg-primary/5'
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div
        className={cn(
          'max-w-xl mx-auto px-6 py-16 space-y-10 transition-all duration-150',
          isDragging && 'opacity-50 scale-[0.99]'
        )}
      >
        {/* Header */}
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground/40 select-none">
            mdhd
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{greeting}</h1>
          <p className="text-sm tabular-nums text-muted-foreground/60">
            {timeString}
            <span className="ml-2 text-muted-foreground/40">{dateString}</span>
          </p>
        </div>

        {/* Drop overlay hint */}
        {isDragging && (
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="rounded-2xl border-2 border-dashed border-primary px-12 py-8 bg-background/80 backdrop-blur-sm">
              <p className="text-primary font-medium text-lg">Drop to open</p>
            </div>
          </div>
        )}

        {/* Start section */}
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
            Start
          </p>

          {!showPasteArea ? (
            <div className="grid grid-cols-2 gap-2.5">
              {[
                {
                  icon: Upload,
                  label: 'Open file',
                  description: 'Open a .md file',
                  onClick: () => fileInputRef.current?.click(),
                },
                {
                  icon: FileText,
                  label: 'Paste text',
                  description: 'Type or paste markdown',
                  onClick: () => setShowPasteArea(true),
                },
              ].map(({ icon: Icon, label, description, onClick }) => (
                <button
                  key={label}
                  onClick={onClick}
                  className={cn(
                    'group flex items-start gap-3 rounded-2xl border border-border/40 p-4 text-left',
                    'bg-card/40 hover:bg-card/80 hover:border-border/70',
                    'transition-all duration-150 cursor-pointer'
                  )}
                >
                  <div className="mt-0.5 rounded-2xl bg-muted/60 p-2 group-hover:bg-primary/10 transition-colors">
                    <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">{description}</p>
                  </div>
                </button>
              ))}
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
                <button
                  className="rounded-lg px-3 h-8 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => {
                    setShowPasteArea(false);
                    setText('');
                  }}
                >
                  Cancel
                </button>
                <button
                  disabled={!text.trim()}
                  onClick={handleSubmit}
                  className={cn(
                    'rounded-lg px-3 h-8 text-xs bg-primary text-primary-foreground',
                    'hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
                  )}
                >
                  Start reading
                </button>
              </div>
            </div>
          )}

          <p className="text-[11px] text-muted-foreground/35 pt-1">
            Or drag a <span className="font-mono">.md</span> file anywhere · Press{' '}
            <kbd className="font-mono">Ctrl+V</kbd> to paste instantly
          </p>
        </div>

        {/* Library section */}
        {isInitialized && storedFiles.length > 0 && (
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
              Library
            </p>
            <div className="space-y-0.5">
              {storedFiles.map((node) => (
                <button
                  key={node.id}
                  onClick={() => onFileNodeOpen(node)}
                  className={cn(
                    'w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left',
                    'hover:bg-muted/50 transition-colors duration-100 group'
                  )}
                >
                  <FolderOpen className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 group-hover:text-muted-foreground/70 transition-colors" />
                  <span className="text-sm text-foreground/80 truncate group-hover:text-foreground transition-colors">
                    {node.name}
                  </span>
                  <span className="ml-auto text-[11px] text-muted-foreground/30 shrink-0 truncate max-w-35">
                    {node.path.replace(/^\//, '').replace(`/${node.name}`, '') || '/'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown"
        multiple
        className="sr-only"
        onChange={handleFileSelect}
      />
    </div>
  );
});

WelcomeScreen.displayName = 'WelcomeScreen';
export default WelcomeScreen;
