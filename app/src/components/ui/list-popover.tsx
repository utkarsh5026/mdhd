import * as PopoverPrimitive from '@radix-ui/react-popover';
import * as React from 'react';

import { cn } from '@/lib/utils';

function ListPopover(props: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root {...props} />;
}

function ListPopoverTrigger(props: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger {...props} />;
}

interface ListPopoverContentProps extends React.ComponentProps<typeof PopoverPrimitive.Content> {
  title?: string;
}

function ListPopoverContent({
  title,
  children,
  className,
  align = 'start',
  sideOffset = 6,
  ...props
}: ListPopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-200 min-w-52 max-w-72 rounded-2xl border border-border',
          'bg-popover text-popover-foreground shadow-lg font-cascadia-code backdrop-blur-2xl',
          'animate-in fade-in-0 zoom-in-95',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          className
        )}
        {...props}
      >
        {title != null && (
          <div className="px-3 py-2 border-b border-border/50">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              {title}
            </span>
          </div>
        )}
        <div className="max-h-64 overflow-y-auto py-1 scrollbar-none">{children}</div>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}

interface ListPopoverItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
}

function ListPopoverItem({
  isActive,
  icon,
  suffix,
  children,
  className,
  disabled,
  ...props
}: ListPopoverItemProps) {
  return (
    <button
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors',
        disabled
          ? 'opacity-50 cursor-default text-foreground'
          : isActive
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-foreground hover:bg-accent/50',
        className
      )}
      {...props}
    >
      {icon}
      <span className="flex-1 truncate">{children}</span>
      {suffix}
    </button>
  );
}

function ListPopoverGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

function ListPopoverGroupLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'px-3 py-1.5 text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider truncate',
        className
      )}
    >
      {children}
    </div>
  );
}

export {
  ListPopover,
  ListPopoverContent,
  ListPopoverGroup,
  ListPopoverGroupLabel,
  ListPopoverItem,
  ListPopoverTrigger,
};
