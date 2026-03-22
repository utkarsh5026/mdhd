import { Menu } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks';

import ThemeSelector from '../shared/theme/components/theme-selector';
import styles from './header.module.css';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

const Header = ({ onToggleSidebar }: HeaderProps) => {
  const { currentTheme, setTheme } = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card">
      <div className="px-4 sm:px-6 py-1 mx-auto">
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 sm:gap-3 ${styles.slideInLeft}`}>
            {onToggleSidebar && (
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-8 w-8 text-muted-foreground"
                onClick={onToggleSidebar}
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
            <div className={`relative group ${styles.logoContainer}`}>
              <div className="relative w-7 h-7 rounded-md flex items-center justify-center overflow-hidden">
                <img
                  src="/apple-touch-icon.png"
                  alt="MDHD Logo"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-foreground">MDHD</span>
            </div>
          </div>

          <div className={`flex items-center gap-2 ${styles.slideInRight}`}>
            <ThemeSelector currentTheme={currentTheme.name} onThemeChange={setTheme} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
