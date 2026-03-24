import { X } from 'lucide-react';
import { memo, useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

type SideSheetSize = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<SideSheetSize, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-2xl',
};

let lockCount = 0;

function lockScroll() {
  lockCount++;
  if (lockCount === 1) {
    document.body.style.overflow = 'hidden';
  }
}

function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = '';
  }
}

export interface SideSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  size?: SideSheetSize;
  children: React.ReactNode;
  className?: string;
}

const SideSheet: React.FC<SideSheetProps> = ({
  open,
  onOpenChange,
  size = 'md',
  children,
  className,
}) => {
  const [shouldRender, setShouldRender] = useState(open);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      lockScroll();
      return () => {
        unlockScroll();
      };
    } else {
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!shouldRender) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-background/80 z-40 transition-opacity duration-300 ease-in-out',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-full',
          'bg-background shadow-2xl border-l border-border',
          'transform transition-transform duration-300 ease-out will-change-transform',
          open ? 'translate-x-0' : 'translate-x-full',
          SIZE_CLASSES[size],
          className
        )}
      >
        <div className="flex flex-col h-full w-full min-w-0 overflow-hidden">{children}</div>
      </div>
    </>
  );
};

export default memo(SideSheet);

export interface SideSheetHeaderProps {
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}

export const SideSheetHeader: React.FC<SideSheetHeaderProps> = memo(
  ({ children, onClose, className }) => (
    <div
      className={cn(
        'border-b border-border/20 px-4 py-3 shrink-0 flex items-center justify-between',
        className
      )}
    >
      <div className="flex items-center gap-2 min-w-0">{children}</div>
      <button
        onClick={onClose}
        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-muted-foreground/50 hover:text-foreground hover:bg-accent/40 transition-colors"
        aria-label="Close"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
);
SideSheetHeader.displayName = 'SideSheetHeader';

export interface SideSheetBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const SideSheetBody: React.FC<SideSheetBodyProps> = memo(({ children, className }) => (
  <div className={cn('flex-1 overflow-hidden min-w-0', className)}>{children}</div>
));
SideSheetBody.displayName = 'SideSheetBody';
