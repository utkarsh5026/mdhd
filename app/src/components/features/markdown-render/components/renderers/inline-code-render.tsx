import React from 'react';

import { useMarkdownStyleStore } from '@/components/features/markdown-style/store/markdown-style-store';
import { cn } from '@/lib/utils';

const STYLE_CLASSES = {
  primary: 'bg-primary/10 text-primary/95',
  muted: 'bg-muted text-foreground/80',
  bordered: 'border border-primary/30 text-primary/90',
  ghost: 'text-primary font-semibold',
} as const;

const SHAPE_CLASSES = {
  rounded: 'rounded',
  pill: 'rounded-full',
  sharp: 'rounded-none',
} as const;

const InlineCodeRender: React.FC<React.ComponentPropsWithoutRef<'code'>> = ({ children }) => {
  const inlineCodeStyle = useMarkdownStyleStore((s) => s.settings.inlineCodeStyle);
  const inlineCodeShape = useMarkdownStyleStore((s) => s.settings.inlineCodeShape);

  return (
    <code
      className={cn(
        'px-1.5 py-0.5 wrap-break-word text-[0.9em] transition-all duration-200',
        STYLE_CLASSES[inlineCodeStyle],
        SHAPE_CLASSES[inlineCodeShape]
      )}
    >
      {children}
    </code>
  );
};

export default InlineCodeRender;
