import React from 'react';
import { Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ThemeFABProps {
  onClick: () => void;
  className?: string;
}

const ThemeFAB: React.FC<ThemeFABProps> = ({ onClick, className }) => {
  return (
    <Button
      variant="default"
      size="icon"
      className={cn(
        'h-14 w-14 rounded-full shadow-lg',
        'bg-primary hover:bg-primary/90',
        'transition-transform hover:scale-105 active:scale-95',
        'touch-manipulation',
        className
      )}
      onClick={onClick}
      aria-label="Open theme picker"
    >
      <Palette className="h-6 w-6" />
    </Button>
  );
};

export default ThemeFAB;
