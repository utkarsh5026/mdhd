import { useState, useCallback, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, useScroll, useTransform } from "framer-motion";
import { parseMarkdownIntoSections } from "@/services/section/parsing";
import FullscreenCardView from "../document-reading/fullscreen/FullScreenCardView";
import ThemeSelector from "../shared/theme/ThemeSelector";
import { type MarkdownSection } from "@/services/section/parsing";
import { useTheme } from "@/hooks";
import MarkdownInput from "./MarkdownInput";
import Hero from "./Hero";

const MDHDHomepage = () => {
  const [markdownInput, setMarkdownInput] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sections, setSections] = useState<MarkdownSection[]>([]);
  const [readSections] = useState(new Set<number>());
  const [isTyping, setIsTyping] = useState(false);
  const { currentTheme, setTheme } = useTheme();

  const { scrollY } = useScroll();
  const backgroundY = useTransform(scrollY, [0, 500], [0, 150]);

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

  const handleChangeSection = useCallback(async () => {
    return true;
  }, []);

  const getSection = useCallback(
    (index: number) => {
      return sections[index] || null;
    },
    [sections]
  );

  const wordCount = markdownInput
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  // Handle typing animation
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (markdownInput) {
      setIsTyping(true);
      timeout = setTimeout(() => setIsTyping(false), 500);
    }
    return () => clearTimeout(timeout);
  }, [markdownInput]);

  if (isFullscreen) {
    return (
      <FullscreenCardView
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
    <div className="min-h-screen relative overflow-hidden font-cascadia-code">
      {/* Animated background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-background via-primary/5 to-secondary/10"
        style={{ y: backgroundY }}
      />

      {/* Geometric background patterns */}

      {/* Theme selector */}
      <div className="fixed top-6 right-6 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
        >
          <ThemeSelector
            currentTheme={currentTheme.name}
            onThemeChange={setTheme}
          />
        </motion.div>
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-7xl mx-auto">
          <div
            className={cn(
              "grid gap-8 lg:gap-12 transition-all duration-700",
              "grid-cols-1 place-items-center"
            )}
          >
            {/* Main input section */}
            <div
              className={cn(
                "flex flex-col items-center justify-center space-y-8",
                "items-center text-center"
              )}
            >
              <Hero />

              <MarkdownInput
                markdownInput={markdownInput}
                setMarkdownInput={setMarkdownInput}
                handleStartReading={handleStartReading}
                isTyping={isTyping}
                wordCount={wordCount}
                parsedSections={parsedSections}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MDHDHomepage;
