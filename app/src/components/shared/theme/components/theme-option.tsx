import React from 'react';
import type { ThemeOption as ThemeTypeOption } from '@/theme/themes';
import { cn } from '@/lib/utils';
import { FiCheck, FiStar } from 'react-icons/fi';
import { useThemeStore } from '@/components/shared/theme/store/theme-store';

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
const ThemeOption: React.FC<ThemeOptionProps> = ({
  theme,
  isActive,
  onSelect,
  showCategory = false,
  showBookmark = true,
}) => {
  const toggleBookmark = useThemeStore((state) => state.toggleBookmark);
  const isBookmarked = useThemeStore((state) => state.isBookmarked);

  const bookmarked = isBookmarked(theme);

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent theme selection when clicking bookmark
    toggleBookmark(theme);
  };

  return (
    <button
      className={cn(
        'flex items-center w-full rounded-2xl py-2.5 sm:py-3 px-3 sm:px-4 text-left transition-all duration-200',
        'hover:scale-[1.01] group font-cascadia-code',
        isActive
          ? 'bg-primary/10 border border-primary/30 shadow-sm'
          : 'hover:bg-secondary/40 hover:shadow-sm'
      )}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2.5 sm:gap-3 w-full">
        <div className="relative shrink-0">
          <div
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-none shadow-sm group-hover:shadow-md transition-shadow"
            style={{
              background: `linear-gradient(135deg, ${theme.background} 0%, ${theme.primary} 100%)`,
            }}
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
              'flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full transition-all duration-200 shrink-0',
              'hover:scale-110 hover:bg-secondary/60',
              bookmarked
                ? 'text-yellow-500 hover:text-yellow-400'
                : 'text-muted-foreground hover:text-foreground'
            )}
            aria-label={bookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
          >
            <FiStar
              className={cn(
                'w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-200',
                bookmarked ? 'fill-current' : ''
              )}
            />
          </button>
        )}

        {isActive && (
          <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary shrink-0">
            <FiCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary-foreground" />
          </div>
        )}
      </div>
    </button>
  );
};

export default ThemeOption;
