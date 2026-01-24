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

interface MenuItemProps {
  icon: LucideIcon;
  label: string;
  count?: number;
  disabled?: boolean;
  onClick: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon: Icon, label, count, disabled, onClick }) => (
  <DropdownMenuItem onClick={onClick} disabled={disabled} className="cursor-pointer">
    <Icon className="mr-2 h-4 w-4" />
    {label}
    {count !== undefined && count > 0 && (
      <span className="ml-auto text-xs text-muted-foreground">{count}</span>
    )}
  </DropdownMenuItem>
);

interface TabManagementMenuProps {
  tabs: Tab[];
  activeTabId: string | null;
  onCloseAll: () => void;
  onCloseOthers: (tabId: string) => void;
  onCloseToTheRight: (tabId: string) => void;
  onCloseToTheLeft: (tabId: string) => void;
  onCloseByPathPrefix: (pathPrefix: string) => void;
  onCloseBySourceType: (sourceType: 'paste' | 'file') => void;
}

const TabManagementMenu: React.FC<TabManagementMenuProps> = memo(
  ({
    tabs,
    activeTabId,
    onCloseAll,
    onCloseOthers,
    onCloseToTheRight,
    onCloseToTheLeft,
    onCloseByPathPrefix,
    onCloseBySourceType,
  }) => {
    // Derive unique folders from tabs with sourcePath
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
      if (activeTabId) onCloseOthers(activeTabId);
    }, [activeTabId, onCloseOthers]);

    const handleCloseToTheRight = useCallback(() => {
      if (activeTabId) onCloseToTheRight(activeTabId);
    }, [activeTabId, onCloseToTheRight]);

    const handleCloseToTheLeft = useCallback(() => {
      if (activeTabId) onCloseToTheLeft(activeTabId);
    }, [activeTabId, onCloseToTheLeft]);

    const hasNoTabs = tabs.length === 0;
    const hasOnlyOneTab = tabs.length === 1;
    const hasNoFolders = uniqueFolders.length === 0;

    // Menu items configuration
    const menuItems = useMemo(
      () => [
        {
          icon: XCircle,
          label: 'Close all tabs',
          count: tabs.length,
          disabled: hasNoTabs,
          onClick: onCloseAll,
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
          onClick: () => onCloseBySourceType('file'),
        },
        {
          icon: ClipboardPaste,
          label: 'Close pasted tabs',
          count: tabCounts.paste || undefined,
          disabled: tabCounts.paste === 0,
          onClick: () => onCloseBySourceType('paste'),
        },
      ],
      [
        tabs.length,
        hasNoTabs,
        hasOnlyOneTab,
        activeTabId,
        positionCounts,
        tabCounts,
        onCloseAll,
        handleCloseOthers,
        handleCloseToTheRight,
        handleCloseToTheLeft,
        onCloseBySourceType,
      ]
    );

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-none border-l border-border/30 hover:bg-primary/10"
            aria-label="Tab management menu"
            disabled={hasNoTabs}
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 font-cascadia-code rounded-2xl">
          <DropdownMenuLabel>Tab Management</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {menuItems.map((item, index) => {
            if ('separator' in item) {
              return <DropdownMenuSeparator key={`sep-${index}`} />;
            }

            if ('folderSubmenu' in item) {
              return (
                <DropdownMenuSub key="folder-submenu">
                  <DropdownMenuSubTrigger disabled={hasNoFolders} className="cursor-pointer">
                    <FolderX className="mr-2 h-4 w-4" />
                    Close tabs from folder
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-56">
                    {uniqueFolders.length > 0 ? (
                      uniqueFolders.map(([folderPath, folderName]) => {
                        const tabCount = tabs.filter((t) =>
                          t.sourcePath?.startsWith(folderPath)
                        ).length;
                        return (
                          <DropdownMenuItem
                            key={folderPath}
                            onClick={() => onCloseByPathPrefix(folderPath)}
                            className="cursor-pointer"
                          >
                            <span className="truncate">{folderName}</span>
                            <span className="ml-auto text-xs text-muted-foreground">
                              {tabCount}
                            </span>
                          </DropdownMenuItem>
                        );
                      })
                    ) : (
                      <DropdownMenuItem disabled className="text-muted-foreground">
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
