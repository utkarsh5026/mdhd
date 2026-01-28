import React, { memo, useCallback, useMemo } from 'react';
import type { ThemeOption as ThemeTypeOption } from '@/theme/themes';
import { cn } from '@/lib/utils';
import { Check, Star } from 'lucide-react';
import { useBookmarkedThemes } from '@/components/shared/theme/store/theme-store';

interface ThemeOptionProps {
  theme: ThemeTypeOption;
  isActive: boolean;
  onSelect: () => void;
  showCategory?: boolean;
  showBookmark?: boolean;
}

/**
 * 🎨 Modern theme option with improved spacing and visual design
 */
const ThemeOption: React.FC<ThemeOptionProps> = memo(
  ({ theme, isActive, onSelect, showCategory = false, showBookmark = true }) => {
    const { bookmarkedThemes, toggleBookmark } = useBookmarkedThemes()

    const bookmarked = useMemo(
      () => bookmarkedThemes.some((b) => b.name === theme.name),
      [bookmarkedThemes, theme.name]
    );

    const handleBookmarkClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleBookmark(theme);
      },
      [toggleBookmark, theme]
    );

    const gradientStyle = useMemo(
      () => ({
        background: `linear-gradient(135deg, ${theme.background} 0%, ${theme.primary} 100%)`,
      }),
      [theme.background, theme.primary]
    );

    return (
      <button
        className={cn(
          'flex items-center w-full rounded-2xl py-2.5 sm:py-3 px-3 sm:px-4 text-left',
          'transition-colors duration-150 group font-cascadia-code',
          isActive
            ? 'bg-primary/10 border border-primary/30 shadow-sm'
            : 'hover:bg-secondary/40 hover:shadow-sm'
        )}
        onClick={onSelect}
      >
        <div className="flex items-center gap-2.5 sm:gap-3 w-full">
          <div className="relative shrink-0">
            <div
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-none shadow-sm"
              style={gradientStyle}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-medium text-foreground truncate">
                {theme.name}
              </span>
              {showCategory && (
                <span className="text-xs px-1.5 sm:px-2 py-0.5 rounded-md bg-muted text-muted-foreground shrink-0 font-medium">
                  {theme.category}
                </span>
              )}
            </div>
          </div>

          {showBookmark && (
            <button
              onClick={handleBookmarkClick}
              className={cn(
                'flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full transition-colors duration-150 shrink-0',
                'hover:bg-secondary/60',
                bookmarked
                  ? 'text-yellow-500 hover:text-yellow-400'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={bookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
            >
              <Star
                className={cn('w-3.5 h-3.5 sm:w-4 sm:h-4', bookmarked ? 'fill-current' : '')}
              />
            </button>
          )}

          {isActive && (
            <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary shrink-0">
              <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary-foreground" />
            </div>
          )}
        </div>
      </button>
    );
  }
);

ThemeOption.displayName = 'ThemeOption';

export default ThemeOption;
