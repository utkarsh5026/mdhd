import React, { useCallback } from "react";
import { Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { type MarkdownSection } from "@/services/section/parsing";
import "@/index.css";

const TableOfContents: React.FC<{ sections: MarkdownSection[] }> = ({
  sections,
}) => {
  const normalizeTitle = useCallback((title: string) => {
    return title.replace(/^\d+(\.\d+)*\s*\.?\s*/, "").trim();
  }, []);

  const hasHeadings = sections.some((section) => section.level > 0);

  if (!hasHeadings) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Hash className="h-12 w-12 mb-4 opacity-30" />
        <p className="text-sm font-medium">No headings found</p>
        <p className="text-xs mt-1 text-center">
          Add # or ## headings to create sections
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-2">
      {sections.map((section, idx) => {
        const displayTitle = normalizeTitle(section.title);
        const isSubsection = section.level === 2;

        return (
          <div
            key={section.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg transition-colors",
              "hover:bg-secondary/20 group cursor-pointer",
              isSubsection && "ml-6"
            )}
          >
            <div
              className={cn(
                "min-w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0",
                "bg-primary/10 text-primary border border-primary/20",
                isSubsection &&
                  "bg-secondary/20 text-muted-foreground border-border"
              )}
            >
              <span className="text-xs font-medium">{idx + 1}</span>
            </div>

            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm line-clamp-2 text-left",
                  isSubsection
                    ? "text-muted-foreground"
                    : "text-foreground font-medium"
                )}
              >
                {displayTitle}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {section.wordCount} words
              </p>
            </div>

            {section.level === 1 && (
              <Hash className="h-4 w-4 text-primary/60 group-hover:text-primary transition-colors" />
            )}
            {section.level === 2 && (
              <div className="flex space-x-1">
                <Hash className="h-3 w-3 text-muted-foreground" />
                <Hash className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TableOfContents;
