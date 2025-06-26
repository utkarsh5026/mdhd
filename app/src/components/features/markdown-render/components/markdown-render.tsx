import React, { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import type { ComponentSelection } from "../services/component-service";
import ComponentWrapper from "./wrapper/ComponentWrapper";

import {
  CodeRender,
  TableRender,
  HeadingRender,
  ParagraphRender,
  BlockquoteRender,
  ListRender,
  ImageRender,
} from "./renderers";

interface MarkdownRendererProps {
  markdown: string;
  sectionId: string;
  sectionTitle: string;
  className?: string;
  fontFamily?: string;
  fontSize?: number | string;
  lineHeight?: number;
  letterSpacing?: number | string;
  onComponentAsk?: (selection: ComponentSelection, question: string) => void;
  enableInteractions?: boolean;
}

/**
 * Simple interactive markdown renderer that wraps components with interaction capabilities
 * Much simpler approach - just wraps existing rendered components!
 */
const MarkdownRenderer: React.FC<MarkdownRendererProps> = memo(
  ({
    markdown,
    sectionId,
    sectionTitle,
    className = "",
    fontFamily,
    fontSize,
    lineHeight,
    letterSpacing,
    onComponentAsk,
    enableInteractions = true,
  }) => {
    const containerStyle: React.CSSProperties = useMemo(
      () => ({
        fontFamily: fontFamily,
        fontSize: fontSize !== undefined ? `${fontSize}` : undefined,
        lineHeight: lineHeight !== undefined ? `${lineHeight}` : undefined,
        letterSpacing:
          letterSpacing !== undefined ? `${letterSpacing}px` : undefined,
      }),
      [fontFamily, fontSize, lineHeight, letterSpacing]
    );

    const components = useMemo(
      () => ({
        // Wrap headings
        h1: (props: React.ComponentPropsWithoutRef<"h1">) =>
          enableInteractions ? (
            <ComponentWrapper
              componentType="heading"
              sectionId={sectionId}
              sectionTitle={sectionTitle}
              onAsk={onComponentAsk}
              metadata={{ level: 1 }}
            >
              <HeadingRender level={1} {...props} />
            </ComponentWrapper>
          ) : (
            <HeadingRender level={1} {...props} />
          ),

        h2: (props: React.ComponentPropsWithoutRef<"h2">) =>
          enableInteractions ? (
            <ComponentWrapper
              componentType="heading"
              sectionId={sectionId}
              sectionTitle={sectionTitle}
              onAsk={onComponentAsk}
              metadata={{ level: 2 }}
            >
              <HeadingRender level={2} {...props} />
            </ComponentWrapper>
          ) : (
            <HeadingRender level={2} {...props} />
          ),

        h3: (props: React.ComponentPropsWithoutRef<"h3">) =>
          enableInteractions ? (
            <ComponentWrapper
              componentType="heading"
              sectionId={sectionId}
              sectionTitle={sectionTitle}
              onAsk={onComponentAsk}
              metadata={{ level: 3 }}
            >
              <HeadingRender level={3} {...props} />
            </ComponentWrapper>
          ) : (
            <HeadingRender level={3} {...props} />
          ),

        // Wrap paragraphs
        p: (props: React.ComponentPropsWithoutRef<"p">) =>
          enableInteractions ? (
            <ComponentWrapper
              componentType="paragraph"
              sectionId={sectionId}
              sectionTitle={sectionTitle}
              onAsk={onComponentAsk}
            >
              <ParagraphRender {...props} />
            </ComponentWrapper>
          ) : (
            <ParagraphRender {...props} />
          ),

        // Wrap blockquotes
        blockquote: (props: React.ComponentPropsWithoutRef<"blockquote">) =>
          enableInteractions ? (
            <ComponentWrapper
              componentType="blockquote"
              sectionId={sectionId}
              sectionTitle={sectionTitle}
              onAsk={onComponentAsk}
            >
              <BlockquoteRender {...props} />
            </ComponentWrapper>
          ) : (
            <BlockquoteRender {...props} />
          ),

        // Wrap code blocks
        code: (
          props: React.ComponentPropsWithoutRef<"code"> & { inline?: boolean }
        ) => {
          // Inline code - no interaction
          if (props?.inline) {
            return (
              <code className="px-2 py-1 text-primary font-cascadia-code break-words text-sm bg-primary/10 rounded-xl">
                {props.children}
              </code>
            );
          }

          // Block code - add interaction
          const className = props.className || "";
          const match = /language-(\w+)/.exec(className);
          const language = match ? match[1] : "";

          return enableInteractions ? (
            <ComponentWrapper
              componentType="code"
              sectionId={sectionId}
              sectionTitle={sectionTitle}
              onAsk={onComponentAsk}
              metadata={{ language }}
              className="my-4"
            >
              <CodeRender {...props} />
            </ComponentWrapper>
          ) : (
            <CodeRender {...props} />
          );
        },

        // Wrap lists
        ul: (props: React.ComponentPropsWithoutRef<"ul">) =>
          enableInteractions ? (
            <ComponentWrapper
              componentType="list"
              sectionId={sectionId}
              sectionTitle={sectionTitle}
              onAsk={onComponentAsk}
            >
              <ListRender type="ul" props={{ ...props }} />
            </ComponentWrapper>
          ) : (
            <ListRender type="ul" props={{ ...props }} />
          ),

        ol: (props: React.ComponentPropsWithoutRef<"ol">) =>
          enableInteractions ? (
            <ComponentWrapper
              componentType="list"
              sectionId={sectionId}
              sectionTitle={sectionTitle}
              onAsk={onComponentAsk}
            >
              <ListRender type="ol" props={{ ...props }} />
            </ComponentWrapper>
          ) : (
            <ListRender type="ol" props={{ ...props }} />
          ),

        // Wrap tables
        table: (props: React.ComponentPropsWithoutRef<"table">) =>
          enableInteractions ? (
            <ComponentWrapper
              componentType="table"
              sectionId={sectionId}
              sectionTitle={sectionTitle}
              onAsk={onComponentAsk}
              className="my-4"
            >
              <div className="overflow-x-auto rounded-2xl border border-border">
                <TableRender type="table" props={{ ...props }} />
              </div>
            </ComponentWrapper>
          ) : (
            <div className="my-4 overflow-x-auto rounded-2xl border border-border">
              <TableRender type="table" props={{ ...props }} />
            </div>
          ),

        // Table elements (when inside interactive table)
        thead: (props: React.ComponentPropsWithoutRef<"thead">) => (
          <TableRender type="thead" props={{ ...props }} />
        ),
        tbody: (props: React.ComponentPropsWithoutRef<"tbody">) => (
          <TableRender type="tbody" props={{ ...props }} />
        ),
        tr: (props: React.ComponentPropsWithoutRef<"tr">) => (
          <TableRender
            type="tr"
            props={{
              ...props,
            }}
          />
        ),
        th: (props: React.ComponentPropsWithoutRef<"th">) => (
          <TableRender
            type="th"
            props={{
              ...props,
            }}
          />
        ),
        td: (props: React.ComponentPropsWithoutRef<"td">) => (
          <TableRender type="td" props={{ ...props }} />
        ),

        // Wrap images
        img: (props: React.ComponentPropsWithoutRef<"img">) =>
          enableInteractions ? (
            <ComponentWrapper
              componentType="image"
              sectionId={sectionId}
              sectionTitle={sectionTitle}
              onAsk={onComponentAsk}
              metadata={{ alt: props.alt, href: props.src }}
            >
              <ImageRender
                {...props}
                className="max-w-full h-auto rounded-md my-4"
                alt={props.alt ?? "Image"}
              />
            </ComponentWrapper>
          ) : (
            <img
              {...props}
              className="max-w-full h-auto rounded-md my-4"
              alt={props.alt ?? "Image"}
            />
          ),
      }),
      [sectionId, sectionTitle, onComponentAsk, enableInteractions]
    );

    return (
      <div
        className={cn("markdown-content font-type-mono", className)}
        style={containerStyle}
      >
        <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
          {markdown}
        </ReactMarkdown>
      </div>
    );
  }
);

export default MarkdownRenderer;
