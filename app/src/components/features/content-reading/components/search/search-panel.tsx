import { Search } from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { useReadingActionsById } from '@/components/features/content-reading/hooks/use-reading-selectors';
import { useActiveTabSections } from '@/components/features/tabs/hooks/use-active-tab-sections';
import { cn } from '@/lib/utils';
import { useIsAuthenticated } from '@/services/auth';

import { useGlobalSearch } from '../../hooks/use-global-search';
import { useSearch } from '../../hooks/use-search';
import GlobalSearchResults from './global-search-results';
import SearchResultItem from './search-result-item';

type SearchMode = 'document' | 'all-files';

interface SearchPanelProps {
  className?: string;
}

const SearchPanel: React.FC<SearchPanelProps> = memo(({ className }) => {
  const { sections, tabId, hasActiveTab } = useActiveTabSections();
  const { changeSection } = useReadingActionsById(tabId ?? '');
  const docSearch = useSearch(sections);
  const globalSearch = useGlobalSearch();
  const isAuthenticated = useIsAuthenticated();
  const inputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<SearchMode>(hasActiveTab ? 'document' : 'all-files');

  const query = mode === 'document' ? docSearch.query : globalSearch.query;
  const setQuery = mode === 'document' ? docSearch.setQuery : globalSearch.setQuery;

  // Reset searches when tab changes. `reset` is referentially stable, so this
  // fires on tab switches only — depending on `docSearch` would re-run it on
  // every render and wipe the query as the user types.
  const { reset: resetDocSearch } = docSearch;
  useEffect(() => {
    resetDocSearch();
  }, [tabId, resetDocSearch]);

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

  // Document mode only — global results are a separate, server-backed list.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (mode !== 'document' || docSearch.results.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        docSearch.moveActive(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        docSearch.moveActive(-1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const target = docSearch.results[docSearch.activeIndex];
        if (target) handleSelect(target.sectionIndex);
      }
    },
    [mode, docSearch, handleSelect]
  );

  const handleModeChange = useCallback(
    (newMode: SearchMode) => {
      if (newMode === mode) return;
      // Reset the search we're leaving
      if (mode === 'document') docSearch.reset();
      else globalSearch.reset();
      setMode(newMode);
      requestAnimationFrame(() => inputRef.current?.focus());
    },
    [mode, docSearch, globalSearch]
  );

  const resultCount =
    mode === 'document'
      ? docSearch.query.length >= 2
        ? docSearch.totalMatches
        : null
      : globalSearch.query.length >= 2 && !globalSearch.isLoading
        ? globalSearch.results.length
        : null;

  return (
    <div className={cn('flex flex-col flex-1 overflow-hidden', className)}>
      {/* Header */}
      <div className="px-3 py-1.5 border-b border-border/30 flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 select-none">
          Search
        </span>
        {resultCount !== null && resultCount > 0 && (
          <span className="text-[10px] text-muted-foreground/30 tabular-nums">{resultCount}</span>
        )}
      </div>

      {/* Mode toggle */}
      {isAuthenticated && (
        <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border/30">
          <button
            type="button"
            onClick={() => handleModeChange('document')}
            className={cn(
              'text-[11px] px-2 py-0.5 rounded-md transition-colors',
              mode === 'document'
                ? 'bg-accent text-foreground font-medium'
                : 'text-muted-foreground/60 hover:text-muted-foreground'
            )}
          >
            Document
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('all-files')}
            className={cn(
              'text-[11px] px-2 py-0.5 rounded-md transition-colors',
              mode === 'all-files'
                ? 'bg-accent text-foreground font-medium'
                : 'text-muted-foreground/60 hover:text-muted-foreground'
            )}
          >
            All Files
          </button>
        </div>
      )}

      {/* Search input */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30">
        <Search className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder={
            mode === 'document' ? 'Search in document\u2026' : 'Search across all files\u2026'
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
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
        {mode === 'all-files' ? (
          <GlobalSearchResults
            query={globalSearch.query}
            results={globalSearch.results}
            isLoading={globalSearch.isLoading}
            error={globalSearch.error}
            isAuthenticated={isAuthenticated}
          />
        ) : !hasActiveTab ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <Search className="w-4 h-4 text-muted-foreground/20" />
            <p className="text-[11px] text-muted-foreground/40">No document open</p>
          </div>
        ) : docSearch.query.length < 2 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <Search className="h-5 w-5 text-muted-foreground/20" strokeWidth={1.5} />
            <p className="text-[11px] text-muted-foreground/40">Type to search in document</p>
          </div>
        ) : docSearch.results.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <p className="text-[11px] text-muted-foreground/50">
              No results for{' '}
              <span className="text-foreground/60 font-medium">
                &ldquo;{docSearch.query}&rdquo;
              </span>
            </p>
          </div>
        ) : (
          <div className="p-1">
            {docSearch.results.map((result, index) => (
              <SearchResultItem
                key={result.id}
                result={result}
                isSelected={index === docSearch.activeIndex}
                onMouseEnter={() => docSearch.setActiveIndex(index)}
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
