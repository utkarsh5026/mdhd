import React, { useState, useCallback, useMemo } from "react";
import {
  Play,
  ChevronRight,
  FileText,
  BookOpen,
  Hash,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import FullScreenCardView from "@/components/document-reading/fullscreen/FullScreenCardView";
import { useTheme } from "./hooks";
import {
  type MarkdownSection,
  parseMarkdownIntoSections,
} from "./services/section/parsing";
import "./index.css";

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

const MDHDHomepage: React.FC = () => {
  const [markdownInput, setMarkdownInput] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sections, setSections] = useState<MarkdownSection[]>([]);
  const [readSections] = useState<Set<number>>(new Set());

  useTheme();

  const parsedSections = useMemo(() => {
    if (!markdownInput.trim()) return [];
    return parseMarkdownIntoSections(markdownInput);
  }, [markdownInput]);

  const handleStartReading = useCallback(() => {
    if (!markdownInput.trim()) return;
    setSections(parsedSections);
    setIsFullscreen(true);
  }, [markdownInput, parsedSections]);

  const handleExitFullscreen = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  const handleExitReading = useCallback(async () => {
    // Handle any cleanup if needed
  }, []);

  const handleChangeSection = useCallback(async (): Promise<boolean> => {
    // Handle section change logic
    return true;
  }, []);

  const getSection = useCallback(
    (index: number): MarkdownSection | null => {
      return sections[index] || null;
    },
    [sections]
  );

  const stats = useMemo(() => {
    const trimmed = markdownInput.trim();
    if (!trimmed) return { sections: 0, words: 0, readTime: 0 };

    const sectionCount = trimmed
      .split("\n")
      .filter((line) => /^#{1,2}\s/.exec(line)).length;
    const wordCount = trimmed
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
    const estimatedReadTime = Math.ceil(wordCount / 250);

    return {
      sections: sectionCount,
      words: wordCount,
      readTime: estimatedReadTime,
    };
  }, [markdownInput]);

  const hasContent = markdownInput.trim().length > 0;

  if (isFullscreen) {
    return (
      <FullScreenCardView
        onExit={handleExitReading}
        onChangeSection={handleChangeSection}
        sections={sections}
        getSection={getSection}
        readSections={readSections}
        markdown={markdownInput}
        exitFullScreen={handleExitFullscreen}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background font-cascadia-code">
      <div className="container mx-auto px-4 py-8">
        <div
          className={cn(
            "grid transition-all duration-500 ease-in-out gap-8",
            hasContent ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
          )}
        >
          {/* Main Input Section - Always Centered */}
          <div
            className={cn(
              "flex items-center justify-center min-h-screen",
              hasContent && "lg:min-h-[calc(100vh-4rem)]"
            )}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full max-w-2xl mx-auto space-y-8"
            >
              {/* Hero Section */}
              <div className="text-center space-y-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <h1 className="text-4xl md:text-6xl font-bold">
                    <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                      MDHD
                    </span>
                  </h1>
                  <p className="text-muted-foreground mt-4 text-lg">
                    Transform your markdown into focused reading sessions
                  </p>
                </motion.div>

                {/* Stats */}
                <AnimatePresence>
                  {hasContent && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="flex items-center justify-center gap-6"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">
                          {stats.sections} sections
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">
                          {stats.words} words
                        </span>
                      </div>
                      {stats.readTime > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            ~{stats.readTime} min read
                          </span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Input Card */}
              <Card className="p-6 space-y-6 border-border/50 bg-card/50 backdrop-blur-sm rounded-2xl">
                <div className="space-y-4">
                  <textarea
                    value={markdownInput}
                    onChange={(e) => setMarkdownInput(e.target.value)}
                    placeholder="# Your First Section
Start typing your markdown content here...

## Subsection
Each heading creates a new focused reading card.

```javascript
// Code blocks are preserved
console.log('Hello, World!');
```

Transform your content into digestible sections for better focus."
                    className={cn(
                      "w-full h-80 p-4 rounded-2xl border resize-none",
                      "bg-background/50 backdrop-blur-sm transition-all duration-200 text-muted-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
                      "text-sm leading-relaxed placeholder:text-muted-foreground/60",
                      "scrollbar-hide"
                    )}
                  />

                  {/* Character count */}
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{markdownInput.length} characters</span>
                    <AnimatePresence>
                      {hasContent && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex items-center gap-2"
                        >
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-primary font-medium">
                            Ready
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  onClick={handleStartReading}
                  disabled={!hasContent}
                  size="lg"
                  className={cn(
                    "w-full h-14 text-base font-semibold relative cursor-pointer overflow-hidden group rounded-2xl",
                    "bg-primary/60 hover:bg-primary/80 hover:scale-105 transition-all duration-300",
                    "disabled:bg-muted disabled:text-muted-foreground",
                    "shadow-lg hover:shadow-xl hover:shadow-primary/25"
                  )}
                >
                  <div className="relative z-10 flex items-center justify-center gap-3">
                    <Play className="w-5 h-5" />
                    <span>Start Focused Reading</span>
                    <motion.div
                      animate={hasContent ? { x: [0, 4, 0] } : {}}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </motion.div>
                  </div>
                </Button>
              </Card>

              {/* Quick Tips */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-center space-y-3"
              >
                <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    <span>Sections</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <List className="w-4 h-4" />
                    <span>Focus Mode</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground/80">
                  Break down complex content into digestible parts
                </p>
              </motion.div>
            </motion.div>
          </div>

          {/* Preview Panel - Appears when content exists */}
          <AnimatePresence>
            {hasContent && (
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.5 }}
                className="hidden lg:flex items-center justify-center min-h-[calc(100vh-4rem)]"
              >
                <Card className="w-full h-[600px] p-6 border-border/50 bg-card/50 backdrop-blur-sm rounded-2xl">
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Preview</h3>
                      <Badge
                        variant="outline"
                        className="bg-primary/5 border-primary/20"
                      >
                        {parsedSections.length} sections
                      </Badge>
                    </div>

                    <CardContent className="p-0 overflow-y-auto">
                      <ScrollArea className="h-full border bg-background/30 rounded-2xl p-4">
                        <TableOfContents sections={parsedSections} />
                      </ScrollArea>
                    </CardContent>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default MDHDHomepage;
