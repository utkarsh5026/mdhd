import React, { useCallback, memo } from 'react';
import { X, Eye, Pencil, Columns2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TooltipButton } from '@/components/shared/ui/tooltip-button';
import type { ViewMode } from '../../store';

const VIEW_MODE_CONFIG: Record<
  ViewMode,
  { Icon: LucideIcon; color: string; label: string }
> = {
  edit: { Icon: Pencil, color: 'amber', label: 'Edit mode' },
  dual: { Icon: Columns2, color: 'green', label: 'Dual mode' },
  preview: { Icon: Eye, color: 'blue', label: 'Preview mode' },
} as const;

interface TabItemProps {
  id: string;
  title: string;
  folderPath?: string | null;
  fullPath?: string | null;
  isActive: boolean;
  viewMode: ViewMode;
  onSelect: () => void;
  onClose: (e: React.MouseEvent) => void;
}

/**
 * Truncates long paths from the start with ellipsis
 * Example: "very/long/path/to/folder" -> "...to/folder"
 */
const truncatePath = (path: string, maxLength: number = 30): string => {
  if (path.length <= maxLength) {
    return path;
  }

  const parts = path.split('/');
  if (parts.length <= 2) {
    return `...${path.slice(-(maxLength - 3))}`;
  }

  const lastTwoParts = parts.slice(-2).join('/');
  if (lastTwoParts.length <= maxLength - 3) {
    return `.../${lastTwoParts}`;
  }

  return `...${path.slice(-(maxLength - 3))}`;
};

interface TabButtonProps {
  id: string;
  title: string;
  displayPath: string | null;
  isActive: boolean;
  viewMode: 'preview' | 'edit' | 'dual';
  onSelect: () => void;
  onClose: (e: React.MouseEvent) => void;
  onMiddleClick: (e: React.MouseEvent) => void;
}

/**
 * TabButton component with CSS animations
 */
const TabButton: React.FC<TabButtonProps> = memo(
  ({ id, title, displayPath, isActive, viewMode, onSelect, onClose, onMiddleClick }) => {
    return (
      <button
        onClick={onSelect}
        onMouseDown={onMiddleClick}
        className={cn(
          'group relative flex items-center gap-1.5 px-2.5 py-1 min-w-24 max-w-48',
          'text-xs border-r border-border/10 transition-colors duration-150',
          'focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/30',
          'animate-in fade-in zoom-in-95 duration-150',
          isActive
            ? 'bg-background/50 text-foreground border-b border-b-primary/70'
            : 'bg-transparent text-muted-foreground/70 hover:bg-muted/20 hover:text-foreground/90'
        )}
        data-tab-id={id}
      >
        {/* View mode icon */}
        {(() => {
          const { Icon, color, label } = VIEW_MODE_CONFIG[viewMode];
          return (
            <Icon
              className={cn(
                'w-3.5 h-3.5 shrink-0',
                isActive ? `text-${color}-500/80` : `text-${color}-500/60`
              )}
              aria-label={label}
            />
          );
        })()}

        {/* Title with optional folder path */}
        <div className="flex flex-col flex-1 min-w-0 text-left">
          {displayPath && (
            <span
              className={cn(
                'text-[9px] leading-tight truncate',
                isActive ? 'text-muted-foreground/60' : 'text-muted-foreground/40'
              )}
            >
              {displayPath}
            </span>
          )}
          <span className="truncate text-xs leading-tight">{title}</span>
        </div>

        {/* Close button */}
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onClose(e);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onClose(e as unknown as React.MouseEvent);
            }
          }}
          className={cn(
            'shrink-0 p-0.5 rounded-sm transition-all duration-150',
            'hover:bg-destructive/15 hover:text-destructive',
            isActive ? 'opacity-70' : 'opacity-0 group-hover:opacity-60'
          )}
          aria-label={`Close ${title}`}
        >
          <X className="w-3 h-3" />
        </span>
      </button>
    );
  }
);

TabButton.displayName = 'TabButton';

const TabItem: React.FC<TabItemProps> = memo(
  ({ id, title, folderPath, fullPath, isActive, viewMode, onSelect, onClose }) => {
    const handleClose = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onClose(e);
      },
      [onClose]
    );

    const handleMiddleClick = useCallback(
      (e: React.MouseEvent) => {
        if (e.button === 1) {
          e.preventDefault();
          onClose(e);
        }
      },
      [onClose]
    );

    const displayPath = folderPath ? truncatePath(folderPath) : null;

    const tabButton = (
      <TabButton
        id={id}
        title={title}
        displayPath={displayPath}
        isActive={isActive}
        viewMode={viewMode}
        onSelect={onSelect}
        onClose={handleClose}
        onMiddleClick={handleMiddleClick}
      />
    );

    if (fullPath) {
      return <TooltipButton button={tabButton} tooltipText={fullPath} />;
    }

    return tabButton;
  }
);

TabItem.displayName = 'TabItem';

export default TabItem;
