import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { useCodeThemeStore } from "@/components/features/settings/store/code-theme";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface ChatMarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Markdown renderer optimized for chat messages with improved readability
 * Provides comfortable spacing suitable for chat bubbles
 */
const ChatMarkdownRenderer: React.FC<ChatMarkdownRendererProps> = ({
  content,
  className,
}) => {
  const { getCurrentThemeStyle } = useCodeThemeStore();
  const codeThemeStyle = getCurrentThemeStyle();

  const components = {
    // Headings - improved spacing for better readability
    h1: ({ children }: { children: React.ReactNode }) => (
      <h1 className="text-lg font-semibold mt-4 mb-3 first:mt-0 leading-snug">
        {children}
      </h1>
    ),
    h2: ({ children }: { children: React.ReactNode }) => (
      <h2 className="text-base font-semibold mt-4 mb-2 first:mt-0 leading-snug">
        {children}
      </h2>
    ),
    h3: ({ children }: { children: React.ReactNode }) => (
      <h3 className="text-sm font-medium mt-3 mb-2 first:mt-0 leading-snug">
        {children}
      </h3>
    ),

    // Paragraphs - better spacing for readability
    p: ({ children }: { children: React.ReactNode }) => (
      <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
    ),

    // Lists - improved spacing between items
    ul: ({ children }: { children: React.ReactNode }) => (
      <ul className="ml-4 mb-3 last:mb-0 list-disc space-y-1.5">{children}</ul>
    ),
    ol: ({ children }: { children: React.ReactNode }) => (
      <ol className="ml-4 mb-3 last:mb-0 list-decimal space-y-1.5">
        {children}
      </ol>
    ),
    li: ({ children }: { children: React.ReactNode }) => (
      <li className="leading-relaxed py-0.5">{children}</li>
    ),

    // Code - with syntax highlighting
    code: ({
      inline,
      className: codeClassName,
      children,
    }: {
      inline?: boolean;
      className?: string;
      children: React.ReactNode;
    }) => {
      const match = /language-(\w+)/.exec(codeClassName || "");
      const language = match ? match[1] : "";

      if (inline || !String(children).includes("\n")) {
        return (
          <span className="text-primary px-1.5 py-1 rounded text-sm font-mono font-bold">
            {children}
          </span>
        );
      }

      return (
        <ScrollArea
          className="my-4 rounded-2xl overflow-x-auto relative"
          dir="ltr"
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-0 right-0"
            onClick={() => {
              navigator.clipboard.writeText(String(children));
              toast.success("Copied to clipboard");
            }}
          >
            <Copy className="w-4 h-4" />
          </Button>
          <SyntaxHighlighter
            style={codeThemeStyle}
            language={language || "text"}
            PreTag="div"
            customStyle={{
              margin: 0,
              padding: "1rem",
              fontSize: "0.875rem",
              lineHeight: "1.5",
              borderRadius: "0.5rem",
              backgroundColor: "transparent",
            }}
            wrapLongLines
            codeTagProps={{
              style: {
                fontSize: "0.875rem",
                fontFamily:
                  "Cascadia Code, ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
              },
            }}
          >
            {String(children).replace(/\n$/, "")}
          </SyntaxHighlighter>
        </ScrollArea>
      );
    },

    // Blockquotes - more breathing room
    blockquote: ({ children }: { children: React.ReactNode }) => (
      <blockquote className="border-l-3 border-muted-foreground/30 pl-4 py-2 my-4 italic text-muted-foreground bg-muted/20 rounded-r">
        {children}
      </blockquote>
    ),

    // Links
    a: ({ href, children }: { href?: string; children: React.ReactNode }) => (
      <a
        href={href}
        target={href?.startsWith("http") ? "_blank" : undefined}
        rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
        className="text-primary hover:underline break-words"
      >
        {children}
      </a>
    ),

    // Tables - better spacing and readability
    table: ({ children }: { children: React.ReactNode }) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full text-sm border-collapse border border-muted/30 rounded-lg overflow-hidden">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: { children: React.ReactNode }) => (
      <thead className="bg-muted/50">{children}</thead>
    ),
    tbody: ({ children }: { children: React.ReactNode }) => (
      <tbody>{children}</tbody>
    ),
    tr: ({ children }: { children: React.ReactNode }) => (
      <tr className="border-b border-muted/30">{children}</tr>
    ),
    th: ({ children }: { children: React.ReactNode }) => (
      <th className="px-3 py-2 text-left font-medium border-r border-muted/30 last:border-r-0">
        {children}
      </th>
    ),
    td: ({ children }: { children: React.ReactNode }) => (
      <td className="px-3 py-2 border-r border-muted/30 last:border-r-0">
        {children}
      </td>
    ),

    // Horizontal rule - more space around it
    hr: () => <hr className="border-muted-foreground/30 my-6" />,

    // Strong and emphasis
    strong: ({ children }: { children: React.ReactNode }) => (
      <strong className="font-semibold">{children}</strong>
    ),
    em: ({ children }: { children: React.ReactNode }) => (
      <em className="italic">{children}</em>
    ),
  };

  return (
    <div className={cn("prose-chat text-inherit leading-relaxed", className)}>
      <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default ChatMarkdownRenderer;
