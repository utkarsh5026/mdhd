import { Code2 } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

import type { CodeBlockContainerStyle } from '../store/markdown-style-store';
import { useMarkdownStyleStore } from '../store/markdown-style-store';
import { StyleOptionGroup, StyleSectionHeader } from './style-option-group';

const OPTIONS: { value: CodeBlockContainerStyle; label: string }[] = [
  { value: 'rounded', label: 'Rounded' },
  { value: 'sharp', label: 'Sharp' },
  { value: 'bordered', label: 'Bordered' },
];

const WRAPPER_STYLES: Record<CodeBlockContainerStyle, string> = {
  rounded: 'rounded',
  sharp: 'rounded-none',
  bordered: 'rounded border border-border/50',
};

const CodeBlockStyleSettings: React.FC = () => {
  const codeBlockContainerStyle = useMarkdownStyleStore((s) => s.settings.codeBlockContainerStyle);
  const setCodeBlockContainerStyle = useMarkdownStyleStore((s) => s.setCodeBlockContainerStyle);

  return (
    <div className="space-y-3">
      <StyleSectionHeader icon={Code2} label="Code Block" />
      <StyleOptionGroup
        options={OPTIONS}
        value={codeBlockContainerStyle}
        onChange={setCodeBlockContainerStyle}
        gap="gap-1"
        renderOption={({ value, label }, isSelected) => (
          <div className="flex flex-col items-center gap-1 py-1.5 px-1">
            <div
              className={cn(
                'bg-muted/60 px-2 py-1.5 transition-all duration-200',
                WRAPPER_STYLES[value]
              )}
            >
              <div className="font-mono text-[8px] leading-tight text-muted-foreground/70">
                <span className="text-primary/60">const</span>
                <span className="text-foreground/60"> x = </span>
                <span className="text-green-500/70">"hi"</span>
              </div>
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

export default CodeBlockStyleSettings;
