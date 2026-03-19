import React from 'react';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export const ToolbarButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  className?: string;
}> = ({ icon, label, onClick, disabled, title, className }) => (
  <Button
    variant="ghost"
    size="sm"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      'h-7 gap-1.5 cursor-pointer rounded-md hover:bg-muted text-xs px-2.5 text-muted-foreground',
      className
    )}
  >
    {icon}
    {label}
  </Button>
);

export const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-2 mb-3">
    <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-[0.1em] select-none">
      {children}
    </span>
    <div className="flex-1 h-px bg-border/40" />
  </div>
);

export const ColorSwatchGrid: React.FC<{
  selected: string;
  onSelect: (color: string) => void;
}> = ({ selected, onSelect }) => (
  <div className="grid grid-cols-8 gap-1.5">
    {COLORS.map((color) => (
      <button
        key={color}
        className={cn(
          'w-6 h-6 rounded-full transition-all duration-200 cursor-pointer',
          'border-2 shadow-sm hover:shadow-md',
          selected.toLowerCase() === color.toLowerCase()
            ? 'border-primary scale-110 ring-2 ring-primary/25 shadow-primary/20'
            : 'border-transparent hover:scale-110 hover:border-foreground/15'
        )}
        style={{ backgroundColor: color }}
        onClick={() => onSelect(color)}
        title={color}
      />
    ))}
  </div>
);

export const ToggleGroup: React.FC<{
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}> = ({ options, value, onChange }) => (
  <div className="flex gap-0.5 p-0.5 rounded-lg bg-muted/40">
    {options.map((opt) => (
      <button
        key={opt.value}
        className={cn(
          'flex-1 text-xs py-1.5 rounded-md transition-all duration-200 cursor-pointer font-medium',
          value === opt.value
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground/80'
        )}
        onClick={() => onChange(opt.value)}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

export const SliderRow: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  unit?: string;
}> = ({ label, value, onChange, min, max, step, unit = '' }) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-[11px] font-mono text-muted-foreground/70 tabular-nums bg-muted/40 px-1.5 py-0.5 rounded">
        {value}
        {unit}
      </span>
    </div>
    <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={min} max={max} step={step} />
  </div>
);
