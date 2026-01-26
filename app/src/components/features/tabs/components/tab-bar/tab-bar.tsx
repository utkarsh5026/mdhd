import React, { useRef, useCallback, memo, useMemo } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import TabItem from './tab-item';
import TabManagementMenu from './tab-management-menu';
import ViewModeToggle from './view-mode-toggle';
import type { Tab } from '../../store/tabs-store';
/**
 * Information about how to display a tab
 */
interface TabDisplayInfo {
  filename: string;
  folderPath: string | null;
  fullPath: string | null;
  isDuplicate: boolean;
}

/**
 * Extracts the folder path from a file path (without the filename)
 * Example: "xy/ab/skill.md" -> "xy/ab"
 */
const getFolderPath = (path: string): string | null => {
  const normalized = path.replace(/\\/g, '/');
  const lastSlashIndex = normalized.lastIndexOf('/');

  if (lastSlashIndex === -1) {
    return null;
  }

  return normalized.substring(0, lastSlashIndex);
};

/**
 * Generates display information for tabs
 *
 * @param tabs - Array of tabs to process
 * @returns Map of tab ID to display information
 */
function generateTabDisplayNames(tabs: Tab[]): Map<string, TabDisplayInfo> {
  const displayMap = new Map<string, TabDisplayInfo>();
  const titleGroups = new Map<string, Tab[]>();

  tabs.forEach((tab) => {
    const existing = titleGroups.get(tab.title) || [];
    existing.push(tab);
    titleGroups.set(tab.title, existing);
  });

  tabs.forEach((tab) => {
    const tabsWithSameTitle = titleGroups.get(tab.title) || [];
    const isDuplicate = tabsWithSameTitle.length > 1;

    const filename = tab.title;
    let folderPath: string | null = null;
    let fullPath: string | null = null;

    if (tab.sourcePath) {
      folderPath = getFolderPath(tab.sourcePath);
      fullPath = tab.sourcePath;
    }

    displayMap.set(tab.id, {
      filename,
      folderPath,
      fullPath,
      isDuplicate,
    });
  });

  return displayMap;
}

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string | null;
  viewMode: 'preview' | 'edit' | 'dual';
  onViewModeToggle: (mode: 'preview' | 'edit' | 'dual') => void;
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
    const tabDisplayMap = useMemo(() => generateTabDisplayNames(tabs), [tabs]);

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
                onSelect={() => onTabSelect(id)}
                onClose={handleTabClose(id)}
              />
            );
          })}
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
        <TabManagementMenu onToggleHeaderVisibility={onToggleHeaderVisibility} />
      </div>
    );
  }
);

TabBar.displayName = 'TabBar';

export default TabBar;
