import { memo } from 'react';

import { cn } from '@/lib/utils';

import type { SearchResult } from '../../hooks/use-search';

export interface SearchResultItemProps {
  result: SearchResult;
  isSelected: boolean;
  onClick: () => void;
}

const LEVEL_LABEL: Record<number, string> = {
  1: 'H1',
  2: 'H2',
  3: 'H3',
  4: 'H4',
  5: 'H5',
  6: 'H6',
};

const SearchResultItem: React.FC<SearchResultItemProps> = memo(
  ({ result, isSelected, onClick }) => {
    const { snippet, matchStart, matchLength, sectionTitle, matchType, sectionLevel } = result;

    const before = snippet.slice(0, matchStart);
    const match = snippet.slice(matchStart, matchStart + matchLength);
    const after = snippet.slice(matchStart + matchLength);

    return (
      <button
        type="button"
        role="option"
        aria-selected={isSelected}
        onClick={onClick}
        className={cn(
          'w-full text-left px-3 py-2.5 rounded-xl transition-colors duration-100',
          'focus:outline-none cursor-pointer',
          isSelected ? 'bg-accent' : 'hover:bg-accent/50'
        )}
      >
        {/* Title row */}
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              'text-[9px] font-bold tracking-wide shrink-0 px-1 py-px rounded',
              sectionLevel === 1
                ? 'text-foreground/80 bg-foreground/10'
                : sectionLevel === 2
                  ? 'text-foreground/60 bg-foreground/8'
                  : 'text-foreground/40 bg-foreground/5'
            )}
          >
            {LEVEL_LABEL[sectionLevel] ?? `H${sectionLevel}`}
          </span>
          <span className="text-sm font-medium text-foreground truncate flex-1">
            {sectionTitle}
          </span>
          {matchType === 'title' && (
            <span className="text-[10px] px-1.5 py-px rounded-full shrink-0 font-medium bg-primary/12 text-primary/80">
              title
            </span>
          )}
        </div>

        {/* Snippet (content matches only) */}
        {matchType === 'content' && (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground/80 break-words line-clamp-2">
            {before}
            <mark className="bg-primary/18 text-foreground font-medium not-italic rounded-[3px] px-0.5">
              {match}
            </mark>
            {after}
          </p>
        )}
      </button>
    );
  }
);

SearchResultItem.displayName = 'SearchResultItem';

export default SearchResultItem;
