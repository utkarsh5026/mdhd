import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Clock, FileText, Search, Text } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useOpenFile } from '@/components/features/tabs/hooks/use-open-file';
import { Dialog, DialogOverlay, DialogPortal } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

import { type PaletteItem, usePaletteItems } from '../hooks/use-palette-items';

/** Renders a path with its fuzzy-matched characters emphasised. */
const HighlightedPath: React.FC<{ path: string; positions: number[] }> = ({ path, positions }) => {
  if (positions.length === 0) return <>{path}</>;

  const marked = new Set(positions);
  return (
    <>
      {Array.from(path, (char, index) =>
        marked.has(index) ? (
          <span key={index} className="text-primary font-medium">
            {char}
          </span>
        ) : (
          <span key={index}>{char}</span>
        )
      )}
    </>
  );
};

const PaletteRow: React.FC<{
  item: PaletteItem;
  isActive: boolean;
  onSelect: () => void;
  onHover: () => void;
}> = ({ item, isActive, onSelect, onHover }) => (
  <button
    type="button"
    role="option"
    aria-selected={isActive}
    data-active={isActive}
    onClick={onSelect}
    onMouseEnter={onHover}
    className={cn(
      'w-full text-left px-3 py-2 rounded-xl transition-colors duration-100',
      'focus:outline-none cursor-pointer',
      isActive ? 'bg-accent' : 'hover:bg-accent/50'
    )}
  >
    {item.kind === 'file' ? (
      <div className="flex items-center gap-2.5 min-w-0">
        {item.isRecent ? (
          <Clock className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
        ) : (
          <FileText className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
        )}
        <span className="text-sm text-foreground truncate shrink-0">{item.name}</span>
        <span className="text-[11px] text-muted-foreground/40 truncate min-w-0">
          <HighlightedPath path={item.path} positions={item.positions} />
        </span>
      </div>
    ) : (
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <Text className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
          <span className="text-sm text-foreground truncate flex-1">{item.hit.fileName}</span>
          {item.hit.matchCount !== undefined && item.hit.matchCount > 1 && (
            <span className="text-[10px] text-muted-foreground/40 tabular-nums shrink-0">
              {item.hit.matchCount}
            </span>
          )}
        </div>
        {item.hit.excerpt && (
          <p className="mt-0.5 pl-6 text-xs text-muted-foreground/70 truncate">
            {item.hit.excerpt.snippet.slice(0, item.hit.excerpt.matchStart)}
            <mark className="bg-primary/18 text-foreground rounded-[3px] px-0.5">
              {item.hit.excerpt.snippet.slice(
                item.hit.excerpt.matchStart,
                item.hit.excerpt.matchStart + item.hit.excerpt.matchLength
              )}
            </mark>
            {item.hit.excerpt.snippet.slice(
              item.hit.excerpt.matchStart + item.hit.excerpt.matchLength
            )}
          </p>
        )}
      </div>
    )}
  </button>
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/35 select-none">
    {children}
  </div>
);

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Quick-open across every stored document.
 *
 * Two kinds of result share one list: documents whose *path* fuzzy-matches the
 * query, then documents whose *body* contains it. Both are served from the
 * local index, so the palette works signed out and offline.
 *
 * Mounted lazily by `CommandPaletteHost`, which owns the Cmd/Ctrl+K shortcut.
 */
const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onOpenChange }) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const openFile = useOpenFile();

  const { items, contentStart, isLoadingContent } = usePaletteItems(query, open);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Keep the highlighted row in view as the cursor moves.
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({
      block: 'nearest',
    });
  }, [activeIndex]);

  const handleSelect = useCallback(
    (item: PaletteItem) => {
      onOpenChange(false);
      if (item.kind === 'file') openFile(item.fileId, item.name);
      else openFile(item.hit.fileId, item.hit.fileName);
    },
    [openFile, onOpenChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (items.length === 0) return;

      const step = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
      if (step !== 0) {
        e.preventDefault();
        setActiveIndex((current) => (current + step + items.length) % items.length);
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        const target = items[activeIndex];
        if (target) handleSelect(target);
      }
    },
    [items, activeIndex, handleSelect]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-background/70 backdrop-blur-sm" />

        <DialogPrimitive.Content
          aria-label="Command palette"
          className={cn(
            'fixed top-[12%] left-1/2 -translate-x-1/2 z-50',
            'w-[calc(100%-2rem)] max-w-xl',
            'bg-background border border-border/60 rounded-2xl',
            'shadow-[0_8px_40px_-8px_rgba(0,0,0,0.4)]',
            'animate-in fade-in slide-in-from-top-3 duration-200',
            'flex flex-col max-h-[70vh] overflow-hidden'
          )}
        >
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/50">
            <Search className="h-4 w-4 text-muted-foreground/70 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Go to file, or search across documents…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
            />
          </div>

          <div ref={listRef} role="listbox" className="flex-1 overflow-y-auto min-h-0 p-1.5">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <Search className="h-7 w-7 text-muted-foreground/25" strokeWidth={1.5} />
                <p className="text-sm text-muted-foreground/50">
                  {query.trim() ? `No matches for “${query.trim()}”` : 'No documents yet'}
                </p>
              </div>
            ) : (
              items.map((item, index) => (
                <div key={item.key}>
                  {index === 0 && contentStart > 0 && <SectionLabel>Files</SectionLabel>}
                  {index === contentStart && <SectionLabel>In documents</SectionLabel>}
                  <PaletteRow
                    item={item}
                    isActive={index === activeIndex}
                    onSelect={() => handleSelect(item)}
                    onHover={() => setActiveIndex(index)}
                  />
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2 border-t border-border/40 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground/40">
              {isLoadingContent ? 'Searching documents…' : 'Searches file names, prose and code'}
            </span>
            <div className="flex items-center gap-1">
              {['↑↓', '↵', 'esc'].map((key) => (
                <kbd
                  key={key}
                  className="text-[10px] px-1.5 py-0.5 rounded border border-border/50 bg-muted/50 text-muted-foreground/50 font-mono"
                >
                  {key}
                </kbd>
              ))}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

export default CommandPalette;
