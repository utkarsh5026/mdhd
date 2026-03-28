import { ChevronDownIcon } from 'lucide-react';
import React, { useCallback, useState } from 'react';

import {
  ListPopover,
  ListPopoverContent,
  ListPopoverGroup,
  ListPopoverGroupLabel,
  ListPopoverItem,
  ListPopoverTrigger,
} from '@/components/ui/list-popover';
import { cn } from '@/lib/utils';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

export interface LabeledSelectProps<T extends string = string> {
  label: string;
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  description?: string;
  className?: string;
  disabled?: boolean;
}

function LabeledSelectInner<T extends string>({
  label,
  options,
  value,
  onChange,
  placeholder,
  description,
  className,
  disabled = false,
}: LabeledSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  const handleSelect = useCallback(
    (v: T) => {
      onChange(v);
      setOpen(false);
    },
    [onChange]
  );

  return (
    <div className={cn('flex items-center justify-between gap-4 min-w-0', className)}>
      <div className="shrink-0 min-w-0">
        <span className="text-xs text-muted-foreground">{label}</span>
        {description && (
          <p className="text-[10px] text-muted-foreground/50 leading-tight mt-0.5">{description}</p>
        )}
      </div>

      <ListPopover open={open} onOpenChange={setOpen}>
        <ListPopoverTrigger
          disabled={disabled}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg border border-border/40',
            'bg-muted/30 px-2.5 py-1 text-xs transition-colors',
            'hover:bg-muted/50 hover:border-border/60',
            'data-[state=open]:bg-muted/50 data-[state=open]:border-border/60',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'outline-none focus-visible:ring-1 focus-visible:ring-ring/50'
          )}
        >
          <span className="truncate max-w-24">{selected?.label ?? placeholder ?? 'Select…'}</span>
          <ChevronDownIcon
            className={cn(
              'size-3 text-muted-foreground/60 shrink-0 transition-transform duration-150',
              open && 'rotate-180'
            )}
          />
        </ListPopoverTrigger>

        <ListPopoverContent align="end" className="min-w-36">
          {options.map((opt) => (
            <ListPopoverItem
              key={opt.value}
              isActive={opt.value === value}
              onClick={() => handleSelect(opt.value)}
            >
              {opt.label}
            </ListPopoverItem>
          ))}
        </ListPopoverContent>
      </ListPopover>
    </div>
  );
}

export const LabeledSelect = LabeledSelectInner as <T extends string>(
  props: LabeledSelectProps<T>
) => React.ReactElement;

export default LabeledSelect;

export interface SelectOptionGroup<T extends string = string> {
  label: string;
  options: SelectOption<T>[];
}

export interface LabeledGroupSelectProps<T extends string = string> {
  label: string;
  groups: SelectOptionGroup<T>[];
  value: T;
  onChange: (value: T) => void;
  displayValue?: string;
  className?: string;
  contentClassName?: string;
  onItemHover?: (value: T) => void;
}

function LabeledGroupSelectInner<T extends string>({
  label,
  groups,
  value,
  onChange,
  displayValue,
  className,
  contentClassName,
  onItemHover,
}: LabeledGroupSelectProps<T>) {
  const [open, setOpen] = useState(false);

  const selectedLabel =
    displayValue ?? groups.flatMap((g) => g.options).find((o) => o.value === value)?.label;

  const handleSelect = useCallback(
    (v: T) => {
      onChange(v);
      setOpen(false);
    },
    [onChange]
  );

  return (
    <div className={cn('flex items-center justify-between gap-4 min-w-0', className)}>
      <div className="shrink-0 min-w-0">
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>

      <ListPopover open={open} onOpenChange={setOpen}>
        <ListPopoverTrigger
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg border border-border/40',
            'bg-muted/30 px-2.5 py-1 text-xs transition-colors',
            'hover:bg-muted/50 hover:border-border/60',
            'data-[state=open]:bg-muted/50 data-[state=open]:border-border/60',
            'outline-none focus-visible:ring-1 focus-visible:ring-ring/50'
          )}
        >
          <span className="truncate max-w-28">{selectedLabel ?? 'Select…'}</span>
          <ChevronDownIcon
            className={cn(
              'size-3 text-muted-foreground/60 shrink-0 transition-transform duration-150',
              open && 'rotate-180'
            )}
          />
        </ListPopoverTrigger>

        <ListPopoverContent align="end" className={cn('min-w-44', contentClassName)}>
          {groups.map((group, i) => (
            <ListPopoverGroup key={group.label} className={i > 0 ? 'mt-1.5' : undefined}>
              <ListPopoverGroupLabel>{group.label}</ListPopoverGroupLabel>
              {group.options.map((opt) => (
                <ListPopoverItem
                  key={opt.value}
                  isActive={opt.value === value}
                  onClick={() => handleSelect(opt.value)}
                  onMouseEnter={onItemHover ? () => onItemHover(opt.value) : undefined}
                  className="py-1.5"
                >
                  {opt.label}
                </ListPopoverItem>
              ))}
            </ListPopoverGroup>
          ))}
        </ListPopoverContent>
      </ListPopover>
    </div>
  );
}

export const LabeledGroupSelect = LabeledGroupSelectInner as <T extends string>(
  props: LabeledGroupSelectProps<T>
) => React.ReactElement;
