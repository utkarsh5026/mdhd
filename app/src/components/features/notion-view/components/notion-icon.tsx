import { Smile } from 'lucide-react';
import React, { memo, useCallback, useState } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import EmojiPicker from './emoji-picker';

interface NotionIconProps {
  icon: string;
  className?: string;
  /** Called with the new emoji when the user picks one. Omit to render a non-interactive icon. */
  onChange?: (icon: string) => void;
  /** Called when the user clears the custom icon to fall back to the auto-generated one. */
  onReset?: () => void;
  /** Called when the user requests a random emoji. */
  onRandom?: () => void;
}

const NotionIcon: React.FC<NotionIconProps> = memo(
  ({ icon, className, onChange, onReset, onRandom }) => {
    const [open, setOpen] = useState(false);

    const handleSelect = useCallback(
      (emoji: string) => {
        onChange?.(emoji);
        setOpen(false);
      },
      [onChange]
    );

    const handleReset = useCallback(() => {
      onReset?.();
      setOpen(false);
    }, [onReset]);

    const handleRandom = useCallback(() => {
      onRandom?.();
      setOpen(false);
    }, [onRandom]);

    const interactive = !!onChange;

    const iconBox = (
      <div
        className={cn(
          'inline-flex items-center justify-center',
          'h-16 w-16 sm:h-20 sm:w-20',
          'rounded-2xl bg-card shadow-md ring-1 ring-border/40',
          'text-4xl sm:text-5xl leading-none select-none',
          interactive && 'cursor-pointer transition-transform hover:scale-105',
          className
        )}
        aria-hidden={!interactive}
      >
        <span className="translate-y-px">{icon}</span>
      </div>
    );

    if (!interactive) return iconBox;

    return (
      <div className="group relative inline-block">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Change icon"
              className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              {iconBox}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" side="bottom" className="p-0 w-auto">
            <EmojiPicker
              selected={icon}
              onSelect={handleSelect}
              onRandom={onRandom ? handleRandom : undefined}
              onReset={onReset ? handleReset : undefined}
            />
          </PopoverContent>
        </Popover>

        {/* Hover hint — "Change icon" badge */}
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute -top-2 -right-2 z-10',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
            'bg-foreground text-background text-[10px] font-medium shadow-md whitespace-nowrap'
          )}
        >
          <Smile className="h-2.5 w-2.5" />
          Change icon
        </div>
      </div>
    );
  }
);

NotionIcon.displayName = 'NotionIcon';

export default NotionIcon;
