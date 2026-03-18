import { List, LucideIcon, Settings, X } from 'lucide-react';

import { TooltipButton } from '@/components/shared/ui/tooltip-button';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onExit: () => void;
  onSettings: () => void;
  onMenu: () => void;
  isVisible: boolean;
  breadcrumb?: React.ReactNode;
  mobileBreadcrumb?: React.ReactNode;
}

interface BarButtonProps {
  onClick: () => void;
  icon: LucideIcon;
  variant?: 'danger' | 'primary';
  tooltip: string;
}

const BarButton: React.FC<BarButtonProps> = ({
  onClick,
  icon: Icon,
  variant = 'primary',
  tooltip,
}) => (
  <TooltipButton
    tooltipText={tooltip}
    button={
      <button
        onClick={onClick}
        aria-label={tooltip}
        className={cn(
          'relative group touch-manipulation shrink-0',
          'p-1.5 sm:p-2 rounded-2xl',
          'transition-all duration-200 ease-out',
          'border border-border/40',
          'bg-background/0 text-foreground/70',
          'hover:bg-accent/60 hover:border-border/70 hover:text-foreground',
          'active:scale-95',
          variant === 'danger'
            ? 'hover:text-red-400 hover:bg-red-400/10 hover:border-red-400/30'
            : 'hover:text-primary hover:bg-primary/10 hover:border-primary/30'
        )}
      >
        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform duration-200 group-hover:scale-110" />
      </button>
    }
  />
);

const Header: React.FC<HeaderProps> = ({
  onExit,
  onSettings,
  onMenu,
  isVisible,
  breadcrumb,
  mobileBreadcrumb,
}) => {
  if (!isVisible) return null;

  return (
    <div className={cn('w-full z-50', 'animate-in fade-in slide-in-from-top-4 duration-500')}>
      <div
        className={cn(
          'bg-background/85 backdrop-blur-2xl',
          'border-b border-border/20',
          'shadow-[0_1px_12px_rgba(0,0,0,0.08)]'
        )}
      >
        {/* Main row — always visible */}
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5">
          {/* Left: Exit + breadcrumb (breadcrumb hidden on mobile, shown sm+) */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
            <BarButton onClick={onExit} icon={X} variant="danger" tooltip="Exit Reading Mode" />

            {breadcrumb && (
              <>
                <div className="hidden sm:block w-px h-4 bg-border/40 shrink-0" aria-hidden />
                <div className="hidden sm:block min-w-0 overflow-x-auto flex-1">{breadcrumb}</div>
              </>
            )}
          </div>

          {/* Right: Settings + TOC */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <BarButton onClick={onSettings} icon={Settings} tooltip="Reading Settings" />
            <BarButton onClick={onMenu} icon={List} tooltip="Table of Contents" />
          </div>
        </div>

        {/* Mobile breadcrumb row — visible only below sm breakpoint */}
        {mobileBreadcrumb && <div className="sm:hidden px-3 pb-2 pt-0.5">{mobileBreadcrumb}</div>}
      </div>
    </div>
  );
};

export default Header;
