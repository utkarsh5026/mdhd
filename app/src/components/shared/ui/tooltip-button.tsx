import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import React from 'react';

interface TooltipButtonProps {
  button: React.ReactNode;
  tooltipText: string;
  children?: React.ReactNode;
}

export const TooltipButton: React.FC<TooltipButtonProps> = ({ button, tooltipText, children }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="font-cascadia-code bg-card text-muted-foreground rounded-xl text-xs"
        >
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
      {children}
    </TooltipProvider>
  );
};
