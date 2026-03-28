import { Copy, Pin, PinOff } from 'lucide-react';
import React, { memo } from 'react';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import Icon from '@/components/ui/icon';

import { useActiveTabId, useTabClose, useTabs, useTabsActions } from '../../store';
import TabItem from './tab-item';

interface TabContextMenuProps {
  id: string;
  title: string;
  folderPath?: string | null;
  fullPath?: string | null;
  isActive: boolean;
  pinned?: boolean;
  onSelect: () => void;
  onClose: (e: React.MouseEvent) => void;
}

const TabContextMenu: React.FC<TabContextMenuProps> = memo(
  ({ id, title, folderPath, fullPath, isActive, pinned, onSelect, onClose }) => {
    const tabs = useTabs();
    const activeTabId = useActiveTabId();
    const { pinTab, unpinTab, duplicateTab } = useTabsActions();
    const closeActions = useTabClose();

    const tabIndex = tabs.findIndex((t) => t.id === id);
    const closableToRight = tabs.slice(tabIndex + 1).some((t) => !t.pinned);
    const closableToLeft = tabs.slice(0, tabIndex).some((t) => !t.pinned);
    const hasOtherClosable = tabs.some((t) => t.id !== id && !t.pinned);

    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <span>
            <TabItem
              id={id}
              title={title}
              folderPath={folderPath}
              fullPath={fullPath}
              isActive={isActive}
              pinned={pinned}
              onSelect={onSelect}
              onClose={onClose}
            />
          </span>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-48 rounded-2xl">
          <ContextMenuItem
            onClick={() => (pinned ? unpinTab(id) : pinTab(id))}
            className="cursor-pointer gap-2 px-2.5 py-1.5 text-xs"
          >
            {pinned ? (
              <>
                <Icon icon={PinOff} size="sm" />
                Unpin tab
              </>
            ) : (
              <>
                <Icon icon={Pin} size="sm" />
                Pin tab
              </>
            )}
          </ContextMenuItem>

          <ContextMenuItem
            onClick={() => duplicateTab(id)}
            className="cursor-pointer gap-2 px-2.5 py-1.5 text-xs"
          >
            <Icon icon={Copy} size="sm" />
            Duplicate tab
          </ContextMenuItem>

          <ContextMenuSeparator />

          {[
            {
              label: 'Close tab',
              handler: (e: React.MouseEvent) => {
                e.stopPropagation();
                onClose(e);
              },
              disabled: !!pinned,
            },
            {
              label: 'Close others',
              handler: () => closeActions.closeOtherTabs(id),
              disabled: !hasOtherClosable || !activeTabId,
            },
            {
              label: 'Close tabs to the right',
              handler: () => closeActions.closeTabsToTheRight(id),
              disabled: !closableToRight,
            },
            {
              label: 'Close tabs to the left',
              handler: () => closeActions.closeTabsToTheLeft(id),
              disabled: !closableToLeft,
            },
          ].map(({ label, handler, disabled }) => (
            <ContextMenuItem
              key={label}
              onClick={handler}
              disabled={disabled}
              className="cursor-pointer px-2.5 py-1.5 text-xs"
            >
              {label}
            </ContextMenuItem>
          ))}
        </ContextMenuContent>
      </ContextMenu>
    );
  }
);

TabContextMenu.displayName = 'TabContextMenu';

export default TabContextMenu;
