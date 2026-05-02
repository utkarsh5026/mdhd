import { ListOrdered, PanelLeft, PanelRight, X } from 'lucide-react';
import { memo } from 'react';

import { BottomSheet, BottomSheetContent, BottomSheetTitle } from '@/components/ui/bottom-sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { FlatSection } from '@/services/section/types';

import { TreeOfContents } from './tree-of-contents';

export interface ReadingTocProps {
  isMobile: boolean;
  tocOpen: boolean;
  setTocOpen: (open: boolean) => void;
  tocSide: 'left' | 'right';
  toggleTocSide: () => void;
  sectionCount: number;
  flatSections: FlatSection[];
  currentIndex: number;
  readSections: Set<number>;
  showProgress: boolean;
  handleSelectCard: (index: number) => void;
}

const ReadingToc: React.FC<ReadingTocProps> = memo(
  ({
    isMobile,
    tocOpen,
    setTocOpen,
    tocSide,
    toggleTocSide,
    sectionCount,
    flatSections,
    currentIndex,
    readSections,
    showProgress,
    handleSelectCard,
  }) => {
    if (isMobile) {
      return (
        <BottomSheet open={tocOpen} onOpenChange={setTocOpen}>
          <BottomSheetContent>
            <BottomSheetTitle>Contents</BottomSheetTitle>
            <ScrollArea className="flex-1 max-h-[55vh]">
              <TreeOfContents
                sections={flatSections}
                currentIndex={currentIndex}
                readSections={readSections}
                showProgress={showProgress}
                handleSelectCard={(index) => {
                  handleSelectCard(index);
                  setTocOpen(false);
                }}
              />
            </ScrollArea>
          </BottomSheetContent>
        </BottomSheet>
      );
    }

    return (
      <div
        className={cn(
          'h-full shrink-0 overflow-x-clip',
          'transition-[width] duration-300 ease-in-out',
          'bg-background/95 backdrop-blur-xl',
          tocSide === 'left'
            ? 'order-first border-r border-border/30'
            : 'order-last border-l border-border/30',
          tocOpen ? 'w-64 sm:w-72' : 'w-0 border-0'
        )}
      >
        {tocOpen && (
          <div className="flex flex-col h-full w-64 sm:w-72">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/30">
              <div className="flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Contents</span>
                <span className="text-xs text-muted-foreground/60">{sectionCount}</span>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={toggleTocSide}
                  className={cn(
                    'p-1 rounded-md',
                    'text-muted-foreground/60 hover:text-foreground',
                    'hover:bg-accent/60 transition-colors'
                  )}
                  aria-label={`Move to ${tocSide === 'left' ? 'right' : 'left'} side`}
                >
                  {tocSide === 'left' ? (
                    <PanelRight className="h-3.5 w-3.5" />
                  ) : (
                    <PanelLeft className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  onClick={() => setTocOpen(false)}
                  className={cn(
                    'p-1 rounded-md',
                    'text-muted-foreground/60 hover:text-foreground',
                    'hover:bg-accent/60 transition-colors'
                  )}
                  aria-label="Close table of contents"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <TreeOfContents
                sections={flatSections}
                currentIndex={currentIndex}
                readSections={readSections}
                showProgress={showProgress}
                handleSelectCard={handleSelectCard}
              />
            </ScrollArea>
          </div>
        )}
      </div>
    );
  }
);

ReadingToc.displayName = 'ReadingToc';

export default ReadingToc;
