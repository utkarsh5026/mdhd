import React, { useState } from "react";
import { useTheme } from "@/components/shared/theme/hooks/use-theme";
import {
  themes,
  ThemeOption as ThemeOptionType,
  themeCategories as themeCategoryDefinitions,
} from "@/theme/themes";
import { Palette, ChevronDown, ChevronUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import ThemeOption from "@/components/shared/theme/components/theme-option";

// Group themes by their actual category property
const themeCategories = themeCategoryDefinitions
  .map((categoryDef) => ({
    name: categoryDef.name,
    icon: categoryDef.icon,
    description: categoryDef.description,
    themes: themes.filter((theme) => theme.category === categoryDef.name),
  }))
  .filter((category) => category.themes.length > 0); // Only include categories that have themes

interface ThemeCategoryProps {
  category: {
    name: string;
    icon: string;
    description: string;
    themes: ThemeOptionType[];
  };
  currentTheme: ThemeOptionType;
  setTheme: (theme: ThemeOptionType) => void;
}

const ThemeCategory: React.FC<ThemeCategoryProps> = ({
  category,
  currentTheme,
  setTheme,
}) => {
  const [expanded, setExpanded] = useState(
    category.themes.some((theme) => theme.name === currentTheme.name)
  );

  return (
    <div className="mb-3">
      <button
        className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-secondary/20 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <span>{category.icon}</span>
          <span className="font-medium text-sm">{category.name}</span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-2 mt-2 px-1">
              {category.themes.map((theme) => (
                <ThemeOption
                  key={theme.name}
                  theme={theme}
                  isActive={theme.name === currentTheme.name}
                  onSelect={() => setTheme(theme)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ThemeSelector: React.FC = () => {
  const { currentTheme, setTheme } = useTheme();

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Palette className="h-4 w-4" />
          <h3 className="font-medium text-sm">Theme</h3>
        </div>
        <span className="text-xs text-muted-foreground flex items-center gap-2">
          <span
            className="rounded-full bg-primary/10 px-2 py-1"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.background} 0%, ${currentTheme.primary} 100%)`,
            }}
          />
          {currentTheme.name}
        </span>
      </div>

      <ScrollArea className="flex-1 pr-2 -mr-2">
        {themeCategories.map((category) => (
          <ThemeCategory
            key={category.name}
            category={category}
            currentTheme={currentTheme}
            setTheme={setTheme}
          />
        ))}
      </ScrollArea>
    </div>
  );
};

export default ThemeSelector;
