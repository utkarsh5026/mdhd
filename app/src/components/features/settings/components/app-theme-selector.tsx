import { Check, Palette, Star } from 'lucide-react';
import React, { memo, useCallback, useEffect, useMemo } from 'react';

import { useThemeStore } from '@/components/shared/theme/store/theme-store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { type ThemeOption } from '@/theme/themes';

import { ExpandableCategory, SettingsHeader } from './settings-commons';

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

interface ThemePreviewProps {
  theme: ThemeOption;
  isSelected: boolean;
  isBookmarked: boolean;
  onClick: () => void;
  onBookmarkClick: (e: React.MouseEvent) => void;
}

const ThemePreview = memo<ThemePreviewProps>(
  ({ theme, isSelected, isBookmarked, onClick, onBookmarkClick }) => {
    return (
      <button
        className={cn(
          'flex items-center w-full rounded-lg py-2 px-2.5 text-left transition-colors duration-150 group',
          isSelected
            ? 'bg-primary/10 text-foreground'
            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
        )}
        onClick={onClick}
      >
        <div className="flex flex-col shrink-0 rounded-md overflow-hidden mr-2.5 w-5 h-7">
          <div className="flex-[3]" style={{ background: theme.background }} />
          <div className="flex-[2]" style={{ background: theme.primary }} />
          <div className="flex-1" style={{ background: theme.foreground ?? theme.primary }} />
        </div>
        <span className="flex-1 min-w-0 text-xs truncate">{theme.name}</span>
        <button
          onClick={onBookmarkClick}
          className={cn(
            'opacity-0 group-hover:opacity-100 flex items-center justify-center w-5 h-5 shrink-0 transition-opacity',
            isBookmarked ? 'opacity-100 text-yellow-500' : 'text-muted-foreground'
          )}
          aria-label={isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
        >
          <Star className={cn('w-3 h-3', isBookmarked ? 'fill-current' : '')} />
        </button>
        {isSelected && <Check className="w-3 h-3 text-primary shrink-0 ml-1" />}
      </button>
    );
  }
);

ThemePreview.displayName = 'ThemePreview';

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
  const { currentTheme, setTheme, isBookmarked, toggleBookmark, allThemes, loadThemes } =
    useThemeStore();
  const setPendingFloatingPickerOpen = useThemeStore((state) => state.setPendingFloatingPickerOpen);

  useEffect(() => {
    loadThemes();
  }, [loadThemes]);

  const handleLaunchPicker = useCallback(() => {
    setPendingFloatingPickerOpen(true);
    onRequestCloseSheet?.();
  }, [setPendingFloatingPickerOpen, onRequestCloseSheet]);

  const themesByCategory = useMemo(() => {
    const grouped: Record<string, ThemeOption[]> = {};
    for (const theme of allThemes) {
      if (!grouped[theme.category]) {
        grouped[theme.category] = [];
      }
      grouped[theme.category].push(theme);
    }
    return grouped;
  }, [allThemes]);

  const sortedCategories = categoryOrder.filter((cat) => themesByCategory[cat]);

  return (
    <div className="space-y-6 relative">
      <SettingsHeader
        icon={<Palette className="h-4 w-4 text-primary" />}
        title="App Theme"
        description="Choose your reading environment"
      />

      {/* Active theme callout */}
      <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-border/30 bg-muted/20">
        <div
          className="w-10 h-10 rounded-xl shrink-0 shadow-sm"
          style={{
            background: `linear-gradient(135deg, ${currentTheme.background} 0%, ${currentTheme.primary} 100%)`,
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Active Theme
          </div>
          <div className="text-sm font-semibold text-foreground mt-0.5 truncate">
            {currentTheme.name}
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 rounded-xl text-xs h-8 px-3 border-border/40"
          onClick={handleLaunchPicker}
        >
          🎨 Picker
        </Button>
      </div>

      <div className="space-y-2.5">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
          All Themes
        </div>
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
                  contentClassName="space-y-1 pt-1"
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
    </div>
  );
};

export default AppThemeSelector;
