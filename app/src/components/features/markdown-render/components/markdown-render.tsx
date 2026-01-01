import React, { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

import {
  CodeRender,
  TableRender,
  HeadingRender,
  ParagraphRender,
  BlockquoteRender,
  ListRender,
  ImageRender,
} from './renderers';

interface MarkdownRendererProps {
  markdown: string;
  className?: string;
  fontFamily?: string;
  fontSize?: number | string;
  lineHeight?: number;
  letterSpacing?: number | string;
}

/**
 * Markdown renderer with custom component styling
 */
const MarkdownRenderer: React.FC<MarkdownRendererProps> = memo(
  ({ markdown, className = '', fontFamily, fontSize, lineHeight, letterSpacing }) => {
    const containerStyle: React.CSSProperties = useMemo(
      () => ({
        fontFamily: fontFamily,
        fontSize: fontSize !== undefined ? `${fontSize}` : undefined,
        lineHeight: lineHeight !== undefined ? `${lineHeight}` : undefined,
        letterSpacing: letterSpacing !== undefined ? `${letterSpacing}px` : undefined,
      }),
      [fontFamily, fontSize, lineHeight, letterSpacing]
    );

    const components = useMemo(
      () => ({
        // Headings
        h1: (props: React.ComponentPropsWithoutRef<'h1'>) => <HeadingRender level={1} {...props} />,
        h2: (props: React.ComponentPropsWithoutRef<'h2'>) => <HeadingRender level={2} {...props} />,
        h3: (props: React.ComponentPropsWithoutRef<'h3'>) => <HeadingRender level={3} {...props} />,

        // Paragraphs
        p: (props: React.ComponentPropsWithoutRef<'p'>) => <ParagraphRender {...props} />,

        // Blockquotes
        blockquote: (props: React.ComponentPropsWithoutRef<'blockquote'>) => (
          <BlockquoteRender {...props} />
        ),

        // Code blocks
        code: (props: React.ComponentPropsWithoutRef<'code'> & { inline?: boolean }) => {
          if (props?.inline) {
            return (
              <code className="px-1.5 py-0.5 text-primary/95 font-cascadia-code break-words text-[0.9em] bg-primary/10 rounded-lg">
                {props.children}
              </code>
            );
          }
          return <CodeRender {...props} />;
        },

        // Lists
        ul: (props: React.ComponentPropsWithoutRef<'ul'>) => (
          <ListRender type="ul" props={{ ...props }} />
        ),
        ol: (props: React.ComponentPropsWithoutRef<'ol'>) => (
          <ListRender type="ol" props={{ ...props }} />
        ),

        // Tables
        table: (props: React.ComponentPropsWithoutRef<'table'>) => (
          <div className="my-4 overflow-x-auto rounded-2xl border border-border">
            <TableRender type="table" props={{ ...props }} />
          </div>
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

        // Images
        img: (props: React.ComponentPropsWithoutRef<'img'>) => (
          <ImageRender
            {...props}
            className="max-w-full h-auto rounded-md my-4"
            alt={props.alt ?? 'Image'}
          />
        ),
      }),
      []
    );

    return (
      <div className={cn('markdown-content', className)} style={containerStyle}>
        <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
          {markdown}
        </ReactMarkdown>
      </div>
    );
  }
);

export default MarkdownRenderer;
