import React, { memo } from 'react';
import { Eye, Code, Columns2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TooltipButton } from '@/components/shared/ui/tooltip-button';
import type { ViewMode } from '../../store';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onToggle: (mode: ViewMode) => void;
  disabled?: boolean;
}

const VIEW_MODE_ICONS = {
  preview: Eye,
  edit: Code,
  dual: Columns2,
} as const;

const VIEW_MODE_CONFIG = {
  preview: {
    label: 'Preview',
    tooltip: 'Switch to Edit Mode (Edit raw markdown)',
    ariaLabel: 'Switch to Edit Mode',
    nextMode: 'edit' as ViewMode,
  },
  edit: {
    label: 'Edit',
    tooltip: 'Switch to Dual Mode (Split view)',
    ariaLabel: 'Switch to Dual Mode',
    nextMode: 'dual' as ViewMode,
  },
  dual: {
    label: 'Dual',
    tooltip: 'Switch to Preview Mode (View rendered)',
    ariaLabel: 'Switch to Preview Mode',
    nextMode: 'preview' as ViewMode,
  },
} as const;

const ViewModeToggle: React.FC<ViewModeToggleProps> = memo(
  ({ viewMode, onToggle, disabled = false }) => {
    const config = VIEW_MODE_CONFIG[viewMode];
    const handleClick = () => onToggle(config.nextMode);

    return (
      <div className="flex items-center h-7 border-l border-border/10">
        <TooltipButton
          button={
            <ViewModeButton
              disabled={disabled}
              config={config}
              viewMode={viewMode}
              handleClick={handleClick}
            />
          }
          tooltipText={config.tooltip}
        />
      </div>
    );
  }
);

interface ViewModeButtonProps {
  config: (typeof VIEW_MODE_CONFIG)[keyof typeof VIEW_MODE_CONFIG];
  viewMode: ViewMode;
  handleClick: () => void;
  disabled: boolean;
}

const ViewModeButton: React.FC<ViewModeButtonProps> = ({
  disabled,
  config,
  viewMode,
  handleClick,
}) => {
  return (
    <button
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        'h-7 px-2 flex items-center gap-1.5',
        'transition-all duration-200 ease-out',
        'hover:bg-primary/10',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/30'
      )}
      aria-label={config.ariaLabel}
    >
      <div className="relative flex items-center justify-center w-5 h-5">
        {(Object.entries(VIEW_MODE_ICONS) as [ViewMode, React.ComponentType<{ className?: string }>][]).map(
          ([mode, Icon]) => (
            <Icon
              key={mode}
              className={cn(
                'w-4 h-4 absolute transition-all duration-200',
                viewMode === mode ? 'opacity-100 scale-100 text-primary' : 'opacity-0 scale-75'
              )}
            />
          )
        )}
      </div>
      <span
        className={cn(
          'text-xs font-medium transition-colors duration-200',
          'hidden sm:inline',
          viewMode === 'preview' ? 'text-muted-foreground' : 'text-primary'
        )}
      >
        {config.label}
      </span>
    </button>
  );
};

ViewModeToggle.displayName = 'ViewModeToggle';

export default ViewModeToggle;
