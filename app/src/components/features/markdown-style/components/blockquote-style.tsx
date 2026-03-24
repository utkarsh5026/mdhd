import { Quote } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

import type { BlockquoteStyle } from '../store/markdown-style-store';
import { useMarkdownStyleStore } from '../store/markdown-style-store';
import { StyleOptionGroup, StyleSectionHeader } from './style-option-group';

const OPTIONS: { value: BlockquoteStyle; label: string }[] = [
  { value: 'border', label: 'Border' },
  { value: 'card', label: 'Card' },
  { value: 'minimal', label: 'Minimal' },
];

const PREVIEW_STYLES: Record<BlockquoteStyle, string> = {
  border: 'border-l-2 border-primary/50 bg-card/60 pl-2.5',
  card: 'border border-primary/20 bg-primary/5 not-italic',
  minimal: 'pl-3 text-foreground/50',
};

const BlockquoteStyleSettings: React.FC = () => {
  const blockquoteStyle = useMarkdownStyleStore((s) => s.settings.blockquoteStyle);
  const setBlockquoteStyle = useMarkdownStyleStore((s) => s.setBlockquoteStyle);

  return (
    <div className="space-y-3">
      <StyleSectionHeader icon={Quote} label="Blockquote" />
      <StyleOptionGroup
        options={OPTIONS}
        value={blockquoteStyle}
        onChange={setBlockquoteStyle}
        gap="gap-1"
        renderOption={({ value, label }, isSelected) => (
          <div className="flex flex-col items-center gap-1 py-1.5 px-1">
            <div
              className={cn(
                'text-[10px] italic py-1.5 px-2 transition-all duration-200 rounded',
                PREVIEW_STYLES[value]
              )}
            >
              "Predict the future..."
            </div>
            <span
              className={cn(
                'text-[10px] font-medium',
                isSelected ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {label}
            </span>
          </div>
        )}
      />
    </div>
  );
};

export default BlockquoteStyleSettings;
