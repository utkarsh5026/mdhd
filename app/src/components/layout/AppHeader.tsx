import { useState, useEffect } from "react";
import { useTheme } from "@/components/shared/theme/hooks/use-theme";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, Home } from "lucide-react";
import ThemeSelector from "@/components/shared/theme/components/ThemeSelector";
import { motion } from "framer-motion";

interface AppHeaderProps {
  toggleSidebar: () => void;
  onNavigateHome: () => void;
  className?: string;
}

/**
 * AppHeader component provides a responsive navigation header with sidebar toggle
 * and theme selector positioned at opposite ends of the screen.
 *
 * This component is optimized for both mobile and desktop views, with appropriate
 * spacing and button sizes for different screen sizes.
 *
 * @param {Object} props - Component properties
 * @param {Function} props.toggleSidebar - Function to toggle the sidebar visibility
 * @param {Function} props.onNavigateHome - Function to navigate to the home page
 * @param {string} props.className - Optional additional CSS classes
 */
const AppHeader: React.FC<AppHeaderProps> = ({
  toggleSidebar,
  onNavigateHome,
  className,
}) => {
  const { currentTheme, setTheme } = useTheme();

  /**
   * State to track scroll position and direction
   *
   * @scrollPos - Stores the current scroll position of the window
   * @isScrollingDown - Boolean flag indicating if the user is scrolling down
   * @isVisible - Controls whether the header is visible or hidden
   */
  const [scrollPos, setScrollPos] = useState(0);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  /**
   * Effect hook to handle scroll events
   *
   * This effect:
   * 1. Tracks the current scroll position
   * 2. Determines scroll direction (up or down)
   * 3. Controls header visibility based on scroll behavior
   * 4. Shows header when scrolling up or near the top of the page
   * 5. Hides header when scrolling down and not at the top
   */
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      const visible = scrollPos > currentScrollPos || currentScrollPos < 10;

      setIsScrollingDown(scrollPos < currentScrollPos);
      setScrollPos(currentScrollPos);
      setIsVisible(visible);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrollPos]);

  return (
    <header
      className={cn(
        "fixed left-0 right-0 z-40 px-4 py-2 flex justify-between items-center",
        "bg-background/80 backdrop-blur-sm border-b border-border/40",
        "transition-all duration-300",
        isVisible ? "top-0" : "-top-14", // Hide header when scrolling down on mobile
        isScrollingDown ? "shadow-md" : "",
        className
      )}
    >
      {/* Left side - Menu button */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-9 w-9 rounded-full"
          aria-label="Toggle navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Home button - visible on larger screens */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onNavigateHome}
          className="hidden md:flex items-center h-9 gap-1.5"
        >
          <Home className="h-4 w-4" />
          <span className="font-cascadia-code">Home</span>
        </Button>
      </div>

      {/* App title - center on mobile, left on desktop */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
      >
        {/* Title */}
        <motion.h1
          className="text-2xl md:text-4xl font-bold mb-6 relative"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <span className="bg-gradient-to-r from-foreground via-primary/90 to-foreground bg-clip-text text-transparent">
            MDHD
          </span>

          {/* Animated underline */}
          <motion.div
            className="absolute -bottom-2 left-1/2 h-1 bg-gradient-to-r from-transparent via-primary to-transparent"
            initial={{ width: 0, x: "-50%" }}
            animate={{ width: "60%", x: "-50%" }}
            transition={{ duration: 1, delay: 1 }}
          />
        </motion.h1>
      </motion.div>

      {/* Right side - Theme selector */}
      <div>
        <ThemeSelector
          currentTheme={currentTheme.name}
          onThemeChange={setTheme}
        />
      </div>
    </header>
  );
};
export default AppHeader;
