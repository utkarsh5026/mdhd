import { FileText } from 'lucide-react';
import React, { memo, useCallback, useMemo } from 'react';

import TreeOfContents from '@/components/features/content-reading/components/table-of-contents/tree-of-contents';
import { useReadingActionsById } from '@/components/features/content-reading/hooks/use-reading-selectors';
import { useActiveTabSections } from '@/components/features/tabs/hooks/use-active-tab-sections';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toFlatSections } from '@/services/section/queries';

interface SidebarTocProps {
  className?: string;
}

export const SidebarToc: React.FC<SidebarTocProps> = memo(({ className }) => {
  const { sections, currentIndex, tabId, hasActiveTab, readSections } = useActiveTabSections();
  const { changeSection } = useReadingActionsById(tabId ?? '');

  const handleSectionClick = useCallback(
    (index: number) => {
      changeSection(index);
    },
    [changeSection]
  );

  const flatSections = useMemo(() => toFlatSections(sections), [sections]);

  if (!hasActiveTab || sections.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full p-4', className)}>
        <FileText className="h-6 w-6 text-muted-foreground/30 mb-2" />
        <p className="text-xs text-muted-foreground/50 text-center">
          {!hasActiveTab ? 'No document open' : 'No headings found'}
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className={cn('h-full', className)}>
      <TreeOfContents
        sections={flatSections}
        currentIndex={currentIndex}
        readSections={readSections}
        showProgress={false}
        handleSelectCard={handleSectionClick}
      />
    </ScrollArea>
  );
});

SidebarToc.displayName = 'SidebarToc';
