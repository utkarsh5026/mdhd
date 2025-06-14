import React, { useState, useCallback } from "react";
import { Play, Sparkles, ChevronRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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
    <div className="min-h-screen bg-background relative font-cascadia-code">
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-4 mb-6 rounded-2xl bg-primary/5 border border-primary/10">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              MDHD
            </h1>

            <p className="text-muted-foreground text-lg">
              Markdown for ADHD users •{" "}
              <span className="text-primary">Structured reading</span>
            </p>
          </div>

          {/* Input Card */}
          <Card className="p-8 bg-card/50 backdrop-blur-sm border-border/50 shadow-xl">
            <div className="space-y-6">
              {/* Input Area */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    Paste your markdown content
                  </label>
                  {sectionCount > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      <span>{sectionCount} sections detected</span>
                    </div>
                  )}
                </div>

                <textarea
                  value={markdownInput}
                  onChange={(e) => setMarkdownInput(e.target.value)}
                  placeholder="# Your First Section
This is how your content will be broken down into focused reading sections.

## Subsection
Each heading becomes a separate card for distraction-free reading.

Start typing your markdown content here..."
                  className={cn(
                    "w-full h-80 p-6 rounded-xl border bg-background/50 backdrop-blur-sm resize-none",
                    "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
                    "transition-all duration-300 text-sm leading-relaxed",
                    "placeholder:text-muted-foreground/50"
                  )}
                />

                {/* Character count and status */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{markdownInput.length} characters</span>
                  {markdownInput.trim() && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-primary">Ready to read</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Start Button */}
              <div className="pt-4">
                <Button
                  onClick={handleStartReading}
                  disabled={!markdownInput.trim()}
                  size="lg"
                  className={cn(
                    "w-full h-14 text-base font-medium",
                    "bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground",
                    "transition-all duration-300 group relative overflow-hidden"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <Play className="w-5 h-5 mr-3" />
                  Start Focused Reading
                  <ChevronRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Quick tips */}
          <div className="mt-8 text-center text-xs text-muted-foreground space-y-2">
            <p>Use # for main sections and ## for subsections</p>
            <p>Each section becomes a focused reading card</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MDHDHomepage;
