import * as DialogPrimitive from '@radix-ui/react-dialog';
import { SearchIcon } from 'lucide-react';
import { memo, useCallback, useEffect, useRef } from 'react';

import { Dialog, DialogOverlay, DialogPortal } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { MarkdownSection } from '@/services/section/parsing';

import { useSearch } from '../../hooks/use-search';
import SearchResultItem from './search-result-item';

export interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: MarkdownSection[];
  onSelectSection: (index: number) => void;
}

const SearchDialog: React.FC<SearchDialogProps> = memo(
  ({ open, onOpenChange, sections, onSelectSection }) => {
    const { query, setQuery, results, reset } = useSearch(sections);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (open) {
        reset();
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    }, [open, reset]);

    const handleSelect = useCallback(
      (sectionIndex: number) => {
        onSelectSection(sectionIndex);
        onOpenChange(false);
      },
      [onSelectSection, onOpenChange]
    );

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogPortal>
          <DialogOverlay className="bg-background/70 backdrop-blur-sm" />

          <DialogPrimitive.Content
            className={cn(
              'fixed top-[12%] left-1/2 -translate-x-1/2 z-50',
              'w-[calc(100%-2rem)] max-w-lg',
              'bg-background border border-border/60 rounded-2xl',
              'shadow-[0_8px_40px_-8px_rgba(0,0,0,0.4)]',
              'animate-in fade-in slide-in-from-top-3 duration-200',
              'flex flex-col max-h-[65vh] overflow-hidden'
            )}
          >
            {/* Input row */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/50">
              <SearchIcon className="h-4 w-4 text-muted-foreground/70 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search in document…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
              />
              {query && (
                <div className="flex items-center gap-2">
                  {results.length > 0 && (
                    <span className="text-[11px] text-muted-foreground/60 tabular-nums">
                      {results.length}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="p-1 rounded-md hover:bg-accent text-muted-foreground/60 hover:text-foreground transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Results */}
            <div role="listbox" className="flex-1 overflow-y-auto min-h-0">
              {query.length < 2 ? (
                <div className="flex flex-col items-center justify-center gap-2.5 py-12 text-center">
                  <SearchIcon className="h-7 w-7 text-muted-foreground/25" strokeWidth={1.5} />
                  <p className="text-sm text-muted-foreground/50">Type to search in document</p>
                </div>
              ) : results.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <p className="text-sm text-muted-foreground/60">
                    No results for{' '}
                    <span className="text-foreground/70 font-medium">&ldquo;{query}&rdquo;</span>
                  </p>
                </div>
              ) : (
                <div className="p-1.5">
                  {results.map((result) => (
                    <SearchResultItem
                      key={`${result.sectionIndex}-${result.matchType}`}
                      result={result}
                      isSelected={false}
                      onClick={() => handleSelect(result.sectionIndex)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-border/40 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground/40">
                {query.length >= 2 && results.length > 0
                  ? `${results.length} result${results.length !== 1 ? 's' : ''}`
                  : 'Search sections by title or content'}
              </span>
              <kbd className="text-[10px] px-1.5 py-0.5 rounded border border-border/50 bg-muted/50 text-muted-foreground/50 font-mono">
                esc
              </kbd>
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    );
  }
);

SearchDialog.displayName = 'SearchDialog';

export default SearchDialog;
