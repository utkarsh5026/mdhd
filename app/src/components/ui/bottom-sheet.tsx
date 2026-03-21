import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

import { DialogOverlay, DialogPortal } from './dialog';

function BottomSheet({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="bottom-sheet" {...props} />;
}

function BottomSheetContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="bottom-sheet-content"
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 h-[85vh] overflow-y-auto font-cascadia-code',
          'rounded-t-2xl bg-background border-t border-border px-5 pb-6 pt-3',
          'data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-4 data-[state=open]:fade-in-0 data-[state=open]:duration-300',
          'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-4 data-[state=closed]:fade-out-0 data-[state=closed]:duration-200',
          className
        )}
        {...props}
      >
        {/* Drag handle + close button row */}
        <div className="relative py-3">
          <div className="w-10 h-1 rounded-full bg-muted mx-auto" />
          <DialogPrimitive.Close
            aria-label="Close"
            className="absolute top-1.5 right-0 p-1.5 rounded-full hover:bg-muted transition-colors cursor-pointer"
          >
            <XIcon className="size-5" />
          </DialogPrimitive.Close>
        </div>

        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function BottomSheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="bottom-sheet-title"
      className={cn('text-base font-semibold text-foreground text-center mt-2', className)}
      {...props}
    />
  );
}

export { BottomSheet, BottomSheetContent, BottomSheetTitle };
