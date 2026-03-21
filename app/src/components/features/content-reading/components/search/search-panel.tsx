import { Search } from 'lucide-react';
import { memo, useCallback, useEffect, useRef } from 'react';

import { useActiveTabSections } from '@/components/features/tabs/hooks/use-active-tab-sections';
import { useTabNavigation } from '@/components/features/tabs/hooks/use-tab-navigation';
import { cn } from '@/lib/utils';

import { useSearch } from '../../hooks/use-search';
import SearchResultItem from './search-result-item';

interface SearchPanelProps {
  className?: string;
}

const SearchPanel: React.FC<SearchPanelProps> = memo(({ className }) => {
  const { sections, tabId, hasActiveTab } = useActiveTabSections();
  const { changeSection } = useTabNavigation(tabId ?? '');
  const { query, setQuery, results, reset } = useSearch(sections);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset search when tab changes
  useEffect(() => {
    reset();
  }, [tabId, reset]);

  // Auto-focus input when panel mounts
  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  // Listen for external focus requests (e.g. Ctrl+F)
  useEffect(() => {
    const handleFocusSearch = () => {
      requestAnimationFrame(() => inputRef.current?.focus());
    };
    window.addEventListener('mdhd:focus-search', handleFocusSearch);
    return () => window.removeEventListener('mdhd:focus-search', handleFocusSearch);
  }, []);

  const handleSelect = useCallback(
    (sectionIndex: number) => {
      changeSection(sectionIndex);
    },
    [changeSection]
  );

  if (!hasActiveTab) {
    return (
      <div className={cn('flex flex-col flex-1 overflow-hidden', className)}>
        <div className="px-3 py-1.5 border-b border-border/30">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 select-none">
            Search
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-2 p-4">
          <Search className="w-4 h-4 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground/40 text-center">No document open</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col flex-1 overflow-hidden', className)}>
      {/* Header */}
      <div className="px-3 py-1.5 border-b border-border/30 flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 select-none">
          Search
        </span>
        {query.length >= 2 && results.length > 0 && (
          <span className="text-[10px] text-muted-foreground/30 tabular-nums">
            {results.length}
          </span>
        )}
      </div>

      {/* Search input */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30">
        <Search className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search in document…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="p-0.5 rounded hover:bg-accent text-muted-foreground/50 hover:text-foreground transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="10"
              height="10"
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
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {query.length < 2 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <Search className="h-5 w-5 text-muted-foreground/20" strokeWidth={1.5} />
            <p className="text-[11px] text-muted-foreground/40">Type to search in document</p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <p className="text-[11px] text-muted-foreground/50">
              No results for{' '}
              <span className="text-foreground/60 font-medium">&ldquo;{query}&rdquo;</span>
            </p>
          </div>
        ) : (
          <div className="p-1">
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
    </div>
  );
});

SearchPanel.displayName = 'SearchPanel';
export default SearchPanel;
