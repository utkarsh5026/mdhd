import React from 'react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsTouch } from '@/hooks';

interface TooltipButtonProps {
  button: React.ReactNode;
  tooltipText: string;
  children?: React.ReactNode;
}

export const TooltipButton: React.FC<TooltipButtonProps> = ({ button, tooltipText, children }) => {
  const isTouch = useIsTouch();

  if (isTouch) {
    return (
      <>
        {button}
        {children}
      </>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="bottom" className="bg-card text-muted-foreground rounded-xl text-xs">
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
      {children}
    </TooltipProvider>
  );
};
