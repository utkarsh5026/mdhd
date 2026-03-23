import { Heading } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

import type { HeadingColorStyle } from '../store/markdown-style-store';
import { useMarkdownStyleStore } from '../store/markdown-style-store';

const OPTIONS: { style: HeadingColorStyle; label: string; preview: string }[] = [
  { style: 'none', label: 'None', preview: 'text-foreground/80' },
  { style: 'solid', label: 'Solid', preview: 'text-primary' },
  {
    style: 'gradient',
    label: 'Gradient',
    preview: 'bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent',
  },
];

const HeadingStyleSettings: React.FC = () => {
  const headingColorStyle = useMarkdownStyleStore((s) => s.settings.headingColorStyle);
  const setHeadingColorStyle = useMarkdownStyleStore((s) => s.setHeadingColorStyle);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Heading className="h-3.5 w-3.5" />
        Heading Color
      </div>
      <div className="flex bg-muted/40 rounded-xl p-1 gap-0.5">
        {OPTIONS.map(({ style, label, preview }) => (
          <button
            key={style}
            onClick={() => setHeadingColorStyle(style)}
            title={label}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded text-xs font-medium transition-all duration-150',
              headingColorStyle === style
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span className={cn('font-bold text-sm leading-none', preview)}>H</span>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default HeadingStyleSettings;
