import React from 'react';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

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

/**
 * A right-click context menu for export actions, shared by block-level renderers.
 *
 * Renders a titled, separated list of labelled actions. The caller supplies the
 * trigger content via `children` and the action list via `items`.
 */
const ExportContextMenu: React.FC<ExportContextMenuProps> = ({ title, items, children }) => (
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

ExportContextMenu.displayName = 'ExportContextMenu';
export default ExportContextMenu;
