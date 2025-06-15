import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ListOrdered, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import ListOfContents from "./ListOfContents";
import ProgressBar from "./ProgressBar";
import { MarkdownSection } from "@/services/section/parsing";
import { useLocalStorage } from "@/hooks";

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
  const { storedValue: showProgress, setValue: setShowProgress } =
    useLocalStorage("showCardProgress", true);

  const progressPercentage = sections.length
    ? (readSections.size / sections.length) * 100
    : 0;

  const sectionsWithIds = sections.map((section, index) => ({
    id: index,
    title: section.title,
    level: section.level,
  }));

  return (
    <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
      <SheetContent
        side="right"
        className="font-type-mono p-0 border-l border-primary/10 overflow-hidden w-full sm:max-w-md"
      >
        <div className="flex flex-col h-full">
          <div className="sticky top-0 z-10 bg-card border-b border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <SheetTitle className="text-base font-medium flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-primary" />
                <span>Document Sections</span>
                <Badge
                  variant="outline"
                  className="ml-2 text-xs bg-primary/5 border-primary/20"
                >
                  {sections.length}
                </Badge>
              </SheetTitle>

              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMenuOpen(false)}
                className="h-8 w-8 rounded-full bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>

            {/* Progress tracking toggle */}
            <div className="flex items-center justify-between mb-3">
              <label
                htmlFor="show-card-progress"
                className="text-xs flex items-center gap-1.5 text-muted-foreground"
              >
                Show reading progress
              </label>
              <Switch
                id="show-card-progress"
                checked={showProgress}
                onCheckedChange={setShowProgress}
              />
            </div>

            {/* Progress bar and details */}
            {showProgress && sections.length > 0 && (
              <ProgressBar
                progressPercentage={progressPercentage}
                readSectionsIndexes={readSections}
                sections={sectionsWithIds}
                currentIndex={currentIndex}
              />
            )}
          </div>

          {/* Scrollable Content */}
          <ScrollArea className="flex-1 h-[calc(100vh-11rem)]">
            <ListOfContents
              sections={sectionsWithIds}
              currentIndex={currentIndex}
              readSections={readSections}
              showProgress={showProgress}
              handleSelectCard={(index) => {
                handleSelectCard(index);
                setMenuOpen(false);
              }}
            />
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SectionsSheet;
