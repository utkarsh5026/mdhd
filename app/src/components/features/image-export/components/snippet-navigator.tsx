import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import {
  ListPopover,
  ListPopoverContent,
  ListPopoverGroup,
  ListPopoverGroupLabel,
  ListPopoverItem,
  ListPopoverTrigger,
} from '@/components/ui/list-popover';
import { cn } from '@/lib/utils';
import type { BaseSnippet } from '@/services/markdown/snippets';

export interface SnippetNavigatorProps {
  snippets: BaseSnippet[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  renderLabel: (snippet: BaseSnippet, index: number) => React.ReactNode;
}

const SnippetNavigator: React.FC<SnippetNavigatorProps> = ({
  snippets,
  currentIndex,
  onIndexChange,
  renderLabel,
}) => {
  const sectionGroups = useMemo(() => {
    const result: {
      sectionTitle: string;
      items: { snippet: BaseSnippet; globalIndex: number }[];
    }[] = [];
    for (let i = 0; i < snippets.length; i++) {
      const snippet = snippets[i];
      const last = result[result.length - 1];
      if (last && last.sectionTitle === snippet.sectionTitle) {
        last.items.push({ snippet, globalIndex: i });
      } else {
        result.push({
          sectionTitle: snippet.sectionTitle,
          items: [{ snippet, globalIndex: i }],
        });
      }
    }
    return result;
  }, [snippets]);

  if (snippets.length <= 1) return null;

  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-muted/30">
      <Button
        variant="ghost"
        size="icon"
        className="w-7 h-7 cursor-pointer rounded-md hover:bg-muted"
        onClick={() => onIndexChange(currentIndex - 1)}
        disabled={currentIndex <= 0}
        title="Previous snippet"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </Button>

      <ListPopover>
        <ListPopoverTrigger asChild>
          <button
            className={cn(
              'px-2 py-0.5 text-[11px] font-medium tabular-nums rounded-md',
              'text-muted-foreground hover:text-foreground hover:bg-muted',
              'transition-colors cursor-pointer'
            )}
            title="Browse snippets"
          >
            {currentIndex + 1} / {snippets.length}
          </button>
        </ListPopoverTrigger>
        <ListPopoverContent sideOffset={8}>
          {sectionGroups.map((group) => (
            <ListPopoverGroup key={group.sectionTitle}>
              <ListPopoverGroupLabel>{group.sectionTitle || 'Untitled'}</ListPopoverGroupLabel>
              {group.items.map(({ snippet, globalIndex }) => (
                <ListPopoverItem
                  key={snippet.id}
                  isActive={globalIndex === currentIndex}
                  onClick={() => onIndexChange(globalIndex)}
                >
                  {renderLabel(snippet, globalIndex)}
                </ListPopoverItem>
              ))}
            </ListPopoverGroup>
          ))}
        </ListPopoverContent>
      </ListPopover>

      <Button
        variant="ghost"
        size="icon"
        className="w-7 h-7 cursor-pointer rounded-md hover:bg-muted"
        onClick={() => onIndexChange(currentIndex + 1)}
        disabled={currentIndex >= snippets.length - 1}
        title="Next snippet"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
};

export default SnippetNavigator;
