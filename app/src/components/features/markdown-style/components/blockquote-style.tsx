import { Quote } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

import type { BlockquoteStyle } from '../store/markdown-style-store';
import { useMarkdownStyleStore } from '../store/markdown-style-store';

const OPTIONS: { style: BlockquoteStyle; label: string }[] = [
  { style: 'border', label: 'Border' },
  { style: 'card', label: 'Card' },
  { style: 'minimal', label: 'Minimal' },
];

const BlockquotePreview: React.FC<{ style: BlockquoteStyle }> = ({ style }) => {
  const styles: Record<BlockquoteStyle, string> = {
    border: 'border-l-2 border-primary/50 bg-card/60 pl-2.5',
    card: 'border border-primary/20 bg-primary/5 not-italic',
    minimal: 'pl-3 text-foreground/50',
  };

  return (
    <div
      className={cn(
        'text-[10px] italic py-1.5 px-2 transition-all duration-200 rounded-2xl',
        styles[style]
      )}
    >
      "Predict the future..."
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
        Blockquote
      </div>
      <div className="flex bg-muted/40 rounded-xl p-1 gap-1">
        {OPTIONS.map(({ style, label }) => (
          <button
            key={style}
            onClick={() => setBlockquoteStyle(style)}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-1.5 px-1 rounded transition-all duration-150',
              blockquoteStyle === style ? 'bg-background shadow-sm' : 'hover:bg-background/40'
            )}
          >
            <BlockquotePreview style={style} />
            <span
              className={cn(
                'text-[10px] font-medium',
                blockquoteStyle === style ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BlockquoteStyleSettings;
