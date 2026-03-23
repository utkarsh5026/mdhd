import { Code2 } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

import type { CodeBlockContainerStyle } from '../store/markdown-style-store';
import { useMarkdownStyleStore } from '../store/markdown-style-store';

const OPTIONS: { style: CodeBlockContainerStyle; label: string }[] = [
  { style: 'rounded', label: 'Rounded' },
  { style: 'sharp', label: 'Sharp' },
  { style: 'bordered', label: 'Bordered' },
];

const CodeBlockPreview: React.FC<{ style: CodeBlockContainerStyle }> = ({ style }) => {
  const wrapperStyles: Record<CodeBlockContainerStyle, string> = {
    rounded: 'rounded',
    sharp: 'rounded-none',
    bordered: 'rounded border border-border/50',
  };

  return (
    <div
      className={cn('bg-muted/60 px-2 py-1.5 transition-all duration-200', wrapperStyles[style])}
    >
      <div className="font-mono text-[8px] leading-tight text-muted-foreground/70">
        <span className="text-primary/60">const</span>
        <span className="text-foreground/60"> x = </span>
        <span className="text-green-500/70">"hi"</span>
      </div>
    </div>
  );
};

const CodeBlockStyleSettings: React.FC = () => {
  const codeBlockContainerStyle = useMarkdownStyleStore((s) => s.settings.codeBlockContainerStyle);
  const setCodeBlockContainerStyle = useMarkdownStyleStore((s) => s.setCodeBlockContainerStyle);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Code2 className="h-3.5 w-3.5" />
        Code Block
      </div>
      <div className="flex bg-muted/40 rounded-xl p-1 gap-1">
        {OPTIONS.map(({ style, label }) => (
          <button
            key={style}
            onClick={() => setCodeBlockContainerStyle(style)}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-1.5 px-1 rounded transition-all duration-150',
              codeBlockContainerStyle === style
                ? 'bg-background shadow-sm'
                : 'hover:bg-background/40'
            )}
          >
            <CodeBlockPreview style={style} />
            <span
              className={cn(
                'text-[10px] font-medium',
                codeBlockContainerStyle === style ? 'text-foreground' : 'text-muted-foreground'
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

export default CodeBlockStyleSettings;
