import { MoreVertical } from 'lucide-react';
import React, { useState } from 'react';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { useIsTouch } from '@/hooks';

import { BottomSheet, BottomSheetContent, BottomSheetTitle } from './bottom-sheet';

export interface ExportMenuItem {
  label: string;
  description: string;
  onSelect: () => void | Promise<void>;
}

export interface ExportContextMenuProps {
  /** Label shown in the menu header (e.g. "Export table", "typescript block"). */
  title: string;
  items: ExportMenuItem[];
  children: React.ReactNode;
}

const ExportBottomSheet: React.FC<ExportContextMenuProps> = ({ title, items, children }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative group/export">
      {children}
      <button
        onClick={() => setOpen(true)}
        className="absolute top-2 right-2 p-2 rounded-full bg-card/80 backdrop-blur-sm border border-border/30 shadow-sm opacity-0 group-hover/export:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
        aria-label={title}
      >
        <MoreVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      <BottomSheet open={open} onOpenChange={setOpen}>
        <BottomSheetContent>
          <BottomSheetTitle>{title}</BottomSheetTitle>
          <div className="mt-4 space-y-1">
            {items.map(({ label, description, onSelect }) => (
              <button
                key={label}
                onClick={() => {
                  onSelect();
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-muted/60 transition-colors cursor-pointer"
              >
                <div className="text-sm font-medium">{label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
              </button>
            ))}
          </div>
        </BottomSheetContent>
      </BottomSheet>
    </div>
  );
};

const ExportDesktopMenu: React.FC<ExportContextMenuProps> = ({ title, items, children }) => (
  <ContextMenu>
    <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>

    <ContextMenuContent className="w-52 rounded-2xl">
      <div className="px-2 pt-1 pb-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </p>
      </div>
      <ContextMenuSeparator />
      {items.map(({ label, description, onSelect }) => (
        <ContextMenuItem key={label} onSelect={onSelect} className="py-2 px-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium leading-none">{label}</span>
            <span className="text-[11px] leading-none text-muted-foreground">{description}</span>
          </div>
        </ContextMenuItem>
      ))}
    </ContextMenuContent>
  </ContextMenu>
);

/**
 * Export actions menu — context menu on desktop, bottom sheet with "..." button on touch devices.
 */
const ExportContextMenu: React.FC<ExportContextMenuProps> = (props) => {
  const isTouch = useIsTouch();

  if (isTouch) {
    return <ExportBottomSheet {...props} />;
  }

  return <ExportDesktopMenu {...props} />;
};

ExportContextMenu.displayName = 'ExportContextMenu';
export default ExportContextMenu;
