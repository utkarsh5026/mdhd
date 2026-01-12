import React, { useState, useMemo, useCallback } from 'react';
import { useThemeStore } from '../store/theme-store';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/fast-tabs';
import { X, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ThemeCategories from './theme-categories';
import ThemesList from './themes-list';
import BookmarkedThemes from './bookmarked-themes';
import { type ThemeOption, themes } from '@/theme/themes';

const FloatingThemePicker: React.FC = () => {
  const isOpen = useThemeStore((state) => state.isFloatingPickerOpen);
  const closeFloatingPicker = useThemeStore((state) => state.closeFloatingPicker);
  const currentTheme = useThemeStore((state) => state.currentTheme);
  const setTheme = useThemeStore((state) => state.setTheme);

  const [searchQuery, setSearchQuery] = useState('');
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    () => new Set([currentTheme.category])
  );

  const filteredThemes = useMemo(
    () =>
      themes.filter(
        (theme) =>
          theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          theme.category.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [searchQuery]
  );

  const toggleCategory = useCallback((categoryName: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryName)) {
        next.delete(categoryName);
      } else {
        next.add(categoryName);
      }
      return next;
    });
  }, []);

  const handleThemeChange = useCallback(
    (theme: ThemeOption) => {
      setTheme(theme);
    },
    [setTheme]
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Semi-transparent backdrop - allows seeing content behind */}
      <div
        className="fixed inset-0 bg-black/30 z-[60] transition-opacity"
        onClick={closeFloatingPicker}
      />

      {/* Floating picker panel - positioned at bottom for mobile */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-[61]',
          'bg-card border-t border-border rounded-t-3xl shadow-2xl',
          'h-[70vh] overflow-hidden flex flex-col',
          'animate-in slide-in-from-bottom duration-300',
          'font-cascadia-code'
        )}
      >
        {/* Drag handle indicator */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold text-base">Choose Theme</h3>
              <p className="text-xs text-muted-foreground">
                Preview changes in real-time
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-8 w-8"
            onClick={closeFloatingPicker}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Tabs - reuse existing components */}
        <div className="overflow-y-auto flex-1 p-4">
          <Tabs defaultValue="categories" className="w-full">
            <TabsList className="w-full mb-4 h-10 rounded-xl bg-muted/50">
              <TabsTrigger value="categories" className="text-sm flex-1">
                Categories
              </TabsTrigger>
              <TabsTrigger value="bookmarked" className="text-sm flex-1">
                Bookmarked
              </TabsTrigger>
              <TabsTrigger value="all" className="text-sm flex-1">
                All
              </TabsTrigger>
            </TabsList>

            <TabsContent value="categories" className="max-h-80 overflow-y-auto">
              <ThemeCategories
                currentTheme={currentTheme.name}
                onThemeChange={handleThemeChange}
                openCategories={openCategories}
                toggleCategory={toggleCategory}
              />
            </TabsContent>

            <TabsContent value="bookmarked" className="max-h-80 overflow-y-auto">
              <BookmarkedThemes onThemeChange={handleThemeChange} />
            </TabsContent>

            <TabsContent value="all">
              <ThemesList
                currentTheme={currentTheme.name}
                onThemeChange={handleThemeChange}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filteredThemes={filteredThemes}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default FloatingThemePicker;
