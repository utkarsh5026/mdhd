import React from 'react';
import type { Components } from 'react-markdown';

import CodeRender from './code-render';
import HeadingRender from './heading-render';
import ImageRender from './image-render';
import LinkRender from './link-render';
import ListRender from './list-render';
import ParagraphRender from './paragraph-render';
import TableRender from './table-render';
import HorizontalRuleRender from './horizontal-rule-render';
import BlockquoteRender from './block-render';

export const markdownComponents: Components = {
  h1: (props: React.ComponentPropsWithoutRef<'h1'>) => <HeadingRender level={1} {...props} />,
  h2: (props: React.ComponentPropsWithoutRef<'h2'>) => <HeadingRender level={2} {...props} />,
  h3: (props: React.ComponentPropsWithoutRef<'h3'>) => <HeadingRender level={3} {...props} />,
  h4: (props: React.ComponentPropsWithoutRef<'h4'>) => <HeadingRender level={4} {...props} />,
  h5: (props: React.ComponentPropsWithoutRef<'h5'>) => <HeadingRender level={5} {...props} />,

  p: (props: React.ComponentPropsWithoutRef<'p'>) => <ParagraphRender {...props} />,

  blockquote: (props: React.ComponentPropsWithoutRef<'blockquote'>) => (
    <BlockquoteRender {...props} />
  ),

  code: ({ className, children, ...props }: React.ComponentPropsWithoutRef<'code'>) => {
    const hasLanguageClass = /language-\w+/.test(className ?? '');
    const content = String(children).replace(/\n$/, '');
    const isMultiline = content.includes('\n');
    const isBlock = hasLanguageClass || isMultiline;

    if (!isBlock) {
      return (
        <code className="px-1.5 py-0.5 text-primary/95 font-cascadia-code wrap-break-word text-[0.9em] bg-primary/10 rounded-lg">
          {children}
        </code>
      );
    }
    return (
      <CodeRender className={className} {...props}>
        {children}
      </CodeRender>
    );
  },

  ul: (props: React.ComponentPropsWithoutRef<'ul'>) => (
    <ListRender type="ul" props={{ ...props }} />
  ),
  ol: (props: React.ComponentPropsWithoutRef<'ol'>) => (
    <ListRender type="ol" props={{ ...props }} />
  ),
  li: (props: React.ComponentPropsWithoutRef<'li'>) => (
    <ListRender type="li" props={{ ...props }} />
  ),

  a: (props: React.ComponentPropsWithoutRef<'a'>) => <LinkRender {...props} />,

  hr: (props: React.ComponentPropsWithoutRef<'hr'>) => <HorizontalRuleRender {...props} />,

  table: (props: React.ComponentPropsWithoutRef<'table'>) => (
    <TableRender type="table" props={{ ...props }} />
  ),
  thead: (props: React.ComponentPropsWithoutRef<'thead'>) => (
    <TableRender type="thead" props={{ ...props }} />
  ),
  tbody: (props: React.ComponentPropsWithoutRef<'tbody'>) => (
    <TableRender type="tbody" props={{ ...props }} />
  ),
  tr: (props: React.ComponentPropsWithoutRef<'tr'>) => (
    <TableRender type="tr" props={{ ...props }} />
  ),
  th: (props: React.ComponentPropsWithoutRef<'th'>) => (
    <TableRender type="th" props={{ ...props }} />
  ),
  td: (props: React.ComponentPropsWithoutRef<'td'>) => (
    <TableRender type="td" props={{ ...props }} />
  ),

  img: (props: React.ComponentPropsWithoutRef<'img'>) => (
    <ImageRender
      {...props}
      className="max-w-full h-auto rounded-md my-4"
      alt={props.alt ?? 'Image'}
    />
  ),
};
