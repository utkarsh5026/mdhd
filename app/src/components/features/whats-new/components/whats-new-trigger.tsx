import { Sparkles } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { TooltipButton } from '@/components/ui/tooltip-button';
import { cn } from '@/lib/utils';

import { useHasUnseenRelease, useWhatsNewActions } from '../store/whats-new-store';

/**
 * Sidebar rail button that reopens the latest release notes.
 *
 * Carries a small primary dot while the newest release is still unread, so a
 * dismissed announcement is never lost.
 */
const WhatsNewTrigger: React.FC = () => {
  const hasUnseen = useHasUnseenRelease();
  const { open } = useWhatsNewActions();

  return (
    <TooltipButton
      button={
        <Button
          variant="ghost"
          size="icon"
          className="relative h-7 w-7"
          onClick={open}
          aria-label="What's new"
        >
          <Sparkles className={cn('h-4 w-4', hasUnseen && 'text-primary')} />
          {hasUnseen && (
            <span className="absolute right-1 top-1 size-1.5 rounded-full bg-primary ring-2 ring-card" />
          )}
        </Button>
      }
      tooltipText="What's new"
    />
  );
};

WhatsNewTrigger.displayName = 'WhatsNewTrigger';
export default WhatsNewTrigger;
