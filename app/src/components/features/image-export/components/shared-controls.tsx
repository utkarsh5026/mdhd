import { ChevronRight } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { COLOR_GROUPS } from '@/lib/constants';
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
    <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest select-none">
      {children}
    </span>
    <div className="flex-1 h-px bg-border/40" />
  </div>
);

const ColorSwatch: React.FC<{
  hex: string;
  name: string;
  selected: boolean;
  onSelect: () => void;
}> = ({ hex, name, selected, onSelect }) => (
  <button
    className={cn(
      'w-5.5 h-5.5 rounded-full transition-all duration-200 cursor-pointer',
      'border-2 shadow-sm hover:shadow-md',
      selected
        ? 'border-primary scale-110 ring-2 ring-primary/25 shadow-primary/20'
        : 'border-transparent hover:scale-110 hover:border-foreground/15'
    )}
    style={{ backgroundColor: hex }}
    onClick={onSelect}
    title={name}
  />
);

export const ColorSwatchGrid: React.FC<{
  selected: string;
  onSelect: (color: string) => void;
}> = ({ selected, onSelect }) => {
  const [open, setOpen] = useState(false);

  const isPresetSelected = COLOR_GROUPS.some((g) =>
    g.colors.some((c) => c.hex.toLowerCase() === selected.toLowerCase())
  );

  const selectedName =
    COLOR_GROUPS.flatMap((g) => [...g.colors]).find(
      (c) => c.hex.toLowerCase() === selected.toLowerCase()
    )?.name ?? selected;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2.5 w-full py-1.5 px-1 -mx-1 rounded-md hover:bg-muted/50 transition-colors cursor-pointer group">
        <div
          className="w-5.5 h-5.5 rounded-full border-2 border-border/50 shadow-sm shrink-0"
          style={{ backgroundColor: selected }}
        />
        <span className="text-xs text-muted-foreground truncate">{selectedName}</span>
        <ChevronRight
          className={cn(
            'w-3.5 h-3.5 ml-auto text-muted-foreground/50 transition-transform duration-200',
            open && 'rotate-90'
          )}
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-up-1 data-[state=open]:slide-down-1">
        <div className="space-y-2.5 pt-2.5">
          {COLOR_GROUPS.map((group) => (
            <div key={group.label}>
              <span className="text-[9px] font-medium text-muted-foreground/50 uppercase tracking-widest select-none">
                {group.label}
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {group.colors.map((color) => (
                  <ColorSwatch
                    key={color.hex}
                    hex={color.hex}
                    name={color.name}
                    selected={selected.toLowerCase() === color.hex.toLowerCase()}
                    onSelect={() => onSelect(color.hex)}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Custom color picker */}
          <div>
            <span className="text-[9px] font-medium text-muted-foreground/50 uppercase tracking-widest select-none">
              Custom
            </span>
            <div className="flex items-center gap-2 mt-1">
              <label
                className={cn(
                  'relative w-5.5 h-5.5 rounded-full border-2 shrink-0 transition-all duration-200 cursor-pointer',
                  !isPresetSelected
                    ? 'border-primary ring-2 ring-primary/25 scale-110'
                    : 'border-border/40'
                )}
                style={{ backgroundColor: selected }}
              >
                <input
                  type="color"
                  value={selected}
                  onChange={(e) => onSelect(e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
              </label>
              <span className="text-[11px] font-mono text-muted-foreground/70">{selected}</span>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

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

export const SelectRow: React.FC<{
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  groups?: { label: string; options: { value: string; label: string }[] }[];
  renderItem?: (option: { value: string; label: string }) => React.ReactNode;
}> = ({ label, value, onValueChange, options, groups, renderItem }) => (
  <div>
    <div className="text-xs text-muted-foreground mb-1.5">{label}</div>
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full h-8 text-xs rounded-lg">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {groups
          ? groups.map((group) => (
              <SelectGroup key={group.label}>
                <SelectLabel>{group.label}</SelectLabel>
                {group.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {renderItem ? renderItem(opt) : opt.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))
          : options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {renderItem ? renderItem(opt) : opt.label}
              </SelectItem>
            ))}
      </SelectContent>
    </Select>
  </div>
);
