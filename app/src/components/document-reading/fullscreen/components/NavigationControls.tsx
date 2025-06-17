import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationControlsProps {
  currentIndex: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
  isVisible: boolean;
}

interface NavigationButtonProps {
  onClick: () => void;
  disabled: boolean;
  icon: LucideIcon;
  rotateY: number;
  iconDirection: "left" | "right";
}

const NavigationButton: React.FC<NavigationButtonProps> = ({
  onClick,
  disabled,
  icon: Icon,
  rotateY,
  iconDirection,
}) => (
  <motion.button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "relative group touch-manipulation",
      "p-3 sm:p-3.5 lg:p-4 rounded-full",
      "transition-all duration-500 ease-out",
      "border-2 backdrop-blur-md shadow-lg",
      disabled
        ? "bg-secondary/20 border-border/30 text-mutedForeground/50 cursor-not-allowed"
        : "bg-cardBg/80 border-border/50 text-foreground hover:border-primary/50 hover:bg-primary/10 hover:text-primary hover:shadow-xl hover:shadow-primary/20"
    )}
    whileHover={
      !disabled
        ? {
            scale: 1.1,
            y: -2,
            rotateY,
          }
        : {}
    }
    whileTap={!disabled ? { scale: 0.9 } : {}}
    style={{
      transformStyle: "preserve-3d",
    }}
  >
    {/* Inner gradient layer */}
    <div
      className={cn(
        "absolute inset-1 rounded-full transition-all duration-500",
        disabled
          ? "bg-transparent"
          : "bg-gradient-to-br from-foreground/5 to-transparent group-hover:from-primary/10 group-hover:to-primary/5"
      )}
    />

    {/* Icon with enhanced styling and spring movement */}
    <motion.div
      className="relative z-10"
      whileHover={
        !disabled
          ? {
              x: iconDirection === "left" ? -3 : 3,
              scale: 1.1,
            }
          : {}
      }
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17,
      }}
    >
      <Icon
        className={cn(
          "transition-all duration-300",
          "h-5 w-5 sm:h-6 sm:w-6 lg:h-6 lg:w-6"
        )}
      />
    </motion.div>

    {/* Disabled overlay */}
    {disabled && (
      <div className="absolute inset-0 bg-secondary/10 rounded-full" />
    )}

    {/* Premium hover glow */}
    {!disabled && (
      <>
        <div className="absolute inset-0 bg-primary/10 rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-all duration-700 blur-xl" />
        <div className="absolute inset-0 bg-primary/20 rounded-full scale-125 opacity-0 group-hover:opacity-100 transition-all duration-500 blur-md" />
      </>
    )}

    {/* Active state indicator */}
    {!disabled && (
      <motion.div
        className="absolute inset-0 border-2 border-primary/30 rounded-full opacity-0 group-hover:opacity-100"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    )}
  </motion.button>
);

const NavigationControls: React.FC<NavigationControlsProps> = ({
  currentIndex,
  total,
  onPrevious,
  onNext,
  isVisible,
}) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="absolute bottom-0 left-0 right-0 z-50"
      >
        {/* Modern gradient background with sophisticated blur */}
        <div className="relative">
          {/* Content container */}
          <div className="relative flex items-center justify-center p-4 sm:p-5 lg:p-6">
            {/* Premium control group */}
            <div className="flex items-center gap-6 sm:gap-7 lg:gap-8">
              {/* Previous Button */}
              <NavigationButton
                onClick={onPrevious}
                disabled={currentIndex === 0}
                icon={ChevronLeft}
                rotateY={15}
                iconDirection="left"
              />

              {/* Modern separator with gradient */}
              <div className="relative">
                <div className="w-px h-6 sm:h-8 lg:h-10 bg-gradient-to-b from-transparent via-border to-transparent" />
                <div className="absolute inset-0 w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent blur-sm" />
              </div>

              {/* Next Button */}
              <NavigationButton
                onClick={onNext}
                disabled={currentIndex === total - 1}
                icon={ChevronRight}
                rotateY={-15}
                iconDirection="right"
              />
            </div>

            {/* Optional: Page indicator dots for mobile */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 sm:hidden">
              <div className="flex gap-2">
                {Array.from({ length: Math.min(total, 5) }).map((_, index) => {
                  const actualIndex =
                    total <= 5 ? index : Math.floor((index / 4) * (total - 1));
                  const isActive = actualIndex === currentIndex;

                  return (
                    <motion.div
                      key={index}
                      className={cn(
                        "w-1.5 h-1.5 rounded-full transition-all duration-300",
                        isActive
                          ? "bg-primary scale-125 shadow-lg shadow-primary/50"
                          : "bg-border/50"
                      )}
                      animate={isActive ? { scale: [1.25, 1.4, 1.25] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default NavigationControls;
