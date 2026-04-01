import styles from './header.module.css';
import UserMenu from './user-menu';

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card">
      <div className="px-4 sm:px-6 py-1 mx-auto">
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 sm:gap-3 ${styles.slideInLeft}`}>
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
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
