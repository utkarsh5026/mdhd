import React, { useRef, useCallback, memo } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AnimatePresence } from 'framer-motion';
import TabItem from './tab-item';
import TabManagementMenu from './tab-management-menu';
import ViewModeToggle from './view-mode-toggle';
import type { Tab } from '../store/tabs-store';

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string | null;
  viewMode: 'preview' | 'edit';
  onViewModeToggle: (mode: 'preview' | 'edit') => void;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onNewTab: () => void;
  onToggleHeaderVisibility: () => void;
}

const TabBar: React.FC<TabBarProps> = memo(
  ({
    tabs,
    activeTabId,
    viewMode,
    onViewModeToggle,
    onTabSelect,
    onTabClose,
    onNewTab,
    onToggleHeaderVisibility,
  }) => {
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
        onTabClose(tabId);
      },
      [onTabClose]
    );

    const handleWheel = useCallback((e: React.WheelEvent) => {
      if (scrollContainerRef.current) {
        e.preventDefault();
        scrollContainerRef.current.scrollLeft += e.deltaY;
      }
    }, []);

    return (
      <div className="flex items-center bg-muted/10 border-b border-border/20">
        {' '}
        {/* Scroll left button */}
        {tabs.length > 3 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 rounded-none border-r border-border/10"
            onClick={handleScrollLeft}
            aria-label="Scroll tabs left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
        )}
        {/* Tabs container */}
        <div
          ref={scrollContainerRef}
          onWheel={handleWheel}
          className={cn(
            'flex-1 flex items-stretch overflow-x-auto scrollbar-none',
            'scroll-smooth'
          )}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {tabs.map((tab) => (
              <TabItem
                key={tab.id}
                id={tab.id}
                title={tab.title}
                isActive={tab.id === activeTabId}
                sourceType={tab.sourceType}
                onSelect={() => onTabSelect(tab.id)}
                onClose={handleTabClose(tab.id)}
              />
            ))}
          </AnimatePresence>
        </div>
        {/* Scroll right button */}
        {tabs.length > 3 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 rounded-none border-l border-border/10"
            onClick={handleScrollRight}
            aria-label="Scroll tabs right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        )}
        {/* New tab button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 rounded-none border-l border-border/10 hover:bg-primary/10"
          onClick={onNewTab}
          aria-label="Create new tab"
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
        {/* View mode toggle */}
        <ViewModeToggle viewMode={viewMode} onToggle={onViewModeToggle} disabled={!activeTabId} />
        {/* Tab management menu */}
        <TabManagementMenu
          tabs={tabs}
          activeTabId={activeTabId}
          onToggleHeaderVisibility={onToggleHeaderVisibility}
        />
      </div>
    );
  }
);

TabBar.displayName = 'TabBar';

export default TabBar;
