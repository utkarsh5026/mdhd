import { memo, useCallback, useMemo } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { themeCategories, ThemeOption as ThemeTypeOption } from '@/theme/themes';
import { cn } from '@/lib/utils';
import ThemeOption from './theme-option';
import { useThemeStore } from '../store/theme-store';

interface ThemeCategoriesProps {
  currentTheme: string;
  onThemeChange: (theme: ThemeTypeOption) => void;
  openCategories: Set<string>;
  toggleCategory: (categoryName: string) => void;
}

const ThemeCategories: React.FC<ThemeCategoriesProps> = memo(
  ({ currentTheme, onThemeChange, openCategories, toggleCategory }) => {
    const { allThemes } = useThemeStore();

    const themesByCategory = useMemo(() => {
      return allThemes.reduce(
        (acc, theme) => {
          if (!acc[theme.category]) {
            acc[theme.category] = [];
          }
          acc[theme.category].push(theme);
          return acc;
        },
        {} as Record<string, ThemeTypeOption[]>
      );
    }, [allThemes]);

    const handleThemeSelect = useCallback(
      (theme: ThemeTypeOption) => {
        onThemeChange(theme);
      },
      [onThemeChange]
    );
    return (
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
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 sm:gap-3 w-full px-2 sm:px-3 py-2.5 sm:py-3 rounded-xl hover:bg-secondary/50 transition-colors duration-150 group font-cascadia-code">
                  <span className="text-base sm:text-lg">{category.icon}</span>
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

              <CollapsibleContent className="mt-2 sm:mt-3">
                <div className={cn('pl-2 sm:pl-4')}>
                  {categoryThemes.map((theme) => (
                    <ThemeOption
                      key={theme.name}
                      theme={theme}
                      isActive={theme.name === currentTheme}
                      onSelect={() => handleThemeSelect(theme)}
                      showCategory={false}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    );
  }
);

ThemeCategories.displayName = 'ThemeCategories';

export default ThemeCategories;
