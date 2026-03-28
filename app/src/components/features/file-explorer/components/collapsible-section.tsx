import { ChevronDown, ChevronRight } from 'lucide-react';
import React, { memo, useCallback, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  title: string;
  count: number;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  className?: string;
  emptyMessage?: string;
  maxHeight?: string;
}

/**
 * A collapsible section component for the file explorer.
 * Displays a header with title, count badge, and chevron toggle.
 * Content is shown/hidden based on expanded state.
 */
const CollapsibleSection: React.FC<CollapsibleSectionProps> = memo(
  ({
    title,
    count,
    defaultExpanded = true,
    children,
    className,
    emptyMessage,
    maxHeight = 'max-h-64',
  }) => {
    const [expanded, setExpanded] = useState(defaultExpanded);

    const toggleExpanded = useCallback(() => setExpanded((prev) => !prev), []);

    return (
      <div className={cn('flex flex-col', className)}>
        <button
          className="flex items-center justify-between px-3 py-1.5 hover:bg-muted/50 transition-colors"
          onClick={toggleExpanded}
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} ${title}`}
        >
          <div className="flex items-center gap-1.5">
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 select-none">
              {title}
            </span>
          </div>
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 h-4 min-w-5 justify-center bg-muted/50"
          >
            {count}
          </Badge>
        </button>

        {expanded && (
          <div className={cn('overflow-y-auto', maxHeight)}>
            {count === 0 && emptyMessage ? (
              <div className="px-3 py-4 text-xs text-muted-foreground/50 text-center">
                {emptyMessage}
              </div>
            ) : (
              children
            )}
          </div>
        )}
      </div>
    );
  }
);

CollapsibleSection.displayName = 'CollapsibleSection';
export default CollapsibleSection;
