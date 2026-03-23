import type { LucideIcon } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

export interface StyleSectionHeaderProps {
  icon: LucideIcon;
  label: string;
}

export const StyleSectionHeader: React.FC<StyleSectionHeaderProps> = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
    <Icon className="h-3.5 w-3.5" />
    {label}
  </div>
);

export interface StyleOptionGroupProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  renderOption: (option: { value: T; label: string }, isSelected: boolean) => React.ReactNode;
  gap?: string;
}

export function StyleOptionGroup<T extends string>({
  options,
  value,
  onChange,
  renderOption,
  gap = 'gap-0.5',
}: StyleOptionGroupProps<T>) {
  return (
    <div className={cn('flex bg-muted/40 rounded-xl p-1', gap)}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          title={option.label}
          className={cn(
            'flex-1 flex flex-col items-center justify-center rounded transition-all duration-150',
            value === option.value
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {renderOption(option, value === option.value)}
        </button>
      ))}
    </div>
  );
}
