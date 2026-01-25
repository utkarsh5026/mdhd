import React, { useMemo, memo, useCallback } from 'react';
import { useThemeStore } from '@/components/shared/theme/store/theme-store';
import { type ThemeOption, themes } from '@/theme/themes';
import { Palette, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FiStar } from 'react-icons/fi';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SettingsHeader, ExpandableCategory } from './settings-commons';

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

// Category metadata for app themes
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

interface AppThemeSelectorProps {
  onRequestCloseSheet?: () => void;
}

const AppThemeSelector: React.FC<AppThemeSelectorProps> = ({ onRequestCloseSheet }) => {
  const { currentTheme, setTheme, isBookmarked, toggleBookmark } = useThemeStore();
  const setPendingFloatingPickerOpen = useThemeStore((state) => state.setPendingFloatingPickerOpen);

  const handleLaunchPicker = useCallback(() => {
    setPendingFloatingPickerOpen(true);
    onRequestCloseSheet?.();
  }, [setPendingFloatingPickerOpen, onRequestCloseSheet]);

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
    <div className="space-y-6 relative">
      <SettingsHeader
        icon={<Palette className="h-4 w-4 text-primary" />}
        title="App Theme"
        description="Choose your reading environment"
        rightContent={
          <div className="text-right">
            <div className="text-xs text-muted-foreground mb-1">Currently Active</div>
            <Badge variant="outline" className="text-xs px-3 py-1 bg-primary/10 border-primary/20">
              {currentTheme.name}
            </Badge>
          </div>
        }
      />

      <Button
        className="w-full justify-center gap-2 rounded-2xl border-none opacity-70 hover:opacity-100 shadow-sm hover:shadow-md"
        onClick={handleLaunchPicker}
      >
        🎨 Launch Theme Picker
      </Button>

      <ScrollArea className="max-h-full pr-2">
        <div className="space-y-2">
          {sortedCategories.map((categoryName) => {
            const categoryThemes = themesByCategory[categoryName];
            const hasActiveTheme = categoryThemes.some((t) => t.name === currentTheme.name);

            return (
              <ExpandableCategory
                key={categoryName}
                icon={CATEGORY_ICONS[categoryName] ?? '🎨'}
                title={categoryName}
                description={CATEGORY_DESCRIPTIONS[categoryName] ?? ''}
                itemCount={categoryThemes.length}
                defaultExpanded={hasActiveTheme}
                contentClassName="space-y-1"
              >
                {categoryThemes.map((theme) => (
                  <ThemePreview
                    key={theme.name}
                    theme={theme}
                    isSelected={currentTheme.name === theme.name}
                    isBookmarked={isBookmarked(theme)}
                    onClick={() => setTheme(theme)}
                    onBookmarkClick={(e) => {
                      e.stopPropagation();
                      toggleBookmark(theme);
                    }}
                  />
                ))}
              </ExpandableCategory>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default AppThemeSelector;
