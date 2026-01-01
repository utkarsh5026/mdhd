import React, { useState, useMemo, useCallback, memo } from 'react';
import { useThemeStore } from '@/components/shared/theme/store/theme-store';
import { type ThemeOption, themes } from '@/theme/themes';
import { Palette, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { FiStar } from 'react-icons/fi';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ThemePreviewProps {
  theme: ThemeOption;
  isSelected: boolean;
  isBookmarked: boolean;
  onClick: () => void;
  onBookmarkClick: (e: React.MouseEvent) => void;
}

const ThemePreview = memo<ThemePreviewProps>(
  ({ theme, isSelected, isBookmarked, onClick, onBookmarkClick }) => {
    const gradientStyle = useMemo(
      () => ({
        background: `linear-gradient(135deg, ${theme.background} 0%, ${theme.primary} 100%)`,
      }),
      [theme.background, theme.primary]
    );

    return (
      <button
        className={cn(
          'flex items-center w-full rounded-2xl py-2.5 px-3 text-left transition-all duration-200',
          'hover:scale-[1.01] group font-cascadia-code',
          isSelected
            ? 'bg-primary/10 border border-primary/30 shadow-sm'
            : 'hover:bg-secondary/40 hover:shadow-sm border border-transparent'
        )}
        onClick={onClick}
      >
        <div className="flex items-center gap-3 w-full">
          {/* Color preview */}
          <div className="relative shrink-0">
            <div
              className="w-8 h-8 rounded-full border-none shadow-sm group-hover:shadow-md transition-shadow"
              style={gradientStyle}
            />
          </div>

          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-foreground truncate block">{theme.name}</span>
          </div>

          {/* Bookmark button */}
          <button
            onClick={onBookmarkClick}
            className={cn(
              'flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 shrink-0',
              'hover:scale-110 hover:bg-secondary/60',
              isBookmarked
                ? 'text-yellow-500 hover:text-yellow-400'
                : 'text-muted-foreground hover:text-foreground'
            )}
            aria-label={isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
          >
            <FiStar
              className={cn(
                'w-4 h-4 transition-all duration-200',
                isBookmarked ? 'fill-current' : ''
              )}
            />
          </button>

          {/* Active checkmark */}
          {isSelected && (
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary shrink-0">
              <Check className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
          )}
        </div>
      </button>
    );
  }
);

ThemePreview.displayName = 'ThemePreview';

interface ThemeCategoryProps {
  categoryName: string;
  categoryThemes: ThemeOption[];
  currentTheme: ThemeOption;
  setTheme: (theme: ThemeOption) => void;
  isBookmarked: (theme: ThemeOption) => boolean;
  toggleBookmark: (theme: ThemeOption) => void;
}

// Memoize category metadata outside component to avoid recreation
const CATEGORY_ICONS: Record<string, string> = {
  'Modern Dark': '🌙',
  'Modern Light': '☀️',
  Developer: '💻',
  Minimal: '✨',
  Focus: '🎯',
  'High Contrast': '👁️',
  'Nature & Warm': '🌿',
  'Soft & Pastel': '🎨',
  Creative: '🌈',
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'Modern Dark': 'Sleek dark themes from popular apps',
  'Modern Light': 'Clean and bright for daytime reading',
  Developer: 'Inspired by popular code editors',
  Minimal: 'Simple and distraction-free',
  Focus: 'Designed for deep reading sessions',
  'High Contrast': 'Enhanced visibility and accessibility',
  'Nature & Warm': 'Earthy tones and warm colors',
  'Soft & Pastel': 'Gentle and easy on the eyes',
  Creative: 'Bold and expressive color palettes',
};

const ThemeCategory = memo<ThemeCategoryProps>(
  ({ categoryName, categoryThemes, currentTheme, setTheme, isBookmarked, toggleBookmark }) => {
    const hasActiveTheme = categoryThemes.some((t) => t.name === currentTheme.name);
    const [expanded, setExpanded] = useState(hasActiveTheme);

    const toggleExpanded = useCallback(() => setExpanded((prev) => !prev), []);
    const handleThemeClick = useCallback((theme: ThemeOption) => setTheme(theme), [setTheme]);

    const handleBookmarkClick = useCallback(
      (e: React.MouseEvent, theme: ThemeOption) => {
        e.stopPropagation();
        toggleBookmark(theme);
      },
      [toggleBookmark]
    );

    return (
      <div className="mb-4 border border-border/30 rounded-2xl overflow-hidden bg-card/50 backdrop-blur-sm">
        <button
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary/5 transition-all duration-200 border-b border-border/20"
          onClick={toggleExpanded}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">{CATEGORY_ICONS[categoryName] ?? '🎨'}</span>
            <div className="text-left">
              <div className="font-semibold text-sm">{categoryName}</div>
              <div className="text-xs text-muted-foreground">
                {CATEGORY_DESCRIPTIONS[categoryName] ?? ''}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs px-2 py-1 bg-primary/10">
              {categoryThemes.length}
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
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="p-3 space-y-1">
                {categoryThemes.map((theme) => (
                  <ThemePreview
                    key={theme.name}
                    theme={theme}
                    isSelected={currentTheme.name === theme.name}
                    isBookmarked={isBookmarked(theme)}
                    onClick={() => handleThemeClick(theme)}
                    onBookmarkClick={(e) => handleBookmarkClick(e, theme)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

ThemeCategory.displayName = 'ThemeCategory';

const AppThemeSelector: React.FC = () => {
  const { currentTheme, setTheme, isBookmarked, toggleBookmark } = useThemeStore();

  const themesByCategory = useMemo(() => {
    const grouped: Record<string, ThemeOption[]> = {};
    for (const theme of themes) {
      if (!grouped[theme.category]) {
        grouped[theme.category] = [];
      }
      grouped[theme.category].push(theme);
    }
    return grouped;
  }, []);

  // Define category order
  const categoryOrder = [
    'Modern Dark',
    'Modern Light',
    'Developer',
    'Minimal',
    'Focus',
    'High Contrast',
    'Nature & Warm',
    'Soft & Pastel',
    'Creative',
  ];

  const sortedCategories = categoryOrder.filter((cat) => themesByCategory[cat]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border/20">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Palette className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-base">App Theme</h3>
            <p className="text-sm text-muted-foreground">Choose your reading environment</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground mb-1">Currently Active</div>
          <Badge variant="outline" className="text-xs px-3 py-1 bg-primary/10 border-primary/20">
            {currentTheme.name}
          </Badge>
        </div>
      </div>

      <ScrollArea className="max-h-125 pr-2">
        <div className="space-y-2">
          {sortedCategories.map((categoryName) => (
            <ThemeCategory
              key={categoryName}
              categoryName={categoryName}
              categoryThemes={themesByCategory[categoryName]}
              currentTheme={currentTheme}
              setTheme={setTheme}
              isBookmarked={isBookmarked}
              toggleBookmark={toggleBookmark}
            />
          ))}
        </div>
      </ScrollArea>

      <div className="pt-4 border-t border-border/20">
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-xl">
          <Palette className="w-4 h-4 shrink-0" />
          <span>Theme changes apply instantly. Star your favorites for quick access.</span>
        </div>
      </div>
    </div>
  );
};

export default AppThemeSelector;
