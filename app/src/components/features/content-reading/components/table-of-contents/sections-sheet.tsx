import { ListOrdered } from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import SideSheet, { SideSheetBody, SideSheetHeader } from '@/components/ui/side-sheet';
import { useLocalStorage } from '@/hooks';
import { MarkdownSection } from '@/services/section/parsing';

import TreeOfContents from './tree-of-contents';

interface SectionsSheetProps {
  currentIndex: number;
  handleSelectCard: (index: number) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  sections: MarkdownSection[];
  readSections: Set<number>;
}

const SectionsSheet: React.FC<SectionsSheetProps> = ({
  currentIndex,
  handleSelectCard,
  menuOpen,
  setMenuOpen,
  sections,
  readSections,
}) => {
  const { storedValue: showProgress } = useLocalStorage('showCardProgress', true);

  const sectionsWithIds = useMemo(
    () =>
      sections.map(({ title, level }, index) => ({
        id: index,
        title,
        level,
      })),
    [sections]
  );

  const onSelect = useCallback(
    (index: number) => {
      handleSelectCard(index);
      setMenuOpen(false);
    },
    [handleSelectCard, setMenuOpen]
  );

  const handleClose = useCallback(() => setMenuOpen(false), [setMenuOpen]);

  return (
    <SideSheet open={menuOpen} onOpenChange={setMenuOpen} size="md">
      <SideSheetHeader onClose={handleClose} className="bg-card">
        <ListOrdered className="w-4 h-4 text-primary" />
        <span className="text-base font-medium">Document Sections</span>
        <Badge variant="outline" className="ml-2 text-xs bg-primary/5 border-primary/20">
          {sections.length}
        </Badge>
      </SideSheetHeader>

      <SideSheetBody>
        <ScrollArea className="h-full">
          <TreeOfContents
            sections={sectionsWithIds}
            currentIndex={currentIndex}
            readSections={readSections}
            showProgress={showProgress}
            handleSelectCard={onSelect}
          />
        </ScrollArea>
      </SideSheetBody>
    </SideSheet>
  );
};

export default memo(SectionsSheet);
