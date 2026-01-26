import { X, Settings, List, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TooltipButton } from '@/components/shared/ui/tooltip-button';

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
    <TooltipButton
      tooltipText={tooltip}
      button={
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
      }
    />
  );
};

const Header: React.FC<HeaderProps> = ({ onExit, onSettings, onMenu, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div
      className={cn('relative w-full z-50', 'animate-in fade-in slide-in-from-top-4 duration-500')}
    >
      <div className="relative">
        <div className="relative flex items-center justify-between p-4 sm:p-5 lg:p-6">
          <AnimatedButton onClick={onExit} icon={X} variant="danger" tooltip="Exit Reading Mode" />

          <div className="flex items-center gap-3 sm:gap-3.5 lg:gap-4">
            <AnimatedButton onClick={onSettings} icon={Settings} tooltip="Reading Settings" />

            <AnimatedButton onClick={onMenu} icon={List} tooltip="Table of Contents" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
