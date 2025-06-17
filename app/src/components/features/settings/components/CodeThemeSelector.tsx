import React, { useState } from "react";
import {
  useCodeThemeStore,
  type ThemeKey,
} from "@/components/features/settings/store/code-theme";
import { Code, ChevronDown, ChevronUp, Palette } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";

const sampleCode = `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)`;

interface CodePreviewProps {
  theme: { name: string; style: { [key: string]: React.CSSProperties } };
  isSelected: boolean;
  onClick: () => void;
}

const CodePreview: React.FC<CodePreviewProps> = ({
  theme,
  isSelected,
  onClick,
}) => {
  return (
    <div
      className={cn(
        "border rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer group",
        isSelected
          ? "border-primary/50 bg-primary/5 shadow-md"
          : "border-border/30 hover:border-border/60 bg-card/30"
      )}
      onClick={onClick}
    >
      {/* Theme Header */}
      <div className="px-4 py-3 border-b border-border/20 bg-card/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="font-medium text-sm">{theme.name}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Code Preview */}
      <div className="relative">
        <SyntaxHighlighter
          language="python"
          style={theme.style}
          customStyle={{
            margin: 0,
            padding: "16px",
            fontSize: "11px",
            lineHeight: 1.4,
            backgroundColor: "transparent",
            background: "transparent",
            border: "none",
            minHeight: "80px",
            maxHeight: "120px",
            overflow: "hidden",
            fontFamily: "JetBrains Mono, Consolas, monospace",
          }}
          codeTagProps={{
            style: {
              backgroundColor: "transparent",
              fontFamily: "inherit",
              fontSize: "inherit",
            },
          }}
        >
          {sampleCode}
        </SyntaxHighlighter>

        {/* Fade overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-card/80 to-transparent pointer-events-none" />
      </div>
    </div>
  );
};

interface CodeThemeCategoryProps {
  categoryName: string;
  themes: Record<
    string,
    { name: string; style: { [key: string]: React.CSSProperties } }
  >;
  currentTheme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
}

const CodeThemeCategory: React.FC<CodeThemeCategoryProps> = ({
  categoryName,
  themes,
  currentTheme,
  setTheme,
}) => {
  const [expanded, setExpanded] = useState(
    Object.keys(themes).includes(currentTheme)
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Dark Themes":
        return "🌙";
      case "Light Themes":
        return "☀️";
      case "Unique Themes":
        return "✨";
      default:
        return "🎨";
    }
  };

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case "Dark Themes":
        return "Perfect for night coding sessions";
      case "Light Themes":
        return "Clean and bright for daytime work";
      case "Unique Themes":
        return "Special themes with unique characteristics";
      default:
        return "";
    }
  };

  return (
    <div className="mb-6 border border-border/30 rounded-2xl overflow-hidden bg-card/50 backdrop-blur-sm">
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary/5 transition-all duration-200 border-b border-border/20"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{getCategoryIcon(categoryName)}</span>
          <div className="text-left">
            <div className="font-semibold text-sm">{categoryName}</div>
            <div className="text-xs text-muted-foreground">
              {getCategoryDescription(categoryName)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-2 py-1 bg-primary/10">
            {Object.keys(themes).length}
          </Badge>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-4 grid gap-4 md:grid-cols-1 lg:grid-cols-2">
              {Object.entries(themes).map(([themeKey, theme]) => (
                <CodePreview
                  key={themeKey}
                  theme={theme}
                  isSelected={currentTheme === themeKey}
                  onClick={() => setTheme(themeKey as ThemeKey)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CodeThemeSelector: React.FC = () => {
  const { selectedTheme, setTheme, getCurrentThemeName, getThemesByCategory } =
    useCodeThemeStore();

  const themeCategories = getThemesByCategory();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border/20">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Code className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Code Syntax Theme</h3>
            <p className="text-sm text-muted-foreground">
              Choose how code blocks are highlighted and styled
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground mb-1">
            Currently Active
          </div>
          <Badge
            variant="outline"
            className="text-xs px-3 py-1 bg-primary/10 border-primary/20"
          >
            {getCurrentThemeName()}
          </Badge>
        </div>
      </div>

      <ScrollArea className="max-h-[500px] pr-2">
        <div className="space-y-4">
          {Object.entries(themeCategories).map(([categoryName, themes]) => (
            <CodeThemeCategory
              key={categoryName}
              categoryName={categoryName}
              themes={themes}
              currentTheme={selectedTheme}
              setTheme={setTheme}
            />
          ))}
        </div>
      </ScrollArea>

      <div className="pt-4 border-t border-border/20">
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-xl">
          <Palette className="w-4 h-4 flex-shrink-0" />
          <span>
            Theme changes apply instantly to all code blocks in your document.
            Switch between JS/PY/TS previews to see syntax highlighting.
          </span>
        </div>
      </div>
    </div>
  );
};

export default CodeThemeSelector;
