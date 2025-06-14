import React, { useState, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import FullScreenCardView from "@/components/document-reading/fullscreen/FullScreenCardView";
import {
  type MarkdownSection,
  parseMarkdownIntoSections,
} from "@/services/section/parsing";
import TableOfContents from "./TableOfContents";
import MarkdownInput from "./MarkdownInput";
import ThemeSelector from "@/components/shared/theme/ThemeSelector";
import { useTheme } from "@/hooks";

const MDHDHomepage: React.FC = () => {
  const [markdownInput, setMarkdownInput] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sections, setSections] = useState<MarkdownSection[]>([]);
  const [readSections] = useState<Set<number>>(new Set());

  const { currentTheme, setTheme } = useTheme();

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
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/10 font-cascadia-code relative">
      <div className="fixed top-4 right-4 z-50">
        <ThemeSelector
          currentTheme={currentTheme.name}
          onThemeChange={setTheme}
        />
      </div>
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
            <MarkdownInput
              markdownInput={markdownInput}
              setMarkdownInput={setMarkdownInput}
              hasContent={hasContent}
              handleStartReading={handleStartReading}
            />
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
