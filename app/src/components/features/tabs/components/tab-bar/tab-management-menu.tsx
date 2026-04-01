import { MoreVertical } from 'lucide-react';
import React, { memo, useMemo } from 'react';

import { useTabClose } from '@/components/features/tabs/hooks/use-tab-close';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import {
  ListPopover,
  ListPopoverContent,
  ListPopoverGroup,
  ListPopoverGroupLabel,
  ListPopoverItem,
  ListPopoverTrigger,
} from '@/components/ui/list-popover';
import { useToggle } from '@/hooks';

import {
  useActiveTabId,
  useHeaderVisible,
  useStatusBarVisible,
  useTabs,
  useTabsActions,
} from '../../store';

const CountBadge: React.FC<{ count?: number }> = ({ count }) =>
  count != null && count > 0 ? (
    <span className="text-[10px] tabular-nums text-muted-foreground/50">{count}</span>
  ) : null;

const TabManagementMenu: React.FC = memo(() => {
  const tabs = useTabs();
  const activeTabId = useActiveTabId();
  const isHeaderVisible = useHeaderVisible();
  const isStatusBarVisible = useStatusBarVisible();
  const { toggleHeaderVisibility, toggleStatusBarVisibility } = useTabsActions();
  const {
    closeAllTabs,
    closeOtherTabs,
    closeTabsInDirection,
    closeTabsByPathPrefix,
    closeTabsBySourceType,
  } = useTabClose();

  const { state: isOpen, set: setIsOpen } = useToggle();

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
    <ListPopover open={isOpen} onOpenChange={setIsOpen}>
      <ListPopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-none border-l border-border/10 transition-all duration-150 hover:bg-primary/10 hover:text-primary data-[state=open]:bg-primary/10 data-[state=open]:text-primary"
          aria-label="Tab management menu"
          disabled={tabs.length === 0}
        >
          <Icon icon={MoreVertical} size="sm" />
        </Button>
      </ListPopoverTrigger>

      <ListPopoverContent align="end">
        {/* View */}
        <ListPopoverGroup>
          <ListPopoverItem onClick={toggleHeaderVisibility}>
            {isHeaderVisible ? 'Hide header' : 'Show header'}
          </ListPopoverItem>
          <ListPopoverItem onClick={toggleStatusBarVisibility}>
            {isStatusBarVisible ? 'Hide status bar' : 'Show status bar'}
          </ListPopoverItem>
        </ListPopoverGroup>

        {/* Close relative */}
        <ListPopoverGroup className="border-t border-border/30">
          <ListPopoverGroupLabel>Close</ListPopoverGroupLabel>
          <ListPopoverItem
            disabled={tabs.length === 0}
            onClick={closeAllTabs}
            suffix={<CountBadge count={tabs.length} />}
          >
            All tabs
          </ListPopoverItem>
          <ListPopoverItem
            disabled={tabs.length <= 1 || !activeTabId}
            onClick={() => {
              if (activeTabId) closeOtherTabs(activeTabId);
            }}
            suffix={<CountBadge count={tabs.length > 1 ? tabs.length - 1 : undefined} />}
          >
            Other tabs
          </ListPopoverItem>
          <ListPopoverItem
            disabled={positionCounts.right === 0 || !activeTabId}
            onClick={() => {
              if (activeTabId) closeTabsInDirection('right', activeTabId);
            }}
            suffix={<CountBadge count={positionCounts.right || undefined} />}
          >
            Tabs to the right
          </ListPopoverItem>
          <ListPopoverItem
            disabled={positionCounts.left === 0 || !activeTabId}
            onClick={() => {
              if (activeTabId) closeTabsInDirection('left', activeTabId);
            }}
            suffix={<CountBadge count={positionCounts.left || undefined} />}
          >
            Tabs to the left
          </ListPopoverItem>
        </ListPopoverGroup>

        {/* Close by type */}
        <ListPopoverGroup className="border-t border-border/30">
          <ListPopoverGroupLabel>By type</ListPopoverGroupLabel>
          <ListPopoverItem
            disabled={tabCounts.file === 0}
            onClick={() => closeTabsBySourceType('file')}
            suffix={<CountBadge count={tabCounts.file || undefined} />}
          >
            File tabs
          </ListPopoverItem>
          <ListPopoverItem
            disabled={tabCounts.paste === 0}
            onClick={() => closeTabsBySourceType('paste')}
            suffix={<CountBadge count={tabCounts.paste || undefined} />}
          >
            Pasted tabs
          </ListPopoverItem>
        </ListPopoverGroup>

        {/* Close by folder */}
        {uniqueFolders.length > 0 && (
          <ListPopoverGroup className="border-t border-border/30">
            <ListPopoverGroupLabel>From folder</ListPopoverGroupLabel>
            {uniqueFolders.map(([folderPath, folderName]) => {
              const tabCount = tabs.filter((t) => t.sourcePath?.startsWith(folderPath)).length;
              return (
                <ListPopoverItem
                  key={folderPath}
                  onClick={() => closeTabsByPathPrefix(folderPath)}
                  suffix={<CountBadge count={tabCount} />}
                >
                  {folderName}
                </ListPopoverItem>
              );
            })}
          </ListPopoverGroup>
        )}
      </ListPopoverContent>
    </ListPopover>
  );
});

TabManagementMenu.displayName = 'TabManagementMenu';

export default TabManagementMenu;
