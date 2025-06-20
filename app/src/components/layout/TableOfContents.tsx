import React, { useCallback } from "react";
import { Hash, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { type MarkdownSection } from "@/services/section/parsing";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface TableOfContentsProps {
  sections: MarkdownSection[];
  readSections?: Set<number>;
}

const TableOfContents: React.FC<TableOfContentsProps> = ({
  sections,
  readSections = new Set(),
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
    <div className="space-y-2 p-2 overflow-y-auto">
      {sections.map((section, idx) => {
        const displayTitle = normalizeTitle(section.title);
        const isSubsection = section.level === 2;
        const isRead = readSections.has(idx);

        return (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.1 }}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl transition-all duration-300",
              "hover:bg-primary/5 group cursor-pointer border border-transparent hover:border-primary/20",
              isSubsection && "ml-6",
              isRead && "bg-green-500/5 border-green-500/20"
            )}
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              className={cn(
                "min-w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 transition-all relative",
                isRead
                  ? "bg-gradient-to-br from-green-500/20 to-green-500/10 text-green-600 border border-green-500/30"
                  : isSubsection
                  ? "bg-gradient-to-br from-secondary/20 to-secondary/10 text-muted-foreground border border-border"
                  : "bg-gradient-to-br from-primary/20 to-primary/10 text-primary border border-primary/20"
              )}
            >
              <span className="text-xs font-bold">{idx + 1}</span>
              {isRead && (
                <CheckCircle className="h-3 w-3 text-green-600 absolute -top-1 -right-1 bg-background rounded-full" />
              )}
            </motion.div>

            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm line-clamp-2 text-left transition-colors",
                  isRead
                    ? "text-green-700 dark:text-green-400 font-medium"
                    : isSubsection
                    ? "text-muted-foreground group-hover:text-foreground"
                    : "text-foreground font-medium group-hover:text-primary"
                )}
              >
                {displayTitle}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant={isRead ? "default" : "outline"}
                  className={cn(
                    "text-xs px-2 py-0",
                    isRead &&
                      "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30"
                  )}
                >
                  {section.wordCount} words
                </Badge>
                {isRead && (
                  <Badge
                    variant="outline"
                    className="text-xs px-2 py-0 bg-green-500/10 text-green-600 border-green-500/30"
                  >
                    Read
                  </Badge>
                )}
                {section.level === 1 && (
                  <Hash className="h-3 w-3 text-primary/60" />
                )}
                {section.level === 2 && (
                  <div className="flex space-x-0.5">
                    <Hash className="h-2.5 w-2.5 text-muted-foreground" />
                    <Hash className="h-2.5 w-2.5 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default TableOfContents;
