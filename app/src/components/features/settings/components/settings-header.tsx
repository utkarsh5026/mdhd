import React from 'react';
import { cn } from '@/lib/utils';

interface SettingsHeaderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  rightContent?: React.ReactNode;
  className?: string;
}

export const SettingsHeader: React.FC<SettingsHeaderProps> = ({
  icon,
  title,
  description,
  rightContent,
  className,
}) => {
  return (
    <div
      className={cn('flex items-center justify-between pb-4 border-b border-border/20', className)}
    >
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-primary/10 rounded-2xl">{icon}</div>
        <div>
          <h3 className="font-semibold text-base">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {rightContent}
    </div>
  );
};
