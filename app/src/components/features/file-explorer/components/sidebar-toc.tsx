import React, { memo, useCallback, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useActiveTabSections } from '@/components/features/tabs/hooks/use-active-tab-sections';
import { useTabNavigation } from '@/components/features/tabs/hooks/use-tab-navigation';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import TreeOfContents from '@/components/features/content-reading/components/table-of-contents/tree-of-contents';
import type { FlatSection } from '@/components/features/content-reading/components/table-of-contents/types';

interface SidebarTocProps {
  className?: string;
}

export const SidebarToc: React.FC<SidebarTocProps> = memo(({ className }) => {
  const { sections, currentIndex, tabId, hasActiveTab, readSections } = useActiveTabSections();
  const { changeSection } = useTabNavigation(tabId ?? '');

  const handleSectionClick = useCallback(
    (index: number) => {
      changeSection(index);
    },
    [changeSection]
  );

  // Transform MarkdownSection[] to FlatSection[] for TreeOfContents
  const flatSections: FlatSection[] = useMemo(
    () =>
      sections.map((section, index) => ({
        id: index,
        title: section.title,
        level: section.level,
      })),
    [sections]
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
