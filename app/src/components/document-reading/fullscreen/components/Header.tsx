import { AnimatePresence, motion } from "framer-motion";
import { X, Settings, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onExit: () => void;
  onSettings: () => void;
  onMenu: () => void;
  isVisible: boolean;
}

const Header: React.FC<HeaderProps> = ({
  onExit,
  onSettings,
  onMenu,
  isVisible,
}) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.9 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="absolute top-0 left-0 right-0 z-50"
      >
        {/* Modern gradient background with sophisticated blur */}
        <div className="relative">
          {/* Multi-layer background */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 via-secondary/10 to-transparent" />
          <div className="absolute inset-0 backdrop-blur-xl" />

          {/* Content container */}
          <div className="relative flex items-center justify-between p-4 sm:p-6 lg:p-8">
            {/* Exit Button - Left Side */}
            <motion.button
              onClick={onExit}
              className={cn(
                "relative group touch-manipulation",
                "p-3 sm:p-4 lg:p-5 rounded-full",
                "transition-all duration-500 ease-out",
                "border-2 backdrop-blur-md shadow-lg",
                "bg-cardBg/80 border-border/50 text-foreground",
                "hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400",
                "hover:shadow-xl hover:shadow-red-500/20"
              )}
              whileHover={{
                scale: 1.1,
                y: -2,
                rotateZ: 90,
              }}
              whileTap={{ scale: 0.9 }}
              style={{
                transformStyle: "preserve-3d",
              }}
            >
              {/* Inner gradient layer */}
              <div className="absolute inset-1 rounded-full transition-all duration-500 bg-gradient-to-br from-foreground/5 to-transparent group-hover:from-red-500/10 group-hover:to-red-500/5" />

              {/* Icon with enhanced styling */}
              <X
                className={cn(
                  "relative z-10 transition-all duration-300",
                  "h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7",
                  "group-hover:scale-110"
                )}
              />

              {/* Premium hover glow */}
              <div className="absolute inset-0 bg-red-500/10 rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-all duration-700 blur-xl" />
              <div className="absolute inset-0 bg-red-500/20 rounded-full scale-125 opacity-0 group-hover:opacity-100 transition-all duration-500 blur-md" />

              {/* Active state indicator */}
              <motion.div
                className="absolute inset-0 border-2 border-red-500/30 rounded-full opacity-0 group-hover:opacity-100"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.button>

            {/* Action Buttons - Right Side */}
            <div className="flex items-center gap-3 sm:gap-4 lg:gap-5">
              {/* Settings Button */}
              <motion.button
                onClick={onSettings}
                className={cn(
                  "relative group touch-manipulation",
                  "p-3 sm:p-4 lg:p-5 rounded-full",
                  "transition-all duration-500 ease-out",
                  "border-2 backdrop-blur-md shadow-lg",
                  "bg-cardBg/80 border-border/50 text-foreground",
                  "hover:border-primary/50 hover:bg-primary/10 hover:text-primary",
                  "hover:shadow-xl hover:shadow-primary/20"
                )}
                whileHover={{
                  scale: 1.1,
                  y: -2,
                  rotateZ: 180,
                }}
                whileTap={{ scale: 0.9 }}
                style={{
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Inner gradient layer */}
                <div className="absolute inset-1 rounded-full transition-all duration-500 bg-gradient-to-br from-foreground/5 to-transparent group-hover:from-primary/10 group-hover:to-primary/5" />

                {/* Icon with enhanced styling */}
                <Settings
                  className={cn(
                    "relative z-10 transition-all duration-300",
                    "h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7",
                    "group-hover:scale-110"
                  )}
                />

                {/* Premium hover glow */}
                <div className="absolute inset-0 bg-primary/10 rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-all duration-700 blur-xl" />
                <div className="absolute inset-0 bg-primary/20 rounded-full scale-125 opacity-0 group-hover:opacity-100 transition-all duration-500 blur-md" />

                {/* Active state indicator */}
                <motion.div
                  className="absolute inset-0 border-2 border-primary/30 rounded-full opacity-0 group-hover:opacity-100"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.button>

              {/* Modern separator */}
              <div className="relative">
                <div className="w-px h-6 sm:h-8 lg:h-10 bg-gradient-to-b from-transparent via-border to-transparent" />
                <div className="absolute inset-0 w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent blur-sm" />
              </div>

              {/* Menu Button */}
              <motion.button
                onClick={onMenu}
                className={cn(
                  "relative group touch-manipulation",
                  "p-3 sm:p-4 lg:p-5 rounded-full",
                  "transition-all duration-500 ease-out",
                  "border-2 backdrop-blur-md shadow-lg",
                  "bg-cardBg/80 border-border/50 text-foreground",
                  "hover:border-primary/50 hover:bg-primary/10 hover:text-primary",
                  "hover:shadow-xl hover:shadow-primary/20"
                )}
                whileHover={{
                  scale: 1.1,
                  y: -2,
                  rotateY: 180,
                }}
                whileTap={{ scale: 0.9 }}
                style={{
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Inner gradient layer */}
                <div className="absolute inset-1 rounded-full transition-all duration-500 bg-gradient-to-br from-foreground/5 to-transparent group-hover:from-primary/10 group-hover:to-primary/5" />

                {/* Icon with enhanced styling */}
                <List
                  className={cn(
                    "relative z-10 transition-all duration-300",
                    "h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7",
                    "group-hover:scale-110"
                  )}
                />

                {/* Premium hover glow */}
                <div className="absolute inset-0 bg-primary/10 rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-all duration-700 blur-xl" />
                <div className="absolute inset-0 bg-primary/20 rounded-full scale-125 opacity-0 group-hover:opacity-100 transition-all duration-500 blur-md" />

                {/* Active state indicator */}
                <motion.div
                  className="absolute inset-0 border-2 border-primary/30 rounded-full opacity-0 group-hover:opacity-100"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.button>
            </div>

            {/* Optional: Mobile breadcrumb indicator */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 sm:hidden">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-cardBg/90 border border-border/50 rounded-full backdrop-blur-md">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-xs text-mutedForeground font-medium">
                  Reading Mode
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default Header;
