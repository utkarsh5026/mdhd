import { Code2 } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

import type { CodeBlockContainerStyle } from '../store/markdown-style-store';
import { useMarkdownStyleStore } from '../store/markdown-style-store';

const OPTIONS: { style: CodeBlockContainerStyle; label: string; description: string }[] = [
  { style: 'rounded', label: 'Rounded', description: 'Soft corners with shadow' },
  { style: 'sharp', label: 'Sharp', description: 'Square corners, flat' },
  { style: 'bordered', label: 'Bordered', description: 'Rounded with border' },
];

const CodeBlockPreview: React.FC<{ style: CodeBlockContainerStyle; isSelected: boolean }> = ({
  style,
  isSelected,
}) => {
  const base = 'w-full overflow-hidden transition-all duration-200';
  const wrapperStyles: Record<CodeBlockContainerStyle, string> = {
    rounded: 'rounded-xl',
    sharp: 'rounded-none',
    bordered: 'rounded-xl border border-border/50',
  };

  return (
    <div
      className={cn(
        base,
        wrapperStyles[style],
        'bg-muted/60 p-2',
        isSelected ? 'ring-1 ring-primary/40' : 'ring-1 ring-transparent'
      )}
    >
      <div className="space-y-1 font-mono text-[9px] leading-tight text-muted-foreground/70">
        <span className="text-primary/60">{'const'}</span>
        <span className="text-foreground/60">{' x = '}</span>
        <span className="text-green-500/70">{'"code"'}</span>
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
        Code Block Container
      </div>
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map(({ style, label, description }) => (
          <button
            key={style}
            onClick={() => setCodeBlockContainerStyle(style)}
            className={cn(
              'flex flex-col gap-2 p-2 rounded-xl border text-left transition-all duration-150',
              codeBlockContainerStyle === style
                ? 'border-primary/40 bg-primary/5'
                : 'border-border/30 bg-card/30 hover:border-border/50'
            )}
          >
            <CodeBlockPreview style={style} isSelected={codeBlockContainerStyle === style} />
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

export default CodeBlockStyleSettings;
