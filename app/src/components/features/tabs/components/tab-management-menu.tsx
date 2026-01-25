import React, { useMemo, useCallback, memo } from 'react';
import {
  MoreHorizontal,
  X,
  XCircle,
  FolderX,
  ChevronRight,
  ChevronLeft,
  FileText,
  ClipboardPaste,
  Maximize,
  Minimize,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import type { Tab } from '../store/tabs-store';
import { useHeaderVisible, useTabClose } from '../store/tabs-store';

interface MenuItemProps {
  icon: LucideIcon;
  label: string;
  count?: number;
  disabled?: boolean;
  onClick: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon: Icon, label, count, disabled, onClick }) => (
  <DropdownMenuItem
    onClick={onClick}
    disabled={disabled}
    className="cursor-pointer gap-2 transition-colors duration-150"
  >
    <Icon className="h-4 w-4 text-muted-foreground" />
    <span className="flex-1">{label}</span>
    {count !== undefined && count > 0 && (
      <span className="ml-2 rounded-md bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
        {count}
      </span>
    )}
  </DropdownMenuItem>
);

interface TabManagementMenuProps {
  tabs: Tab[];
  activeTabId: string | null;
  onToggleHeaderVisibility: () => void;
}

const TabManagementMenu: React.FC<TabManagementMenuProps> = memo(
  ({
    tabs,
    activeTabId,
    onToggleHeaderVisibility,
  }) => {
    const isHeaderVisible = useHeaderVisible();
    const { closeAllTabs, closeOtherTabs, closeTabsToTheRight, closeTabsToTheLeft, closeTabsByPathPrefix, closeTabsBySourceType } = useTabClose();

    const uniqueFolders = useMemo(() => {
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
    }, [tabs]);

    // Count tabs by source type
    const tabCounts = useMemo(
      () => ({
        file: tabs.filter((t) => t.sourceType === 'file').length,
        paste: tabs.filter((t) => t.sourceType === 'paste').length,
      }),
      [tabs]
    );

    // Calculate position-based counts
    const positionCounts = useMemo(() => {
      if (!activeTabId) return { left: 0, right: 0 };
      const activeIndex = tabs.findIndex((t) => t.id === activeTabId);
      if (activeIndex === -1) return { left: 0, right: 0 };
      return {
        left: activeIndex,
        right: tabs.length - activeIndex - 1,
      };
    }, [tabs, activeTabId]);

    const handleCloseOthers = useCallback(() => {
      if (activeTabId) closeOtherTabs(activeTabId);
    }, [activeTabId, closeOtherTabs]);

    const handleCloseToTheRight = useCallback(() => {
      if (activeTabId) closeTabsToTheRight(activeTabId);
    }, [activeTabId, closeTabsToTheRight]);

    const handleCloseToTheLeft = useCallback(() => {
      if (activeTabId) closeTabsToTheLeft(activeTabId);
    }, [activeTabId, closeTabsToTheLeft]);

    const hasNoTabs = tabs.length === 0;
    const hasOnlyOneTab = tabs.length === 1;
    const hasNoFolders = uniqueFolders.length === 0;

    // Menu items configuration
    const menuItems = useMemo(
      () => [
        {
          icon: isHeaderVisible ? Maximize : Minimize,
          label: isHeaderVisible ? 'Hide header' : 'Show header',
          disabled: false,
          onClick: onToggleHeaderVisibility,
        },
        { separator: true },
        {
          icon: XCircle,
          label: 'Close all tabs',
          count: tabs.length,
          disabled: hasNoTabs,
          onClick: closeAllTabs,
        },
        {
          icon: X,
          label: 'Close other tabs',
          count: tabs.length > 1 ? tabs.length - 1 : undefined,
          disabled: hasOnlyOneTab || !activeTabId,
          onClick: handleCloseOthers,
        },
        { separator: true },
        {
          icon: ChevronRight,
          label: 'Close tabs to the right',
          count: positionCounts.right || undefined,
          disabled: positionCounts.right === 0 || !activeTabId,
          onClick: handleCloseToTheRight,
        },
        {
          icon: ChevronLeft,
          label: 'Close tabs to the left',
          count: positionCounts.left || undefined,
          disabled: positionCounts.left === 0 || !activeTabId,
          onClick: handleCloseToTheLeft,
        },
        { separator: true },
        { folderSubmenu: true },
        { separator: true },
        {
          icon: FileText,
          label: 'Close file tabs',
          count: tabCounts.file || undefined,
          disabled: tabCounts.file === 0,
          onClick: () => closeTabsBySourceType('file'),
        },
        {
          icon: ClipboardPaste,
          label: 'Close pasted tabs',
          count: tabCounts.paste || undefined,
          disabled: tabCounts.paste === 0,
          onClick: () => closeTabsBySourceType('paste'),
        },
      ],
      [
        isHeaderVisible,
        onToggleHeaderVisibility,
        tabs.length,
        hasNoTabs,
        hasOnlyOneTab,
        activeTabId,
        positionCounts,
        tabCounts,
        closeAllTabs,
        handleCloseOthers,
        handleCloseToTheRight,
        handleCloseToTheLeft,
        closeTabsBySourceType,
      ]
    );

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 rounded-none border-l border-border/10 transition-all duration-150 hover:bg-primary/10 hover:text-primary data-[state=open]:bg-primary/10 data-[state=open]:text-primary"
            aria-label="Tab management menu"
            disabled={hasNoTabs}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-60 rounded-2xl border-border/50 font-cascadia-code shadow-lg backdrop-blur-2xl"
        >
          <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            Tab Management
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-border/50" />

          {menuItems.map((item, index) => {
            if ('separator' in item) {
              return <DropdownMenuSeparator key={`sep-${index}`} className="bg-border/50" />;
            }

            if ('folderSubmenu' in item) {
              return (
                <DropdownMenuSub key="folder-submenu">
                  <DropdownMenuSubTrigger
                    disabled={hasNoFolders}
                    className="cursor-pointer gap-2 transition-colors duration-150"
                  >
                    <FolderX className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1">Close tabs from folder</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-56 rounded-lg border-border/50 shadow-md">
                    {uniqueFolders.length > 0 ? (
                      uniqueFolders.map(([folderPath, folderName]) => {
                        const tabCount = tabs.filter((t) =>
                          t.sourcePath?.startsWith(folderPath)
                        ).length;
                        return (
                          <DropdownMenuItem
                            key={folderPath}
                            onClick={() => closeTabsByPathPrefix(folderPath)}
                            className="cursor-pointer gap-2 transition-colors duration-150"
                          >
                            <span className="flex-1 truncate">{folderName}</span>
                            <span className="rounded-md bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                              {tabCount}
                            </span>
                          </DropdownMenuItem>
                        );
                      })
                    ) : (
                      <DropdownMenuItem disabled className="text-muted-foreground/70">
                        No folders available
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              );
            }

            return (
              <MenuItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                count={item.count}
                disabled={item.disabled}
                onClick={item.onClick}
              />
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
);

TabManagementMenu.displayName = 'TabManagementMenu';

export default TabManagementMenu;
