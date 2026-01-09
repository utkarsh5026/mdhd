import React from 'react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface SettingToggleProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export const SettingToggle: React.FC<SettingToggleProps> = ({
  icon,
  title,
  description,
  checked,
  onCheckedChange,
}) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 cursor-pointer group',
        checked
          ? 'border-primary/30 bg-primary/5'
          : 'border-border/30 bg-card/30 hover:border-border/50 hover:bg-card/50'
      )}
      onClick={() => onCheckedChange(!checked)}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'p-2 rounded-full transition-colors duration-200',
            checked ? 'bg-primary/20 text-primary' : 'bg-muted/50 text-muted-foreground'
          )}
        >
          {icon}
        </div>
        <div>
          <div className="font-medium text-sm">{title}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};
