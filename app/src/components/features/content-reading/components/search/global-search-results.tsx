import { FileText, Loader2, Search } from 'lucide-react';
import { memo, useCallback } from 'react';

import { useTabsActions } from '@/components/features/tabs/store';
import { cn } from '@/lib/utils';
import { apiFetchText } from '@/services/auth';
import { fileStorageDB } from '@/services/indexeddb';
import type { SearchResultEntry } from '@/services/search';

interface GlobalSearchResultsProps {
  query: string;
  results: SearchResultEntry[];
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const GlobalSearchResults: React.FC<GlobalSearchResultsProps> = memo(
  ({ query, results, isLoading, error, isAuthenticated }) => {
    const { createTab, setActiveTab, findTabByFileId, setShowEmptyState } = useTabsActions();

    const handleResultClick = useCallback(
      async (result: SearchResultEntry) => {
        const existingTab = findTabByFileId(result.file_id);
        if (existingTab) {
          setActiveTab(existingTab.id);
          setShowEmptyState(false);
          return;
        }

        const localFile = await fileStorageDB.getFileByPath(result.file_path);
        if (localFile) {
          createTab(localFile.content, localFile.name, 'file', localFile.id, localFile.path);
        } else {
          const content = await apiFetchText(`/files/${result.file_id}/content`);
          createTab(content, result.file_name, 'file', result.file_id, result.file_path);
        }
      },
      [createTab, setActiveTab, findTabByFileId, setShowEmptyState]
    );

    if (!isAuthenticated) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <Search className="h-5 w-5 text-muted-foreground/20" strokeWidth={1.5} />
          <p className="text-[11px] text-muted-foreground/40">Sign in to search across all files</p>
        </div>
      );
    }

    if (query.length < 2) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <Search className="h-5 w-5 text-muted-foreground/20" strokeWidth={1.5} />
          <p className="text-[11px] text-muted-foreground/40">Type to search across all files</p>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <Loader2 className="h-4 w-4 text-muted-foreground/40 animate-spin" />
          <p className="text-[11px] text-muted-foreground/40">Searching...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <p className="text-[11px] text-destructive/70">{error}</p>
        </div>
      );
    }

    if (results.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <p className="text-[11px] text-muted-foreground/50">
            No results for{' '}
            <span className="text-foreground/60 font-medium">&ldquo;{query}&rdquo;</span>
          </p>
        </div>
      );
    }

    return (
      <div className="p-1">
        {results.map((result) => (
          <button
            key={result.file_id}
            type="button"
            onClick={() => handleResultClick(result)}
            className={cn(
              'w-full text-left px-3 py-2.5 rounded-xl transition-colors duration-100',
              'focus:outline-none cursor-pointer hover:bg-accent/50'
            )}
          >
            {/* File info */}
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
              <span className="text-sm font-medium text-foreground truncate flex-1">
                {result.file_name}
              </span>
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground/40 truncate pl-5.5">
              {result.file_path}
            </p>

            {/* Headline snippet with <mark> highlights from server */}
            <p
              className="mt-1 text-xs leading-relaxed text-muted-foreground/80 wrap-break-word line-clamp-2 pl-5.5 [&_mark]:bg-primary/18 [&_mark]:text-foreground [&_mark]:font-medium [&_mark]:rounded-[3px] [&_mark]:px-0.5"
              dangerouslySetInnerHTML={{ __html: result.headline }}
            />
          </button>
        ))}
      </div>
    );
  }
);

GlobalSearchResults.displayName = 'GlobalSearchResults';
export default GlobalSearchResults;
