import { MoreHorizontal } from 'lucide-react';
import React, { memo, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  useActiveTabId,
  useHeaderVisible,
  useStatusBarVisible,
  useTabClose,
  useTabs,
  useTabsActions,
} from '../../store';

interface MenuItemProps {
  label: string;
  count?: number;
  disabled?: boolean;
  onClick: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ label, count, disabled, onClick }) => (
  <DropdownMenuItem
    onClick={onClick}
    disabled={disabled}
    className="cursor-pointer justify-between px-3 py-1.5 text-xs text-muted-foreground transition-colors duration-100 focus:text-foreground"
  >
    {label}
    {count !== undefined && count > 0 && (
      <span className="text-[10px] tabular-nums text-muted-foreground/50">{count}</span>
    )}
  </DropdownMenuItem>
);

const TabManagementMenu: React.FC = memo(() => {
  const tabs = useTabs();
  const activeTabId = useActiveTabId();
  const isHeaderVisible = useHeaderVisible();
  const isStatusBarVisible = useStatusBarVisible();
  const { toggleHeaderVisibility, toggleStatusBarVisibility } = useTabsActions();
  const {
    closeAllTabs,
    closeOtherTabs,
    closeTabsToTheRight,
    closeTabsToTheLeft,
    closeTabsByPathPrefix,
    closeTabsBySourceType,
  } = useTabClose();

  const [isOpen, setIsOpen] = useState(false);

  const uniqueFolders = useMemo(() => {
    if (!isOpen) return [];
    const folders = new Map<string, string>();

    for (const tab of tabs) {
      if (tab.sourcePath) {
        const lastSepIndex = Math.max(
          tab.sourcePath.lastIndexOf('/'),
          tab.sourcePath.lastIndexOf('\\')
        );
        if (lastSepIndex > 0) {
          const folderPath = tab.sourcePath.substring(0, lastSepIndex);
          if (!folders.has(folderPath)) {
            const folderName = folderPath.substring(
              Math.max(folderPath.lastIndexOf('/'), folderPath.lastIndexOf('\\')) + 1
            );
            folders.set(folderPath, folderName || folderPath);
          }
        }
      }
    }

    return Array.from(folders.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [tabs, isOpen]);

  const tabCounts = useMemo(() => {
    if (!isOpen) return { file: 0, paste: 0 };
    return {
      file: tabs.filter((t) => t.sourceType === 'file').length,
      paste: tabs.filter((t) => t.sourceType === 'paste').length,
    };
  }, [tabs, isOpen]);

  const positionCounts = useMemo(() => {
    if (!isOpen || !activeTabId) return { left: 0, right: 0 };
    const activeIndex = tabs.findIndex((t) => t.id === activeTabId);
    if (activeIndex === -1) return { left: 0, right: 0 };
    return {
      left: activeIndex,
      right: tabs.length - activeIndex - 1,
    };
  }, [tabs, activeTabId, isOpen]);

  return (
    <DropdownMenu onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 rounded-none border-l border-border/10 transition-all duration-150 hover:bg-primary/10 hover:text-primary data-[state=open]:bg-primary/10 data-[state=open]:text-primary"
          aria-label="Tab management menu"
          disabled={tabs.length === 0}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-52 rounded-xl border-border/30 bg-background/95 p-1 shadow-xl backdrop-blur-xl"
      >
        {/* View */}
        <MenuItem
          label={isHeaderVisible ? 'Hide header' : 'Show header'}
          onClick={toggleHeaderVisibility}
        />
        <MenuItem
          label={isStatusBarVisible ? 'Hide status bar' : 'Show status bar'}
          onClick={toggleStatusBarVisibility}
        />

        <DropdownMenuSeparator className="my-1 bg-border/30" />

        {/* Close relative */}
        <DropdownMenuLabel className="px-3 pb-0.5 pt-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/40">
          Close
        </DropdownMenuLabel>
        <MenuItem
          label="All tabs"
          count={tabs.length}
          disabled={tabs.length === 0}
          onClick={closeAllTabs}
        />
        <MenuItem
          label="Other tabs"
          count={tabs.length > 1 ? tabs.length - 1 : undefined}
          disabled={tabs.length <= 1 || !activeTabId}
          onClick={() => {
            if (activeTabId) closeOtherTabs(activeTabId);
          }}
        />
        <MenuItem
          label="Tabs to the right"
          count={positionCounts.right || undefined}
          disabled={positionCounts.right === 0 || !activeTabId}
          onClick={() => {
            if (activeTabId) closeTabsToTheRight(activeTabId);
          }}
        />
        <MenuItem
          label="Tabs to the left"
          count={positionCounts.left || undefined}
          disabled={positionCounts.left === 0 || !activeTabId}
          onClick={() => {
            if (activeTabId) closeTabsToTheLeft(activeTabId);
          }}
        />

        <DropdownMenuSeparator className="my-1 bg-border/30" />

        {/* Close by type */}
        <DropdownMenuLabel className="px-3 pb-0.5 pt-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/40">
          By type
        </DropdownMenuLabel>
        <MenuItem
          label="File tabs"
          count={tabCounts.file || undefined}
          disabled={tabCounts.file === 0}
          onClick={() => closeTabsBySourceType('file')}
        />
        <MenuItem
          label="Pasted tabs"
          count={tabCounts.paste || undefined}
          disabled={tabCounts.paste === 0}
          onClick={() => closeTabsBySourceType('paste')}
        />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger
            disabled={uniqueFolders.length === 0}
            className="cursor-pointer px-3 py-1.5 text-xs text-muted-foreground transition-colors duration-100 focus:text-foreground"
          >
            From folder
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48 rounded-lg border-border/30 bg-background/95 p-1 shadow-lg backdrop-blur-xl">
            {uniqueFolders.map(([folderPath, folderName]) => {
              const tabCount = tabs.filter((t) => t.sourcePath?.startsWith(folderPath)).length;
              return (
                <DropdownMenuItem
                  key={folderPath}
                  onClick={() => closeTabsByPathPrefix(folderPath)}
                  className="cursor-pointer justify-between px-3 py-1.5 text-xs text-muted-foreground transition-colors duration-100 focus:text-foreground"
                >
                  <span className="truncate">{folderName}</span>
                  <span className="ml-2 text-[10px] tabular-nums text-muted-foreground/50">
                    {tabCount}
                  </span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

TabManagementMenu.displayName = 'TabManagementMenu';

export default TabManagementMenu;
