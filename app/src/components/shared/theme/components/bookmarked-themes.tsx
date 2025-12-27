import { cn } from "@/lib/utils";
import { ThemeOption as ThemeTypeOption } from "@/theme/themes";
import { Star } from "lucide-react";
import ThemeOption from "./theme-option";
import { useThemeStore } from "@/components/shared/theme/store/theme-store";

interface BookmarkedThemesProps {
  onThemeChange: (theme: ThemeTypeOption) => void;
}

const BookmarkedThemes: React.FC<BookmarkedThemesProps> = ({
  onThemeChange,
}) => {
  const bookmarkedThemes = useThemeStore((state) => state.bookmarkedThemes);
  const currentTheme = useThemeStore((state) => state.currentTheme);

  return (
    <div className={cn("space-y-2")}>
      {bookmarkedThemes.length > 0 ? (
        bookmarkedThemes.map((theme) => (
          <ThemeOption
            key={theme.name}
            theme={theme}
            isActive={theme.name === currentTheme.name}
            onSelect={() => onThemeChange(theme)}
            showCategory={true}
          />
        ))
      ) : (
        <div className="text-center py-8 sm:py-12 text-muted-foreground">
          <Star className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 sm:mb-3 opacity-50" />
          <p className="text-xs sm:text-sm font-medium">
            No bookmarked themes yet
          </p>
          <p className="text-xs mt-1">
            Click the star icon on any theme to bookmark it
          </p>
        </div>
      )}
    </div>
  );
};

export default BookmarkedThemes;
