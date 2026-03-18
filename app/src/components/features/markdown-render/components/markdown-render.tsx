import React, { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

import { cn } from '@/lib/utils';

import { markdownComponents } from './renderers';

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

    return (
      <div className={cn('markdown-content', className)} style={containerStyle}>
        <ReactMarkdown
          components={markdownComponents}
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[
            [
              rehypeSanitize,
              {
                ...defaultSchema,
                attributes: {
                  ...defaultSchema.attributes,
                  code: [...(defaultSchema.attributes?.code || []), ['className', /^language-./]],
                },
              },
            ],
          ]}
        >
          {markdown}
        </ReactMarkdown>
      </div>
    );
  }
);

MarkdownRenderer.displayName = 'MarkdownRenderer';

export default MarkdownRenderer;
