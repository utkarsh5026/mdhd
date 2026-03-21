import { Quote } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

import type { BlockquoteStyle } from '../store/markdown-style-store';
import { useMarkdownStyleStore } from '../store/markdown-style-store';

const OPTIONS: { style: BlockquoteStyle; label: string; description: string }[] = [
  { style: 'border', label: 'Border', description: 'Left accent border with background' },
  { style: 'card', label: 'Card', description: 'Filled card with subtle tint' },
  { style: 'minimal', label: 'Minimal', description: 'Indented with muted text' },
];

const BlockquotePreview: React.FC<{ style: BlockquoteStyle; isSelected: boolean }> = ({
  style,
  isSelected,
}) => {
  const base = 'w-full rounded-lg px-3 py-2 text-xs italic transition-all duration-200';
  const styles: Record<BlockquoteStyle, string> = {
    border: 'border-l-3 border-primary/50 bg-card/60 text-foreground/80',
    card: 'border border-primary/20 bg-primary/5 text-foreground/80 not-italic',
    minimal: 'pl-4 text-foreground/55',
  };

  return (
    <div
      className={cn(
        base,
        styles[style],
        isSelected ? 'ring-1 ring-primary/40' : 'ring-1 ring-transparent'
      )}
    >
      "The best way to predict the future is to create it."
    </div>
  );
};

const BlockquoteStyleSettings: React.FC = () => {
  const blockquoteStyle = useMarkdownStyleStore((s) => s.settings.blockquoteStyle);
  const setBlockquoteStyle = useMarkdownStyleStore((s) => s.setBlockquoteStyle);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Quote className="h-3.5 w-3.5" />
        Blockquote Style
      </div>
      <div className="flex flex-col gap-2">
        {OPTIONS.map(({ style, label, description }) => (
          <button
            key={style}
            onClick={() => setBlockquoteStyle(style)}
            className={cn(
              'flex flex-col gap-2 p-2 rounded-xl border text-left transition-all duration-150',
              blockquoteStyle === style
                ? 'border-primary/40 bg-primary/5'
                : 'border-border/30 bg-card/30 hover:border-border/50'
            )}
          >
            <BlockquotePreview style={style} isSelected={blockquoteStyle === style} />
            <div>
              <div className="text-xs font-medium">{label}</div>
              <div className="text-[10px] text-muted-foreground leading-tight">{description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BlockquoteStyleSettings;
