import React, { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

import { ReactErrorBoundary } from '@/components/utils/react-error-boundary';
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
        <ReactErrorBoundary
          fallback={
            <div className="p-4 text-sm text-muted-foreground border border-destructive/20 rounded-md bg-destructive/5">
              Failed to render this section. Try refreshing the page.
            </div>
          }
        >
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
                    code: [
                      ...(defaultSchema.attributes?.code || []),
                      ['className', /^language-[\w+-]+$/],
                    ],
                  },
                },
              ],
            ]}
          >
            {markdown}
          </ReactMarkdown>
        </ReactErrorBoundary>
      </div>
    );
  }
);

MarkdownRenderer.displayName = 'MarkdownRenderer';

export default MarkdownRenderer;
