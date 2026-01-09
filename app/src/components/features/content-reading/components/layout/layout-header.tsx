import { X, Settings, List, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface HeaderProps {
  onExit: () => void;
  onSettings: () => void;
  onMenu: () => void;
  isVisible: boolean;
}

interface AnimatedButtonProps {
  onClick: () => void;
  icon: LucideIcon;
  variant?: 'danger' | 'primary';
  tooltip: string;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  onClick,
  icon: Icon,
  variant = 'primary',
  tooltip,
}) => {
  const variantStyles = {
    danger: 'hover:text-red-400',
    primary: 'hover:text-primary',
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            'relative group touch-manipulation',
            'p-3 sm:p-3.5 lg:p-4 rounded-full',
            'transition-all duration-300 ease-out',
            'border-2 backdrop-blur-md shadow-lg',
            'bg-cardBg/80 border-border/50 text-foreground',
            'hover:border-border hover:bg-cardBg/90',
            'hover:shadow-xl hover:scale-105 hover:-translate-y-0.5',
            'active:scale-95',
            variantStyles[variant]
          )}
        >
          {/* Icon */}
          <Icon
            className={cn(
              'relative z-10 transition-all duration-300',
              'h-5 w-5 sm:h-6 sm:w-6 lg:h-6 lg:w-6',
              'group-hover:scale-110'
            )}
          />
        </button>
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

const Header: React.FC<HeaderProps> = ({ onExit, onSettings, onMenu, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div
      className={cn('relative w-full z-50', 'animate-in fade-in slide-in-from-top-4 duration-500')}
    >
      {/* Modern gradient background with sophisticated blur */}
      <div className="relative">
        {/* Content container */}
        <div className="relative flex items-center justify-between p-4 sm:p-5 lg:p-6">
          <AnimatedButton onClick={onExit} icon={X} variant="danger" tooltip="Exit Reading Mode" />

          <div className="flex items-center gap-3 sm:gap-3.5 lg:gap-4">
            <AnimatedButton onClick={onSettings} icon={Settings} tooltip="Reading Settings" />

            <div className="relative">
              <div className="w-px h-6 sm:h-8 lg:h-10 bg-gradient-to-b from-transparent via-border to-transparent" />
              <div className="absolute inset-0 w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent blur-sm" />
            </div>

            <AnimatedButton onClick={onMenu} icon={List} tooltip="Table of Contents" />
          </div>

          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 sm:hidden">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-cardBg/90 border border-border/50 rounded-full backdrop-blur-md">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-xs text-mutedForeground font-medium">Reading Mode</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
