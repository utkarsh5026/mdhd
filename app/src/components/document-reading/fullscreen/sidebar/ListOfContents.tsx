import { ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallback } from "react";

interface ListOfContentsProps {
  sections: { id: number; title: string }[];
  currentIndex: number;
  readSections: Set<number>;
  showProgress: boolean;
  handleSelectCard: (index: number) => void;
}

const ListOfContents: React.FC<ListOfContentsProps> = ({
  sections,
  currentIndex,
  readSections,
  showProgress,
  handleSelectCard,
}) => {
  const normalizeTitle = useCallback((title: string) => {
    return title.replace(/^\d+(\.\d+)*\s*\.?\s*/, "").trim();
  }, []);

  const getButtonClass = useCallback(
    (isActive: boolean, isRead: boolean, showProgress: boolean) => {
      if (isActive) return "bg-primary/10 text-primary font-medium";
      if (isRead && showProgress) return "bg-secondary/10 text-foreground/90";
      return "hover:bg-secondary/20 text-muted-foreground hover:text-foreground";
    },
    []
  );

  const getCircleClass = useCallback(
    (isActive: boolean, isRead: boolean, showProgress: boolean) => {
      if (isActive) return "bg-primary/20 text-primary";
      if (isRead && showProgress) return "bg-primary/10 text-foreground/80";
      return "bg-secondary/10 text-muted-foreground";
    },
    []
  );

  const renderStatusIndicator = useCallback(
    (isActive: boolean, isRead: boolean, showProgress: boolean) => {
      if (isActive) {
        return (
          <ChevronRight className="ml-auto h-3.5 w-3.5 text-primary flex-shrink-0" />
        );
      }
      if (isRead && showProgress) {
        return (
          <div className="ml-auto h-2 w-2 rounded-full bg-primary/40 flex-shrink-0" />
        );
      }
      return null;
    },
    []
  );

  return (
    <div className="p-2">
      {sections.length > 0 ? (
        <div className="space-y-1">
          {sections.map((section, idx) => {
            const displayTitle = normalizeTitle(section.title);
            const isActive = idx === currentIndex;
            const isRead = readSections.has(section.id);

            return (
              <button
                key={section.id}
                className={cn(
                  "w-full text-left px-2 py-2 rounded-md",
                  "transition-colors duration-200",
                  "flex items-center gap-2",
                  getButtonClass(isActive, isRead, showProgress)
                )}
                onClick={() => {
                  handleSelectCard(idx);
                }}
              >
                <div
                  className={cn(
                    "min-w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0",
                    getCircleClass(isActive, isRead, showProgress)
                  )}
                >
                  <span className="text-xs font-medium">{idx + 1}</span>
                </div>

                <span className="text-xs line-clamp-3 text-left">
                  {displayTitle}
                </span>

                {renderStatusIndicator(isActive, isRead, showProgress)}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="w-6 h-6 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium">No matching sections</p>
          <p className="text-xs mt-1">Try a different search term</p>
        </div>
      )}
    </div>
  );
};

export default ListOfContents;
