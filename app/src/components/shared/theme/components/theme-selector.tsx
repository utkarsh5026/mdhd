import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  type ThemeOption as ThemeTypeOption,
  themes,
  themeCategories,
} from "@/theme/themes";
import { Palette, Search, ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import ThemeOption from "./theme-option";

interface ThemeSelectorProps {
  currentTheme: string;
  onThemeChange: (theme: ThemeTypeOption) => void;
  className?: string;
}

/**
 * 🎨 Modern, spacious theme selector with collapsible categories
 */
const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onThemeChange,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    new Set(["Dark", "Light"])
  );

  // Popular themes (recent from each main category)
  const popularThemes = [
    ...themes.filter((t) => t.category === "Dark").slice(0, 3),
    ...themes.filter((t) => t.category === "Light").slice(0, 3),
    ...themes.filter((t) => t.category === "Developer").slice(0, 2),
  ];

  // Filter themes based on search
  const filteredThemes = themes.filter(
    (theme) =>
      theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      theme.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group themes by category
  const themesByCategory = themes.reduce((acc, theme) => {
    if (!acc[theme.category]) {
      acc[theme.category] = [];
    }
    acc[theme.category].push(theme);
    return acc;
  }, {} as Record<string, ThemeTypeOption[]>);

  const toggleCategory = (categoryName: string) => {
    const newOpenCategories = new Set(openCategories);
    if (newOpenCategories.has(categoryName)) {
      newOpenCategories.delete(categoryName);
    } else {
      newOpenCategories.add(categoryName);
    }
    setOpenCategories(newOpenCategories);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-9 w-9 rounded-xl", className)}
          aria-label="Change theme"
        >
          <Palette className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[min(480px,calc(100vw-2rem))] p-4 sm:p-6 bg-card border-border rounded-2xl shadow-xl font-cascadia-code"
      >
        {/* Modern Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h3 className="font-semibold text-base sm:text-lg text-foreground">
              Choose Your Theme
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Personalize your experience
            </p>
          </div>
        </div>

        {/* Enhanced Tabs */}
        <Tabs defaultValue="categories" className="w-full">
          <TabsList className="w-full mb-4 sm:mb-6 h-9 sm:h-10 rounded-xl bg-muted/50 font-cascadia-code">
            <TabsTrigger
              value="categories"
              className="text-xs sm:text-sm px-2 sm:px-4 font-medium"
            >
              <span className="hidden sm:inline">🗂️ Categories</span>
              <span className="sm:hidden">🗂️</span>
            </TabsTrigger>
            <TabsTrigger
              value="popular"
              className="text-xs sm:text-sm px-2 sm:px-4 font-medium"
            >
              <span className="hidden sm:inline">⭐ Popular</span>
              <span className="sm:hidden">⭐</span>
            </TabsTrigger>
            <TabsTrigger
              value="all"
              className="text-xs sm:text-sm px-2 sm:px-4 font-medium"
            >
              <span className="hidden sm:inline">🌈 All Themes</span>
              <span className="sm:hidden">🌈</span>
            </TabsTrigger>
          </TabsList>

          {/* Categories Tab with Collapsible Sections */}
          <TabsContent
            value="categories"
            className="max-h-80 sm:max-h-96 overflow-y-auto pr-1 sm:pr-2"
          >
            <div className="space-y-3 sm:space-y-4">
              {themeCategories.map((category) => {
                const categoryThemes = themesByCategory[category.name] || [];
                const isOpen = openCategories.has(category.name);

                return (
                  <Collapsible
                    key={category.name}
                    open={isOpen}
                    onOpenChange={() => toggleCategory(category.name)}
                  >
                    {/* Enhanced Category Header */}
                    <CollapsibleTrigger asChild>
                      <button className="flex items-center gap-2 sm:gap-3 w-full px-2 sm:px-3 py-2.5 sm:py-3 rounded-xl hover:bg-secondary/50 transition-all duration-200 group font-cascadia-code">
                        <span className="text-base sm:text-lg">
                          {category.icon}
                        </span>
                        <div className="flex-1 text-left min-w-0">
                          <span className="text-xs sm:text-sm font-medium text-foreground block truncate">
                            {category.name}
                          </span>
                          <p className="text-xs text-muted-foreground hidden sm:block">
                            {category.description}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md shrink-0">
                          {categoryThemes.length}
                        </span>
                        {isOpen ? (
                          <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                        )}
                      </button>
                    </CollapsibleTrigger>

                    {/* Enhanced Category Content */}
                    <CollapsibleContent className="mt-2 sm:mt-3">
                      <div className={cn("pl-2 sm:pl-4")}>
                        {categoryThemes.map((theme) => (
                          <ThemeOption
                            key={theme.name}
                            theme={theme}
                            isActive={theme.name === currentTheme}
                            onSelect={() => onThemeChange(theme)}
                            showCategory={false}
                          />
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </TabsContent>

          {/* Popular Tab */}
          <TabsContent
            value="popular"
            className="max-h-80 sm:max-h-96 overflow-y-auto pr-1 sm:pr-2"
          >
            <div className={cn("space-y-2")}>
              {popularThemes.map((theme) => (
                <ThemeOption
                  key={theme.name}
                  theme={theme}
                  isActive={theme.name === currentTheme}
                  onSelect={() => onThemeChange(theme)}
                  showCategory={true}
                />
              ))}
            </div>
          </TabsContent>

          {/* All Themes Tab */}
          <TabsContent value="all" className="space-y-3 sm:space-y-4">
            {/* Enhanced Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input
                placeholder="Search themes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 sm:pl-10 h-9 sm:h-10 text-xs sm:text-sm rounded-xl border-border/50 focus:border-primary"
              />
            </div>

            {/* All Themes List */}
            <div className="max-h-72 sm:max-h-80 overflow-y-auto p-4">
              <div className={cn("space-y-2")}>
                {filteredThemes.map((theme) => (
                  <ThemeOption
                    key={theme.name}
                    theme={theme}
                    isActive={theme.name === currentTheme}
                    onSelect={() => onThemeChange(theme)}
                    showCategory={true}
                  />
                ))}
              </div>

              {filteredThemes.length === 0 && (
                <div className="text-center py-8 sm:py-12 text-muted-foreground">
                  <Search className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 sm:mb-3 opacity-50" />
                  <p className="text-xs sm:text-sm font-medium">
                    No themes found
                  </p>
                  <p className="text-xs mt-1">
                    Try searching with different keywords
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeSelector;
