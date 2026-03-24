import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import React, { memo, useCallback, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { useTabDisplayMap } from '../../hooks/use-tab-display-map';
import { useActiveTabId, useTabs, useTabsActions } from '../../store';
import TabItem from './tab-item';
import TabManagementMenu from './tab-management-menu';

const DesktopTabBar: React.FC = memo(() => {
  const tabs = useTabs();
  const activeTabId = useActiveTabId();
  const { setActiveTab, closeTab, createUntitledTab } = useTabsActions();
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
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>
      )}
      <div
        ref={scrollContainerRef}
        onWheel={handleWheel}
        className={cn('flex-1 flex items-stretch overflow-x-auto scrollbar-none', 'scroll-smooth')}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tabs.map(({ id, readingState, title }) => {
          const displayInfo = tabDisplayMap.get(id);
          return (
            <TabItem
              key={id}
              id={id}
              title={title}
              folderPath={displayInfo?.folderPath}
              fullPath={displayInfo?.fullPath}
              isActive={id === activeTabId}
              viewMode={readingState.viewMode}
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
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 rounded-none border-l border-border/30 hover:bg-primary/10"
        onClick={createUntitledTab}
        aria-label="Create new tab"
      >
        <Plus className="w-3.5 h-3.5" />
      </Button>
      <TabManagementMenu />
    </div>
  );
});

DesktopTabBar.displayName = 'DesktopTabBar';

export default DesktopTabBar;
