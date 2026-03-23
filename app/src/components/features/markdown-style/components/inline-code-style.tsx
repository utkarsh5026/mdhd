import { Code } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

import type { InlineCodeShape, InlineCodeStyle } from '../store/markdown-style-store';
import { useMarkdownStyleStore } from '../store/markdown-style-store';
import { StyleOptionGroup, StyleSectionHeader } from './style-option-group';

const STYLE_OPTIONS: { value: InlineCodeStyle; label: string; previewClass: string }[] = [
  { value: 'primary', label: 'Primary', previewClass: 'bg-primary/10 text-primary/95' },
  { value: 'muted', label: 'Muted', previewClass: 'bg-muted text-foreground/80' },
  { value: 'bordered', label: 'Border', previewClass: 'border border-primary/30 text-primary/90' },
  { value: 'ghost', label: 'Ghost', previewClass: 'text-primary font-semibold' },
];

const SHAPE_OPTIONS: { value: InlineCodeShape; label: string; radius: string }[] = [
  { value: 'rounded', label: 'Rounded', radius: 'rounded' },
  { value: 'pill', label: 'Pill', radius: 'rounded-full' },
  { value: 'sharp', label: 'Sharp', radius: 'rounded-none' },
];

const SHAPE_PREVIEW_BASE: Record<InlineCodeStyle, string> = {
  primary: 'bg-primary/10 text-primary/95',
  muted: 'bg-muted text-foreground/80',
  bordered: 'border border-primary/30 text-primary/90',
  ghost: 'text-primary font-semibold',
};

const InlineCodeStyleSettings: React.FC = () => {
  const inlineCodeStyle = useMarkdownStyleStore((s) => s.settings.inlineCodeStyle);
  const inlineCodeShape = useMarkdownStyleStore((s) => s.settings.inlineCodeShape);
  const setInlineCodeStyle = useMarkdownStyleStore((s) => s.setInlineCodeStyle);
  const setInlineCodeShape = useMarkdownStyleStore((s) => s.setInlineCodeShape);

  return (
    <div className="space-y-4">
      <StyleSectionHeader icon={Code} label="Inline Code" />

      {/* Appearance */}
      <div className="space-y-1.5">
        <div className="text-[10px] text-muted-foreground/60 px-0.5">Appearance</div>
        <StyleOptionGroup
          options={STYLE_OPTIONS}
          value={inlineCodeStyle}
          onChange={setInlineCodeStyle}
          renderOption={({ value, label }, isSelected) => {
            const previewClass = STYLE_OPTIONS.find((o) => o.value === value)!.previewClass;
            return (
              <div className="flex flex-col items-center gap-1.5 py-2">
                <span className={cn('px-1.5 py-0.5 text-[9px] font-mono rounded', previewClass)}>
                  x
                </span>
                <span
                  className={cn(
                    'text-[10px] font-medium',
                    isSelected ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {label}
                </span>
              </div>
            );
          }}
        />
      </div>

      {/* Shape */}
      <div className="space-y-1.5">
        <div className="text-[10px] text-muted-foreground/60 px-0.5">Shape</div>
        <StyleOptionGroup
          options={SHAPE_OPTIONS}
          value={inlineCodeShape}
          onChange={setInlineCodeShape}
          renderOption={({ value, label }) => {
            const radius = SHAPE_OPTIONS.find((o) => o.value === value)!.radius;
            return (
              <div className="flex flex-col items-center gap-1.5 py-2 text-xs font-medium">
                <span
                  className={cn(
                    'px-1.5 py-0.5 text-[9px] font-mono',
                    SHAPE_PREVIEW_BASE[inlineCodeStyle],
                    radius
                  )}
                >
                  abc
                </span>
                <span className="text-[10px]">{label}</span>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
};

export default InlineCodeStyleSettings;
