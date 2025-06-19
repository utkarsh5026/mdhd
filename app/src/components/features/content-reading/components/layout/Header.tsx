import { AnimatePresence, motion } from "framer-motion";
import { X, Settings, List, LucideIcon, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface HeaderProps {
  onExit: () => void;
  onSettings: () => void;
  onMenu: () => void;
  onChat: () => void;
  isVisible: boolean;
}

interface AnimatedButtonProps {
  onClick: () => void;
  icon: LucideIcon;
  variant?: "danger" | "primary";
  animation?: {
    rotateZ?: number;
    rotateY?: number;
  };
  tooltip: string;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  onClick,
  icon: Icon,
  variant = "primary",
  animation = {},
  tooltip,
}) => {
  const colors = {
    danger: {
      hover:
        "hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 hover:shadow-red-500/20",
      gradient: "group-hover:from-red-500/10 group-hover:to-red-500/5",
      glow: "bg-red-500/10",
      glowStrong: "bg-red-500/20",
      border: "border-red-500/30",
    },
    primary: {
      hover:
        "hover:border-primary/50 hover:bg-primary/10 hover:text-primary hover:shadow-primary/20",
      gradient: "group-hover:from-primary/10 group-hover:to-primary/5",
      glow: "bg-primary/10",
      glowStrong: "bg-primary/20",
      border: "border-primary/30",
    },
  };

  const colorScheme = colors[variant];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          onClick={onClick}
          className={cn(
            "relative group touch-manipulation",
            "p-3 sm:p-3.5 lg:p-4 rounded-full",
            "transition-all duration-500 ease-out",
            "border-2 backdrop-blur-md shadow-lg",
            "bg-cardBg/80 border-border/50 text-foreground",
            colorScheme.hover,
            "hover:shadow-xl"
          )}
          whileHover={{
            scale: 1.1,
            y: -2,
            ...animation,
          }}
          whileTap={{ scale: 0.9 }}
          style={{
            transformStyle: "preserve-3d",
          }}
        >
          {/* Inner gradient layer */}
          <div
            className={cn(
              "absolute inset-1 rounded-full transition-all duration-500",
              "bg-gradient-to-br from-foreground/5 to-transparent",
              colorScheme.gradient
            )}
          />

          {/* Icon with enhanced styling */}
          <Icon
            className={cn(
              "relative z-10 transition-all duration-300",
              "h-5 w-5 sm:h-6 sm:w-6 lg:h-6 lg:w-6",
              "group-hover:scale-110"
            )}
          />

          {/* Premium hover glow */}
          <div
            className={cn(
              "absolute inset-0 rounded-full scale-150 opacity-0",
              "group-hover:opacity-100 transition-all duration-700 blur-xl",
              colorScheme.glow
            )}
          />
          <div
            className={cn(
              "absolute inset-0 rounded-full scale-125 opacity-0",
              "group-hover:opacity-100 transition-all duration-500 blur-md",
              colorScheme.glowStrong
            )}
          />

          {/* Active state indicator */}
          <motion.div
            className={cn(
              "absolute inset-0 border-2 rounded-full opacity-0 group-hover:opacity-100",
              colorScheme.border
            )}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        sideOffset={8}
        className="font-cascadia-code text-xs rounded-2xl backdrop-blur-2xl bg-background/20 text-primary"
      >
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
};

const Header: React.FC<HeaderProps> = ({
  onExit,
  onSettings,
  onMenu,
  onChat,
  isVisible,
}) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.9 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative w-full z-50"
      >
        {/* Modern gradient background with sophisticated blur */}
        <div className="relative">
          {/* Content container */}
          <div className="relative flex items-center justify-between p-4 sm:p-5 lg:p-6">
            {/* Exit Button - Left Side */}
            <AnimatedButton
              onClick={onExit}
              icon={X}
              variant="danger"
              animation={{ rotateZ: 90 }}
              tooltip="Exit Reading Mode"
            />

            {/* Action Buttons - Right Side */}
            <div className="flex items-center gap-3 sm:gap-3.5 lg:gap-4">
              {/* Chat Button */}
              <AnimatedButton
                onClick={onChat}
                icon={MessageCircle}
                variant="primary"
                animation={{ rotateZ: 180, rotateY: 180 }}
                tooltip="Open Chat"
              />

              {/* Settings Button */}
              <AnimatedButton
                onClick={onSettings}
                icon={Settings}
                animation={{ rotateZ: 180 }}
                tooltip="Reading Settings"
              />

              {/* Modern separator */}
              <div className="relative">
                <div className="w-px h-6 sm:h-8 lg:h-10 bg-gradient-to-b from-transparent via-border to-transparent" />
                <div className="absolute inset-0 w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent blur-sm" />
              </div>

              {/* Menu Button */}
              <AnimatedButton
                onClick={onMenu}
                icon={List}
                animation={{ rotateY: 180 }}
                tooltip="Table of Contents"
              />
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
