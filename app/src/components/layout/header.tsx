import { Hash, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

import ThemeSelector from '../shared/theme/components/theme-selector';
import { useTheme } from '@/hooks';
import styles from './header.module.css';

const Header = () => {
  const { currentTheme, setTheme } = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-2xl" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-border to-transparent" />

      <div className="relative px-6 py-1 mx-auto">
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-3 ${styles.slideInLeft}`}>
            <div className={`relative group ${styles.logoContainer}`}>
              <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg group-hover:bg-primary/30 transition-colors duration-300" />
              <div className="relative w-7 h-7 bg-linear-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25">
                <Hash className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xl font-bold bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                MDHD
              </span>
            </div>
          </div>

          <div className={`flex items-center gap-2 ${styles.slideInRight}`}>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200"
              onClick={() => window.open('https://github.com/utkarsh5026/mdhd', '_blank')}
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              <span className="hidden sm:inline text-sm">GitHub</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-all duration-200"
              onClick={() => window.open('https://github.com/utkarsh5026/mdhd', '_blank')}
            >
              <Star className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Star</span>
            </Button>

            <div className="w-px h-6 bg-border/50 mx-1" />

            <ThemeSelector currentTheme={currentTheme.name} onThemeChange={setTheme} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
