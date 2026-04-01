import { ChevronDown, ChevronLeft, ChevronRight, Maximize, Plus, X } from 'lucide-react';
import React, { memo } from 'react';

import { useTabClose } from '@/components/features/tabs/hooks/use-tab-close';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import {
  ListPopover,
  ListPopoverContent,
  ListPopoverItem,
  ListPopoverTrigger,
} from '@/components/ui/list-popover';
import { useToggle } from '@/hooks';

import { type TabDisplayInfo, useTabDisplayMap } from '../../hooks/use-tab-display-map';
import { type Tab, useActiveTabId, useTabs, useTabsActions } from '../../store';
import type { MobileNavProps } from './tab-bar';

interface MobileTabDropdownProps {
  tabs: Tab[];
  activeTabId: string | null;
  activeTitle: string;
  tabDisplayMap: Map<string, TabDisplayInfo>;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onNewTab: () => void;
}

const MobileTabDropdown: React.FC<MobileTabDropdownProps> = memo(
  ({ tabs, activeTabId, activeTitle, tabDisplayMap, onTabSelect, onTabClose, onNewTab }) => {
    const { state: open, setFalse: close, set: setOpen } = useToggle();

    return (
      <ListPopover open={open} onOpenChange={setOpen}>
        <ListPopoverTrigger asChild>
          <button className="flex items-center gap-1 px-2.5 py-1.5 min-w-0 max-w-48 text-xs font-medium text-foreground hover:bg-accent/50 transition-colors">
            <span className="truncate">{activeTitle}</span>
            <Icon icon={ChevronDown} size="xs" className="shrink-0 text-muted-foreground" />
          </button>
        </ListPopoverTrigger>
        <ListPopoverContent
          title={`${tabs.length} tab${tabs.length === 1 ? '' : 's'}`}
          align="start"
          footer={
            <div className="border-t border-border/40">
              <ListPopoverItem
                onClick={() => {
                  onNewTab();
                  close();
                }}
                icon={<Icon icon={Plus} size="xs" />}
              >
                New tab
              </ListPopoverItem>
            </div>
          }
        >
          {tabs.map((tab) => {
            const displayInfo = tabDisplayMap.get(tab.id);
            return (
              <ListPopoverItem
                key={tab.id}
                isActive={tab.id === activeTabId}
                onClick={() => {
                  onTabSelect(tab.id);
                  close();
                }}
                suffix={
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTabClose(tab.id);
                    }}
                    className="p-1.5 rounded hover:bg-destructive/20 hover:text-destructive transition-colors"
                    aria-label={`Close ${tab.title}`}
                  >
                    <Icon icon={X} size="xs" />
                  </button>
                }
              >
                <div className="min-w-0">
                  <div className="truncate">{displayInfo?.filename ?? tab.title}</div>
                  {displayInfo?.folderPath && (
                    <div className="text-[10px] text-muted-foreground/60 truncate">
                      {displayInfo.folderPath}
                    </div>
                  )}
                </div>
              </ListPopoverItem>
            );
          })}
        </ListPopoverContent>
      </ListPopover>
    );
  }
);

MobileTabDropdown.displayName = 'MobileTabDropdown';

interface MobileTabBarProps {
  mobileNav?: MobileNavProps;
}

const MobileTabBar: React.FC<MobileTabBarProps> = memo(({ mobileNav }) => {
  const tabs = useTabs();
  const activeTabId = useActiveTabId();
  const { setActiveTab, createUntitledTab } = useTabsActions();
  const { closeTab } = useTabClose();
  const tabDisplayMap = useTabDisplayMap(tabs);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const activeTitle =
    tabDisplayMap.get(activeTabId ?? '')?.filename ?? activeTab?.title ?? 'Untitled';

  return (
    <div className="sm:hidden flex items-center bg-card/90 border-b border-border/40">
      <MobileTabDropdown
        tabs={tabs}
        activeTabId={activeTabId}
        activeTitle={activeTitle}
        tabDisplayMap={tabDisplayMap}
        onTabSelect={setActiveTab}
        onTabClose={closeTab}
        onNewTab={createUntitledTab}
      />

      <div className="flex-1" />

      {mobileNav?.readingMode === 'card' && mobileNav.total > 0 && (
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-none"
            onClick={mobileNav.onPrevious}
            disabled={mobileNav.currentIndex === 0}
            aria-label="Previous section"
          >
            <Icon icon={ChevronLeft} size="sm" />
          </Button>
          <span className="text-xs text-muted-foreground tabular-nums min-w-10 text-center">
            {mobileNav.currentIndex + 1}/{mobileNav.total}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-none"
            onClick={mobileNav.onNext}
            disabled={mobileNav.currentIndex === mobileNav.total - 1}
            aria-label="Next section"
          >
            <Icon icon={ChevronRight} size="sm" />
          </Button>
        </div>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 rounded-none border-l border-border/30"
        onClick={mobileNav?.onFullscreen}
        disabled={!mobileNav}
        aria-label="Enter fullscreen"
      >
        <Icon icon={Maximize} size="sm" />
      </Button>
    </div>
  );
});

MobileTabBar.displayName = 'MobileTabBar';

export default MobileTabBar;
