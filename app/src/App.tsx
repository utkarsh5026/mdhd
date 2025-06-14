import React, { useState, useCallback } from "react";
import { Play, ChevronRight, FileText, BookOpen, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import FullScreenCardView from "@/components/document-reading/fullscreen/FullScreenCardView";
import { useTheme } from "./hooks";
import {
  type MarkdownSection,
  parseMarkdownIntoSections,
} from "./services/section/parsing";

const MDHDHomepage: React.FC = () => {
  const [markdownInput, setMarkdownInput] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sections, setSections] = useState<MarkdownSection[]>([]);
  const [readSections] = useState<Set<number>>(new Set());
  const [inputFocused, setInputFocused] = useState(false);

  useTheme();

  const handleStartReading = useCallback(() => {
    if (!markdownInput.trim()) return;

    const parsedSections = parseMarkdownIntoSections(markdownInput);
    setSections(parsedSections);
    setIsFullscreen(true);
  }, [markdownInput]);

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

  const sectionCount = markdownInput.trim()
    ? markdownInput.split("\n").filter((line) => /^#{1,2}\s/.exec(line)).length
    : 0;

  const wordCount = markdownInput.trim()
    ? markdownInput.split(/\s+/).filter((word) => word.length > 0).length
    : 0;

  const estimatedReadTime = Math.ceil(wordCount / 250); // Average reading speed

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
    <div className="min-h-screen bg-card relative font-cascadia-code overflow-hidden">
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-5xl mx-auto"
        >
          {/* Hero Section */}

          {/* Main Input Card */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            <Card
              className={cn(
                "relative overflow-hidden backdrop-blur-xl transition-all duration-500 rounded-2xl",
                "bg-background border-border/30 border-2 shadow-2xl",
                inputFocused && "shadow-primary/10 border-none shadow-3xl"
              )}
            >
              <div className="relative z-10 p-8 md:p-12">
                <div className="space-y-8">
                  {/* Header Section */}
                  <motion.div
                    className="flex items-center justify-between"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                  >
                    <div>
                      <h2 className="text-2xl font-bold text-foreground mb-2">
                        Transform Your Markdown
                      </h2>
                      <p className="text-muted-foreground">
                        Break down complex content into digestible, focused
                        sections
                      </p>
                    </div>

                    <AnimatePresence>
                      {sectionCount > 0 && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0, rotate: -180 }}
                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                          exit={{ opacity: 0, scale: 0, rotate: 180 }}
                          className="flex items-center gap-3 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
                        >
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-primary">
                            {sectionCount} sections
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Input Area */}
                  <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                  >
                    <div className="relative group">
                      <motion.textarea
                        value={markdownInput}
                        onChange={(e) => setMarkdownInput(e.target.value)}
                        onFocus={() => setInputFocused(true)}
                        onBlur={() => setInputFocused(false)}
                        placeholder="# Your First Section
This is how your content will be broken down into focused reading sections.

## Subsection
Each heading becomes a separate card for distraction-free reading.

Start typing your markdown content here..."
                        className={cn(
                          "w-full h-96 p-6 rounded-2xl border transition-all duration-300 resize-none",
                          "bg-background/50 backdrop-blur-sm",
                          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
                          "text-sm leading-relaxed placeholder:text-muted-foreground/60",
                          "group-hover:border-primary/30"
                        )}
                        whileFocus={{ scale: 1.01 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                      />

                      {/* Input decorations */}
                      <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                    </div>

                    {/* Stats Row */}
                    <motion.div
                      className="flex items-center justify-between text-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                    >
                      <div className="flex items-center gap-6 text-muted-foreground">
                        <span>{markdownInput.length} characters</span>
                        <span>{wordCount} words</span>
                        {estimatedReadTime > 0 && (
                          <span>~{estimatedReadTime} min read</span>
                        )}
                      </div>

                      <AnimatePresence>
                        {markdownInput.trim() && (
                          <motion.div
                            initial={{ opacity: 0, x: 20, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.8 }}
                            className="flex items-center gap-2"
                          >
                            <motion.div
                              className="w-2 h-2 rounded-full bg-green-500"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                            <span className="text-primary font-medium">
                              Ready to read
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </motion.div>

                  {/* Action Button */}
                  <motion.div
                    className="pt-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1 }}
                  >
                    <Button
                      onClick={handleStartReading}
                      disabled={!markdownInput.trim()}
                      size="lg"
                      className={cn(
                        "w-full h-16 text-lg font-semibold relative overflow-hidden group",
                        "bg-gradient-to-r from-primary via-primary to-primary hover:from-primary/90 hover:via-primary hover:to-primary/90",
                        "disabled:bg-muted disabled:text-muted-foreground disabled:from-muted disabled:via-muted disabled:to-muted",
                        "transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-primary/25",
                        "border border-primary/20"
                      )}
                    >
                      {/* Animated background gradient */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                      {/* Button content */}
                      <div className="relative z-10 flex items-center justify-center gap-3">
                        <Play className="w-6 h-6" />
                        <span>Start Focused Reading</span>
                        <motion.div
                          animate={{ x: [0, 4, 0] }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        >
                          <ChevronRight className="w-6 h-6" />
                        </motion.div>
                      </div>

                      {/* Glow effect */}
                      <div className="absolute inset-0 bg-primary/20 blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </Button>
                  </motion.div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Quick Tips */}
          <motion.div
            className="mt-12 text-center space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">#</span>
                </div>
                <span>Main sections</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">##</span>
                </div>
                <span>Subsections</span>
              </div>

              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span>Focused cards</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground/80">
              Each section becomes a distraction-free reading experience
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default MDHDHomepage;
