import { Code } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

import type { InlineCodeShape, InlineCodeStyle } from '../store/markdown-style-store';
import { useMarkdownStyleStore } from '../store/markdown-style-store';

const STYLE_OPTIONS: { style: InlineCodeStyle; label: string; previewClass: string }[] = [
  { style: 'primary', label: 'Primary', previewClass: 'bg-primary/10 text-primary/95' },
  { style: 'muted', label: 'Muted', previewClass: 'bg-muted text-foreground/80' },
  { style: 'bordered', label: 'Border', previewClass: 'border border-primary/30 text-primary/90' },
  { style: 'ghost', label: 'Ghost', previewClass: 'text-primary font-semibold' },
];

const SHAPE_OPTIONS: { shape: InlineCodeShape; label: string; radius: string }[] = [
  { shape: 'rounded', label: 'Rounded', radius: 'rounded' },
  { shape: 'pill', label: 'Pill', radius: 'rounded-full' },
  { shape: 'sharp', label: 'Sharp', radius: 'rounded-none' },
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
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Code className="h-3.5 w-3.5" />
        Inline Code
      </div>

      {/* Appearance — segmented control */}
      <div className="space-y-1.5">
        <div className="text-[10px] text-muted-foreground/60 px-0.5">Appearance</div>
        <div className="flex bg-muted/40 rounded-xl p-1 gap-0.5">
          {STYLE_OPTIONS.map(({ style, label, previewClass }) => (
            <button
              key={style}
              onClick={() => setInlineCodeStyle(style)}
              className={cn(
                'flex-1 flex flex-col items-center gap-1.5 py-2 rounded transition-all duration-150',
                inlineCodeStyle === style ? 'bg-background shadow-sm' : 'hover:bg-background/40'
              )}
            >
              <span className={cn('px-1.5 py-0.5 text-[9px] font-mono rounded', previewClass)}>
                x
              </span>
              <span
                className={cn(
                  'text-[10px] font-medium',
                  inlineCodeStyle === style ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Shape — segmented control */}
      <div className="space-y-1.5">
        <div className="text-[10px] text-muted-foreground/60 px-0.5">Shape</div>
        <div className="flex bg-muted/40 rounded-xl p-1 gap-0.5">
          {SHAPE_OPTIONS.map(({ shape, label, radius }) => (
            <button
              key={shape}
              onClick={() => setInlineCodeShape(shape)}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1.5 py-2 rounded text-xs font-medium transition-all duration-150',
                inlineCodeShape === shape
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
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
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InlineCodeStyleSettings;
