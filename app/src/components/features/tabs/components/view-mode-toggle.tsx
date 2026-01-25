import React, { memo } from 'react';
import { Eye, Code } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface ViewModeToggleProps {
  viewMode: 'preview' | 'edit';
  onToggle: (mode: 'preview' | 'edit') => void;
  disabled?: boolean;
}

const ViewModeToggle: React.FC<ViewModeToggleProps> = memo(
  ({ viewMode, onToggle, disabled = false }) => {
    const isPreview = viewMode === 'preview';

    return (
      <div className="flex items-center h-9 border-l border-border/30">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              disabled={disabled}
              onClick={() => onToggle(isPreview ? 'edit' : 'preview')}
              className={cn(
                'h-9 px-3 flex items-center gap-2',
                'transition-all duration-200 ease-out',
                'hover:bg-primary/10',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50'
              )}
              aria-label={isPreview ? 'Switch to Edit Mode' : 'Switch to Preview Mode'}
            >
              <div className="relative flex items-center justify-center w-5 h-5">
                <Eye
                  className={cn(
                    'w-4 h-4 absolute transition-all duration-200',
                    isPreview
                      ? 'opacity-100 scale-100 text-primary'
                      : 'opacity-0 scale-75'
                  )}
                />
                <Code
                  className={cn(
                    'w-4 h-4 absolute transition-all duration-200',
                    !isPreview
                      ? 'opacity-100 scale-100 text-primary'
                      : 'opacity-0 scale-75'
                  )}
                />
              </div>
              <span
                className={cn(
                  'text-xs font-medium transition-colors duration-200',
                  'hidden sm:inline',
                  isPreview ? 'text-muted-foreground' : 'text-primary'
                )}
              >
                {isPreview ? 'Preview' : 'Edit'}
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} className='font-cascadia-code rounded-xl'>
            {isPreview ? 'Switch to Edit Mode (Edit raw markdown)' : 'Switch to Preview Mode (View rendered)'}
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }
);

ViewModeToggle.displayName = 'ViewModeToggle';

export default ViewModeToggle;
