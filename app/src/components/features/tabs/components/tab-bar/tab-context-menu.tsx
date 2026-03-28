import { Copy, Pin, PinOff } from 'lucide-react';
import React, { memo, useState } from 'react';

import Icon from '@/components/ui/icon';
import {
  ListPopover,
  ListPopoverContent,
  ListPopoverItem,
  ListPopoverTrigger,
} from '@/components/ui/list-popover';

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
    const [open, setOpen] = useState(false);

    const tabIndex = tabs.findIndex((t) => t.id === id);
    const closableToRight = tabs.slice(tabIndex + 1).some((t) => !t.pinned);
    const closableToLeft = tabs.slice(0, tabIndex).some((t) => !t.pinned);
    const hasOtherClosable = tabs.some((t) => t.id !== id && !t.pinned);

    return (
      <ListPopover open={open} onOpenChange={setOpen}>
        <ListPopoverTrigger
          asChild
          onContextMenu={(e) => {
            e.preventDefault();
            setOpen(true);
          }}
        >
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
        </ListPopoverTrigger>

        <ListPopoverContent className="w-48">
          <ListPopoverItem
            icon={<Icon icon={pinned ? PinOff : Pin} size="sm" />}
            onClick={() => {
              if (pinned) unpinTab(id);
              else pinTab(id);
              setOpen(false);
            }}
          >
            {pinned ? 'Unpin tab' : 'Pin tab'}
          </ListPopoverItem>

          <ListPopoverItem
            icon={<Icon icon={Copy} size="sm" />}
            onClick={() => {
              duplicateTab(id);
              setOpen(false);
            }}
          >
            Duplicate tab
          </ListPopoverItem>

          <div className="my-1 border-t border-border/50" />

          {[
            {
              label: 'Close tab',
              handler: (e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                onClose(e as unknown as React.MouseEvent);
                setOpen(false);
              },
              disabled: !!pinned,
            },
            {
              label: 'Close others',
              handler: () => {
                closeActions.closeOtherTabs(id);
                setOpen(false);
              },
              disabled: !hasOtherClosable || !activeTabId,
            },
            {
              label: 'Close tabs to the right',
              handler: () => {
                closeActions.closeTabsToTheRight(id);
                setOpen(false);
              },
              disabled: !closableToRight,
            },
            {
              label: 'Close tabs to the left',
              handler: () => {
                closeActions.closeTabsToTheLeft(id);
                setOpen(false);
              },
              disabled: !closableToLeft,
            },
          ].map(({ label, handler, disabled }) => (
            <ListPopoverItem key={label} onClick={handler} disabled={disabled}>
              {label}
            </ListPopoverItem>
          ))}
        </ListPopoverContent>
      </ListPopover>
    );
  }
);

TabContextMenu.displayName = 'TabContextMenu';

export default TabContextMenu;
