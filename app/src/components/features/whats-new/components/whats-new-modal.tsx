import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import React, { useEffect, useRef } from 'react';

import { BottomSheet, BottomSheetContent } from '@/components/ui/bottom-sheet';
import { useMobile } from '@/hooks';
import { cn } from '@/lib/utils';

import { LATEST_RELEASE } from '../data/releases';
import { useIsWhatsNewOpen, useWhatsNewActions } from '../store/whats-new-store';
import ReleaseNotes from './release-notes';

/**
 * Announces the newest release once per device, and renders the notes on
 * demand when reopened from the sidebar.
 *
 * Mount this once, near the root. It renders nothing until there is something
 * to say — a first-time visitor never sees it, and everyone else sees it at
 * most once per release.
 */
const WhatsNewModal: React.FC = () => {
  const isOpen = useIsWhatsNewOpen();
  const { announceLatest, dismiss } = useWhatsNewActions();
  const { isMobile } = useMobile();
  const dismissRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    announceLatest();
  }, [announceLatest]);

  const handleOpenChange = (next: boolean) => {
    if (!next) dismiss();
  };

  // Land initial focus on "Got it" instead of the close button — the primary
  // action reads as intentional, a focused × reads as an accident.
  const focusDismiss = (event: Event) => {
    event.preventDefault();
    dismissRef.current?.focus();
  };

  if (isMobile) {
    return (
      <BottomSheet open={isOpen} onOpenChange={handleOpenChange}>
        <BottomSheetContent className="h-auto max-h-[85vh]" onOpenAutoFocus={focusDismiss}>
          <DialogPrimitive.Title className="sr-only">
            {`What's new in MDHD ${LATEST_RELEASE.version}`}
          </DialogPrimitive.Title>
          <ReleaseNotes
            release={LATEST_RELEASE}
            onDismiss={dismiss}
            dismissRef={dismissRef}
            className="pb-2"
          />
        </BottomSheetContent>
      </BottomSheet>
    );
  }

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/40 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
            'duration-200'
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
            'w-[calc(100%-2rem)] max-w-lg overflow-hidden',
            'rounded-3xl border border-border/60 bg-background shadow-2xl',
            'px-7 py-7',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
            'duration-200'
          )}
          onOpenAutoFocus={focusDismiss}
        >
          <DialogPrimitive.Title className="sr-only">
            {`What's new in MDHD ${LATEST_RELEASE.version}`}
          </DialogPrimitive.Title>

          <DialogPrimitive.Close
            aria-label="Close"
            className={cn(
              'absolute right-4 top-4 z-10 rounded-lg p-1.5 text-muted-foreground/50',
              'transition-colors hover:bg-accent hover:text-foreground cursor-pointer'
            )}
          >
            <X className="size-4" />
          </DialogPrimitive.Close>

          <ReleaseNotes release={LATEST_RELEASE} onDismiss={dismiss} dismissRef={dismissRef} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

WhatsNewModal.displayName = 'WhatsNewModal';
export default WhatsNewModal;
