import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ThemeOption as ThemeTypeOption } from '@/theme/themes';
import ThemeOption from './theme-option';

interface ThemesListProps {
  currentTheme: string;
  onThemeChange: (theme: ThemeTypeOption) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredThemes: ThemeTypeOption[];
}
const ThemesList: React.FC<ThemesListProps> = ({
  currentTheme,
  onThemeChange,
  searchQuery,
  setSearchQuery,
  filteredThemes,
}) => {
  return (
    <div className="space-y-3 sm:space-y-4">
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
        <div className={cn('space-y-2')}>
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
            <p className="text-xs sm:text-sm font-medium">No themes found</p>
            <p className="text-xs mt-1">Try searching with different keywords</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThemesList;
