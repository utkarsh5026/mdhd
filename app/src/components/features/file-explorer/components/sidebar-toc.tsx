import React, { memo, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useActiveTabSections } from '@/components/features/tabs/hooks/use-active-tab-sections';
import { useTabNavigation } from '@/components/features/tabs/hooks/use-tab-navigation';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarTocProps {
  className?: string;
}

interface TocItemProps {
  title: string;
  level: number;
  isActive: boolean;
  onClick: () => void;
}

const normalizeTitle = (title: string) => title.replace(/^\d+(\.\d+)*\s*\.?\s*/, '').trim();

const getLevelPadding = (level: number) => level * 12 + 12;

const TocItem = memo<TocItemProps>(({ title, level, isActive, onClick }) => {
  const paddingLeft = getLevelPadding(level);
  const displayTitle = normalizeTitle(title);

  return (
    <button
      style={{ paddingLeft: `${paddingLeft}px` }}
      className={cn(
        'w-full text-left py-1.5 pr-3 text-sm truncate',
        'hover:bg-secondary/50 transition-colors rounded-sm',
        isActive && 'bg-primary/10 text-primary font-medium border-l-2 border-primary',
        !isActive && 'text-foreground/80'
      )}
      onClick={onClick}
    >
      {displayTitle}
    </button>
  );
});

TocItem.displayName = 'TocItem';

export const SidebarToc: React.FC<SidebarTocProps> = memo(({ className }) => {
  const { sections, currentIndex, tabId, hasActiveTab } = useActiveTabSections();
  const { changeSection } = useTabNavigation(tabId ?? '');

  const handleSectionClick = useCallback(
    (index: number) => {
      changeSection(index);
    },
    [changeSection]
  );

  if (!hasActiveTab || sections.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full p-4', className)}>
        <FileText className="h-8 w-8 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground text-center">
          {!hasActiveTab ? 'No document open' : 'No headings found'}
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className={cn('h-full', className)}>
      <div className="py-2 px-1 space-y-0.5">
        {sections.map((section, index) => (
          <TocItem
            key={section.id}
            title={section.title}
            level={section.level}
            isActive={index === currentIndex}
            onClick={() => handleSectionClick(index)}
          />
        ))}
      </div>
    </ScrollArea>
  );
});

SidebarToc.displayName = 'SidebarToc';
