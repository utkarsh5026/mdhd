import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/fast-tabs';
import { type ThemeOption as ThemeTypeOption, themes } from '@/theme/themes';
import { Palette } from 'lucide-react';
import ThemeCategories from './theme-categories';
import ThemesList from './themes-list';
import BookmarkedThemes from './bookmarked-themes';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(['Modern Dark']));

  const filteredThemes = useMemo(
    () =>
      themes.filter(
        (theme) =>
          theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          theme.category.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [searchQuery]
  );

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
          className={cn('h-9 w-9 rounded-xl', className)}
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
            <TabsTrigger value="categories" className="text-xs sm:text-sm px-2 sm:px-4 font-medium">
              <span className="hidden sm:inline">🗂️ Categories</span>
              <span className="sm:hidden">🗂️</span>
            </TabsTrigger>
            <TabsTrigger value="bookmarked" className="text-xs sm:text-sm px-2 sm:px-4 font-medium">
              <span className="hidden sm:inline">⭐ Bookmarked</span>
              <span className="sm:hidden">⭐</span>
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs sm:text-sm px-2 sm:px-4 font-medium">
              <span className="hidden sm:inline">🌈 All Themes</span>
              <span className="sm:hidden">🌈</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="categories"
            className="max-h-80 sm:max-h-96 overflow-y-auto pr-1 sm:pr-2"
          >
            <ThemeCategories
              currentTheme={currentTheme}
              onThemeChange={onThemeChange}
              openCategories={openCategories}
              toggleCategory={toggleCategory}
            />
          </TabsContent>

          <TabsContent
            value="bookmarked"
            className="max-h-80 sm:max-h-96 overflow-y-auto pr-1 sm:pr-2"
          >
            <BookmarkedThemes onThemeChange={onThemeChange} />
          </TabsContent>

          <TabsContent value="all" className="space-y-3 sm:space-y-4">
            <ThemesList
              currentTheme={currentTheme}
              onThemeChange={onThemeChange}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filteredThemes={filteredThemes}
            />
          </TabsContent>
        </Tabs>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeSelector;
