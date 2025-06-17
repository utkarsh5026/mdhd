import { useState, useCallback, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, useScroll, useTransform } from "framer-motion";
import { parseMarkdownIntoSections } from "@/services/section/parsing";
import FullscreenCardView from "../features/content-reading/components/FullScreenCardView";
import ThemeSelector from "../shared/theme/components/ThemeSelector";
import { type MarkdownSection } from "@/services/section/parsing";
import { useTheme } from "@/hooks";
import MarkdownInput from "./MarkdownInput";
import Hero from "./Hero";
import { FaGithub } from "react-icons/fa";

const MDHDHomepage = () => {
  const [markdownInput, setMarkdownInput] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sections, setSections] = useState<MarkdownSection[]>([]);
  const [readSections, setReadSections] = useState(new Set<number>());
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
    setReadSections(new Set<number>([0]));
    setIsFullscreen(true);
  }, [markdownInput, parsedSections]);

  const handleExitFullscreen = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  const handleExitReading = useCallback(async () => {
    // Handle any cleanup if needed
  }, []);

  const handleChangeSection = useCallback(
    async (index: number) => {
      const currentSection = sections[index];
      if (currentSection) {
        setReadSections((prev) => new Set(prev).add(index));
      }
      return true;
    },
    [sections]
  );

  const getSection = useCallback(
    (index: number) => {
      return sections[index] || null;
    },
    [sections]
  );

  const wordCount = markdownInput
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

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

      <div className="relative z-10 pb-10">
        <motion.div
          className="flex items-center justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          <a
            href="https://github.com/utkarsh5026/mdhd"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 group"
          >
            <span>Made with 💖 by Utkarsh Priyadarshi</span>
            <FaGithub className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default MDHDHomepage;
