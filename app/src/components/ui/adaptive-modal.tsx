import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import * as React from 'react';

import useMobile from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

import { BottomSheet, BottomSheetContent, BottomSheetTitle } from './bottom-sheet';

export interface AdaptiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  /** Footer actions — shown on desktop only. On mobile, embed actions inside children. */
  footer?: React.ReactNode;
  className?: string;
}

/* ─── Desktop modal ─────────────────────────────────────────────────────────── */

const DesktopModal: React.FC<AdaptiveModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}) => (
  <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
    <DialogPrimitive.Portal>
      {/* Overlay with blur */}
      <DialogPrimitive.Overlay
        className={cn(
          'fixed inset-0 z-50',
          'bg-black/40 backdrop-blur-sm',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
          'duration-200'
        )}
      />

      {/* Panel */}
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
          'w-full max-w-md',
          'bg-background border border-border/60 rounded-2xl shadow-xl',
          'p-6 flex flex-col gap-4',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          'duration-200',
          className
        )}
      >
        {/* Close */}
        <DialogPrimitive.Close className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer">
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>

        {/* Header */}
        {(title || description) && (
          <div className="flex flex-col gap-1 pr-6">
            {title && (
              <DialogPrimitive.Title className="text-base font-semibold text-foreground">
                {title}
              </DialogPrimitive.Title>
            )}
            {description && (
              <DialogPrimitive.Description className="text-sm text-muted-foreground">
                {description}
              </DialogPrimitive.Description>
            )}
          </div>
        )}

        {/* Body */}
        <div>{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/40">
            {footer}
          </div>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>
);

/* ─── Adaptive wrapper ───────────────────────────────────────────────────────── */

const AdaptiveModal: React.FC<AdaptiveModalProps> = (props) => {
  const { isMobile } = useMobile();

  if (isMobile) {
    return (
      <BottomSheet open={props.open} onOpenChange={props.onOpenChange}>
        <BottomSheetContent className={props.className}>
          {props.title && <BottomSheetTitle>{props.title}</BottomSheetTitle>}
          {props.description && (
            <p className="text-sm text-muted-foreground text-center mb-4">{props.description}</p>
          )}
          {props.children}
        </BottomSheetContent>
      </BottomSheet>
    );
  }

  return <DesktopModal {...props} />;
};

AdaptiveModal.displayName = 'AdaptiveModal';
export default AdaptiveModal;
