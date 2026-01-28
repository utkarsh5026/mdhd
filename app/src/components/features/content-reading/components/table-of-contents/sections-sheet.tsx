import { useMemo, useCallback, useEffect, memo, useState } from 'react';
import { ListOrdered, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import ListOfContents from './list-of-contents';
import ProgressBar from './progress-bar';
import { MarkdownSection } from '@/services/section/parsing';
import { useLocalStorage } from '@/hooks';
import { cn } from '@/lib/utils';

interface SectionsSheetProps {
  currentIndex: number;
  handleSelectCard: (index: number) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  sections: MarkdownSection[];
  readSections: Set<number>;
}

interface SheetHeaderContentProps {
  count: number;
  setMenuOpen: (open: boolean) => void;
  showProgress: boolean;
  setShowProgress: (value: boolean) => void;
}
const SheetHeaderContent: React.FC<SheetHeaderContentProps> = memo(
  ({ count, setMenuOpen, showProgress, setShowProgress }) => (
    <div className="bg-card border-b border-border p-4 sticky top-0 z-20">
      <div className="flex items-center justify-between mb-3">
        <div className="text-base font-medium flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-primary" />
          <span>Document Sections</span>
          <Badge variant="outline" className="ml-2 text-xs bg-primary/5 border-primary/20">
            {count}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMenuOpen(false)}
          className="h-8 w-8 rounded-full bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center justify-between">
        <label className="text-xs flex items-center gap-1.5 text-muted-foreground">
          Show reading progress
        </label>
        <Switch checked={showProgress} onCheckedChange={setShowProgress} />
      </div>
    </div>
  )
);

const SectionsSheet: React.FC<SectionsSheetProps> = ({
  currentIndex,
  handleSelectCard,
  menuOpen,
  setMenuOpen,
  sections,
  readSections,
}) => {
  const { storedValue: showProgress, setValue: setShowProgress } = useLocalStorage(
    'showCardProgress',
    true
  );

  // Track whether component should be mounted (for exit animation)
  const [shouldRender, setShouldRender] = useState(menuOpen);

  useEffect(() => {
    if (menuOpen) {
      setShouldRender(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';

      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const progressPercentage = useMemo(
    () => (sections.length ? (readSections.size / sections.length) * 100 : 0),
    [sections.length, readSections.size]
  );

  const sectionsWithIds = useMemo(
    () =>
      sections.map((section, index) => ({
        id: index,
        title: section.title,
        level: section.level,
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

  if (!shouldRender) {
    return null;
  }

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 bg-black/80 z-40 transition-opacity duration-300 ease-in-out',
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      <div
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-full sm:max-w-md bg-background shadow-xl border-l border-border',
          'transform transition-transform duration-300 ease-out will-change-transform',
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex flex-col h-full font-type-mono">
          <SheetHeaderContent
            count={sections.length}
            setMenuOpen={setMenuOpen}
            showProgress={showProgress}
            setShowProgress={setShowProgress}
          />

          {showProgress && sections.length > 0 && (
            <div className="px-4 pb-2 bg-card border-b border-border/50">
              <ProgressBar
                progressPercentage={progressPercentage}
                readSectionsIndexes={readSections}
                sections={sectionsWithIds}
                currentIndex={currentIndex}
              />
            </div>
          )}

          <div className="flex-1 overflow-hidden relative">
            <ScrollArea className="h-full">
              <ListOfContents
                sections={sectionsWithIds}
                currentIndex={currentIndex}
                readSections={readSections}
                showProgress={showProgress}
                handleSelectCard={onSelect}
              />
            </ScrollArea>
          </div>
        </div>
      </div>
    </>
  );
};

export default memo(SectionsSheet);
