import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';
import * as React from 'react';
import { useCallback, useRef, useState } from 'react';

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
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const touchY = e.touches[0].clientY - rect.top;
    if (touchY > 48) return;

    startY.current = e.touches[0].clientY;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta > 0) {
        setDragY(delta);
      }
    },
    [isDragging]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = window.innerHeight * 0.25;
    if (dragY > threshold) {
      // Dismiss — find and click the close button to trigger Radix close
      contentRef.current?.querySelector<HTMLButtonElement>('[aria-label="Close"]')?.click();
    }
    setDragY(0);
  }, [isDragging, dragY]);

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={contentRef}
        data-slot="bottom-sheet-content"
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 h-[70vh] sm:h-[80vh] md:h-[85vh] overflow-y-auto',
          'rounded-t-2xl bg-background border-t border-border px-5 pb-6 pt-3',
          'data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-4 data-[state=open]:fade-in-0 data-[state=open]:duration-300',
          'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-4 data-[state=closed]:fade-out-0 data-[state=closed]:duration-200',
          className
        )}
        style={{
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        {...props}
      >
        {/* Drag handle + close button row */}
        <div className="relative py-3">
          <div className="w-10 h-1 rounded-full bg-muted mx-auto" />
          <DialogPrimitive.Close
            aria-label="Close"
            className="absolute top-1.5 right-0 p-2.5 rounded-full hover:bg-muted transition-colors cursor-pointer"
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
