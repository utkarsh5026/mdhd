import { Hash, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FaGithub } from 'react-icons/fa';
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
              <FaGithub className="w-4 h-4" />
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
