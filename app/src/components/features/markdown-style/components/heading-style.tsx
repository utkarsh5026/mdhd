import { Heading } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

import type { HeadingColorStyle } from '../store/markdown-style-store';
import { useMarkdownStyleStore } from '../store/markdown-style-store';
import { StyleOptionGroup, StyleSectionHeader } from './style-option-group';

const OPTIONS: { value: HeadingColorStyle; label: string; preview: string }[] = [
  { value: 'none', label: 'None', preview: 'text-foreground/80' },
  { value: 'solid', label: 'Solid', preview: 'text-primary' },
  {
    value: 'gradient',
    label: 'Gradient',
    preview: 'bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent',
  },
];

const HeadingStyleSettings: React.FC = () => {
  const headingColorStyle = useMarkdownStyleStore((s) => s.settings.headingColorStyle);
  const setHeadingColorStyle = useMarkdownStyleStore((s) => s.setHeadingColorStyle);

  return (
    <div className="space-y-3">
      <StyleSectionHeader icon={Heading} label="Heading Color" />
      <StyleOptionGroup
        options={OPTIONS}
        value={headingColorStyle}
        onChange={setHeadingColorStyle}
        renderOption={({ label, value }) => {
          const preview = OPTIONS.find((o) => o.value === value)!.preview;
          return (
            <div className="flex items-center gap-1.5 py-2 text-xs font-medium">
              <span className={cn('font-bold text-sm leading-none', preview)}>H</span>
              {label}
            </div>
          );
        }}
      />
    </div>
  );
};

export default HeadingStyleSettings;
