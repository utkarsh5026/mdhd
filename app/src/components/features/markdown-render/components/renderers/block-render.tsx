import React from 'react';

import { useMarkdownStyleStore } from '@/components/features/markdown-style/store/markdown-style-store';
import { cn } from '@/lib/utils';

const BLOCKQUOTE_CLASSES = {
  border: [
    'border-l-4 sm:border-l-[5px] border-primary/40',
    'bg-card/50 backdrop-blur-sm',
    'rounded-xl sm:rounded-3xl',
    'font-normal italic',
    'text-foreground/85',
    'shadow-sm',
  ].join(' '),
  card: [
    'border border-primary/20',
    'bg-primary/5',
    'rounded-xl sm:rounded-3xl',
    'font-normal',
    'text-foreground/85',
    'shadow-sm',
  ].join(' '),
  minimal: [
    'border-none bg-transparent shadow-none',
    'pl-5 sm:pl-7',
    'font-normal italic',
    'text-foreground/55',
  ].join(' '),
};

const BlockquoteRender: React.FC<React.ComponentPropsWithoutRef<'blockquote'>> = (props) => {
  const blockquoteStyle = useMarkdownStyleStore((s) => s.settings.blockquoteStyle);

  return (
    <blockquote
      {...props}
      className={cn(
        BLOCKQUOTE_CLASSES[blockquoteStyle],
        'px-4 sm:px-6 lg:px-7',
        'my-5 sm:my-7 lg:my-8',
        'py-3 sm:py-5 lg:py-6',
        'text-base sm:text-lg',
        'leading-relaxed sm:leading-7 lg:leading-8',
        'text-pretty wrap-break-word',
        'tracking-normal',
        'transition-all duration-200',
        'relative',
        'selection:bg-primary/20',
        props.className
      )}
    />
  );
};

export default BlockquoteRender;
