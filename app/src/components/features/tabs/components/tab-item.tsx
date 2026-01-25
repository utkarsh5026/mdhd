import React, { useCallback, memo } from 'react';
import { X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface TabItemProps {
  id: string;
  title: string;
  isActive: boolean;
  sourceType: 'paste' | 'file';
  onSelect: () => void;
  onClose: (e: React.MouseEvent) => void;
}

const TabItem: React.FC<TabItemProps> = memo(
  ({ id, title, isActive, sourceType, onSelect, onClose }) => {
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

    return (
      <motion.button
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.15 }}
        onClick={onSelect}
        onMouseDown={handleMiddleClick}
        className={cn(
          'group relative flex items-center gap-1.5 px-2.5 py-1 min-w-24 max-w-48',
          'text-xs border-r border-border/10 transition-colors duration-150',
          'focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/30',
          isActive
            ? 'bg-background/50 text-foreground border-b border-b-primary/70'
            : 'bg-transparent text-muted-foreground/70 hover:bg-muted/20 hover:text-foreground/90'
        )}
        title={title}
        data-tab-id={id}
      >
        {/* File icon */}
        <FileText
          className={cn(
            'w-3.5 h-3.5 shrink-0',
            sourceType === 'file' ? 'text-blue-500/80' : 'text-muted-foreground/60'
          )}
        />

        {/* Title */}
        <span className="truncate flex-1 text-left">{title}</span>

        {/* Close button */}
        <span
          role="button"
          tabIndex={0}
          onClick={handleClose}
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
      </motion.button>
    );
  }
);

TabItem.displayName = 'TabItem';

export default TabItem;
