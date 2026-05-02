import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import React, { memo, useCallback, useRef } from 'react';

import { useTabClose } from '@/components/features/tabs/hooks/use-tab-close';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';

import { useTabDisplayMap } from '../../hooks/use-tab-display-map';
import { useActiveTabId, useTabs, useTabsActions } from '../../store';
import TabContextMenu from './tab-context-menu';
import TabManagementMenu from './tab-management-menu';

const DesktopTabBar: React.FC = memo(() => {
  const tabs = useTabs();
  const activeTabId = useActiveTabId();
  const { setActiveTab, createUntitledTab } = useTabsActions();
  const { closeTab } = useTabClose();
  const tabDisplayMap = useTabDisplayMap(tabs);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScrollLeft = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  }, []);

  const handleScrollRight = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  }, []);

  const handleTabClose = useCallback(
    (tabId: string) => (e: React.MouseEvent) => {
      e.stopPropagation();
      closeTab(tabId);
    },
    [closeTab]
  );

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (scrollContainerRef.current) {
      e.preventDefault();
      scrollContainerRef.current.scrollLeft += e.deltaY;
    }
  }, []);

  return (
    <div className="hidden sm:flex items-center bg-card/90 border-b border-border/40">
      {tabs.length > 3 && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 rounded-none border-r border-border/30"
          onClick={handleScrollLeft}
          aria-label="Scroll tabs left"
        >
          <Icon icon={ChevronLeft} size="sm" />
        </Button>
      )}
      <div
        ref={scrollContainerRef}
        onWheel={handleWheel}
        className={cn('flex-1 flex items-stretch overflow-x-auto scrollbar-none', 'scroll-smooth')}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tabs.map(({ id, title, pinned }) => {
          const displayInfo = tabDisplayMap.get(id);
          return (
            <TabContextMenu
              key={id}
              id={id}
              title={title}
              folderPath={displayInfo?.folderPath}
              fullPath={displayInfo?.fullPath}
              isActive={id === activeTabId}
              pinned={pinned}
              onSelect={() => setActiveTab(id)}
              onClose={handleTabClose(id)}
            />
          );
        })}
      </div>
      {tabs.length > 3 && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 rounded-none border-l border-border/30"
          onClick={handleScrollRight}
          aria-label="Scroll tabs right"
        >
          <Icon icon={ChevronRight} size="sm" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 rounded-none border-l border-border/30 hover:bg-primary/10"
        onClick={createUntitledTab}
        aria-label="Create new tab"
      >
        <Icon icon={Plus} size="sm" />
      </Button>
      <TabManagementMenu />
    </div>
  );
});

DesktopTabBar.displayName = 'DesktopTabBar';

export default DesktopTabBar;
