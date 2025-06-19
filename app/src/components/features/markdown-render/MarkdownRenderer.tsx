import React, { memo, useMemo, useState, useCallback, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Plus, ChevronDown, Send } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import type {
  ComponentSelection,
  ComponentType,
} from "./services/component-service";
import {
  CodeRender,
  TableRender,
  HeadingRender,
  ParagraphRender,
  BlockquoteRender,
  ListRender,
  ImageRender,
} from "./components";

interface InteractiveWrapperProps {
  componentType: ComponentType;
  children: React.ReactNode;
  sectionId: string;
  sectionTitle: string;
  onAsk?: (selection: ComponentSelection, question: string) => void;
  onAddToChat?: (selection: ComponentSelection) => void;
  metadata?: ComponentSelection["metadata"];
  className?: string;
}

/**
 * Get predefined questions based on component type
 */
const getQuestionsForComponentType = (
  componentType: ComponentType
): string[] => {
  const commonQuestions = [
    "Explain this in simple terms",
    "What is the purpose of this?",
    "How does this work?",
    "Can you provide more context?",
  ];

  const typeSpecificQuestions: Record<ComponentType, string[]> = {
    code: [
      "What does this code do?",
      "Explain this code step by step",
      "Are there any potential issues with this code?",
      "How can this code be improved?",
      "What language/framework is this?",
    ],
    table: [
      "What does this data show?",
      "Explain the relationships in this table",
      "What are the key insights from this data?",
      "How should I interpret this table?",
    ],
    heading: [
      "What is covered in this section?",
      "Summarize this section",
      "What are the main points here?",
    ],
    list: [
      "Explain each item in this list",
      "What's the significance of these points?",
      "How are these items related?",
      "Prioritize these items by importance",
    ],
    blockquote: [
      "Who said this quote?",
      "What's the context of this quote?",
      "Explain the meaning of this quote",
    ],
    image: [
      "Describe what's in this image",
      "What does this image represent?",
      "How does this image relate to the content?",
    ],
    paragraph: [
      "Summarize this paragraph",
      "What are the key points here?",
      "Explain this in simpler terms",
    ],
  };

  return [...(typeSpecificQuestions[componentType] || []), ...commonQuestions];
};

/**
 * Simple wrapper that adds hover interactions to any markdown component
 * Extracts content directly from the wrapped element when needed
 */
const InteractiveWrapper: React.FC<InteractiveWrapperProps> = ({
  componentType,
  children,
  sectionId,
  sectionTitle,
  onAsk,
  onAddToChat,
  metadata = {},
  className,
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [customQuestion, setCustomQuestion] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Extract content from the wrapped element
  const extractContent = useCallback((): string => {
    if (!contentRef.current) return "";

    // For code blocks, get the text content directly
    if (componentType === "code") {
      const codeElement = contentRef.current.querySelector("code, pre");
      return codeElement?.textContent || contentRef.current.textContent || "";
    }

    // For tables, extract table data in a readable format
    if (componentType === "table") {
      const table = contentRef.current.querySelector("table");
      if (table) {
        const rows = Array.from(table.querySelectorAll("tr"));
        return rows
          .map((row) => {
            const cells = Array.from(row.querySelectorAll("td, th"));
            return cells.map((cell) => cell.textContent?.trim()).join(" | ");
          })
          .join("\n");
      }
    }

    // For everything else, just get the text content
    return contentRef.current.textContent || "";
  }, [componentType]);

  // Generate a simple ID
  const generateId = useCallback(() => {
    return `${sectionId}-${componentType}-${Date.now()}`;
  }, [sectionId, componentType]);

  // Generate a title for the component
  const generateTitle = useCallback(() => {
    const content = extractContent();
    const preview = content.slice(0, 50);

    switch (componentType) {
      case "code": {
        const lang = metadata.language ? ` (${metadata.language})` : "";
        return `Code Block${lang}`;
      }
      case "table":
        return "Table";
      case "heading":
        return `Heading: ${preview}`;
      case "blockquote":
        return `Quote: ${preview}`;
      case "list":
        return `List: ${preview}`;
      default:
        return `${componentType}: ${preview}`;
    }
  }, [componentType, metadata, extractContent]);

  const handleAskWithQuestion = useCallback(
    (question: string) => {
      if (!question.trim()) return;

      const selection: ComponentSelection = {
        id: generateId(),
        type: componentType,
        title: generateTitle(),
        content: extractContent(),
        sectionId,
        sectionTitle,
        metadata,
      };
      onAsk?.(selection, question);
      setDropdownOpen(false);
      setCustomQuestion("");
    },
    [
      generateId,
      componentType,
      generateTitle,
      extractContent,
      sectionId,
      sectionTitle,
      metadata,
      onAsk,
    ]
  );

  const handleSubmitCustomQuestion = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      handleAskWithQuestion(customQuestion);
    },
    [customQuestion, handleAskWithQuestion]
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleAskWithQuestion(customQuestion);
      }
    },
    [customQuestion, handleAskWithQuestion]
  );

  const handleAddToChat = useCallback(() => {
    const selection: ComponentSelection = {
      id: generateId(),
      type: componentType,
      title: generateTitle(),
      content: extractContent(),
      sectionId,
      sectionTitle,
      metadata,
    };
    onAddToChat?.(selection);
  }, [
    generateId,
    componentType,
    generateTitle,
    extractContent,
    sectionId,
    sectionTitle,
    metadata,
    onAddToChat,
  ]);

  // Focus input when dropdown opens
  const handleDropdownOpenChange = useCallback((open: boolean) => {
    setDropdownOpen(open);
    if (open) {
      // Focus the input after a small delay to ensure dropdown is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setCustomQuestion("");
    }
  }, []);

  const questions = getQuestionsForComponentType(componentType);

  return (
    <div
      ref={contentRef}
      className={cn(
        "relative group transition-all duration-200 rounded-2xl",
        (isHovering || dropdownOpen) &&
          "bg-transparent ring-1 ring-primary/20 border-none",
        className
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {children}

      {/* Interaction buttons */}
      <AnimatePresence>
        {(isHovering || dropdownOpen) && (onAsk || onAddToChat) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute -top-2 -right-2 flex gap-1 z-10"
          >
            {onAsk && (
              <DropdownMenu
                open={dropdownOpen}
                onOpenChange={handleDropdownOpenChange}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 px-2 py-0 shadow-md bg-background border border-border hover:bg-primary hover:text-primary-foreground rounded-full cursor-pointer"
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    <ChevronDown className="h-2 w-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-72 max-h-96 overflow-hidden"
                  side="bottom"
                  sideOffset={5}
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  {/* Custom Question Input */}
                  <div className="p-3 border-b border-border">
                    <DropdownMenuLabel className="text-xs font-medium text-muted-foreground mb-2 px-0">
                      Ask about this {componentType}
                    </DropdownMenuLabel>
                    <form
                      onSubmit={handleSubmitCustomQuestion}
                      className="flex gap-2"
                    >
                      <Input
                        ref={inputRef}
                        value={customQuestion}
                        onChange={(e) => setCustomQuestion(e.target.value)}
                        placeholder="Type your question..."
                        className="text-sm h-8 flex-1"
                        onKeyPress={handleKeyPress}
                      />
                      <Button
                        type="submit"
                        size="sm"
                        className="h-8 w-8 p-0"
                        disabled={!customQuestion.trim()}
                      >
                        <Send className="h-3 w-3" />
                      </Button>
                    </form>
                  </div>

                  {/* Predefined Questions */}
                  <div className="max-h-60 overflow-y-auto">
                    <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                      Quick questions
                    </DropdownMenuLabel>
                    {questions.map((question, index) => (
                      <DropdownMenuItem
                        key={index}
                        onClick={() => handleAskWithQuestion(question)}
                        className="text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground px-3 py-2"
                      >
                        {question}
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {onAddToChat && (
              <Button
                size="sm"
                variant="secondary"
                className="h-7 w-7 p-0 shadow-md bg-background border border-border hover:bg-green-600 hover:text-white rounded-full cursor-pointer"
                onClick={handleAddToChat}
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface SimpleInteractiveMarkdownProps {
  markdown: string;
  sectionId: string;
  sectionTitle: string;
  className?: string;
  fontFamily?: string;
  fontSize?: number | string;
  lineHeight?: number;
  letterSpacing?: number | string;
  onComponentAsk?: (selection: ComponentSelection, question: string) => void;
  onComponentAddToChat?: (selection: ComponentSelection) => void;
  enableInteractions?: boolean;
}

/**
 * Simple interactive markdown renderer that wraps components with interaction capabilities
 * Much simpler approach - just wraps existing rendered components!
 */
const SimpleInteractiveMarkdown: React.FC<SimpleInteractiveMarkdownProps> =
  memo(
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
      onComponentAddToChat,
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
              <InteractiveWrapper
                componentType="heading"
                sectionId={sectionId}
                sectionTitle={sectionTitle}
                onAsk={onComponentAsk}
                onAddToChat={onComponentAddToChat}
                metadata={{ level: 1 }}
              >
                <HeadingRender level={1} {...props} />
              </InteractiveWrapper>
            ) : (
              <HeadingRender level={1} {...props} />
            ),

          h2: (props: React.ComponentPropsWithoutRef<"h2">) =>
            enableInteractions ? (
              <InteractiveWrapper
                componentType="heading"
                sectionId={sectionId}
                sectionTitle={sectionTitle}
                onAsk={onComponentAsk}
                onAddToChat={onComponentAddToChat}
                metadata={{ level: 2 }}
              >
                <HeadingRender level={2} {...props} />
              </InteractiveWrapper>
            ) : (
              <HeadingRender level={2} {...props} />
            ),

          h3: (props: React.ComponentPropsWithoutRef<"h3">) =>
            enableInteractions ? (
              <InteractiveWrapper
                componentType="heading"
                sectionId={sectionId}
                sectionTitle={sectionTitle}
                onAsk={onComponentAsk}
                onAddToChat={onComponentAddToChat}
                metadata={{ level: 3 }}
              >
                <HeadingRender level={3} {...props} />
              </InteractiveWrapper>
            ) : (
              <HeadingRender level={3} {...props} />
            ),

          // Wrap paragraphs
          p: (props: React.ComponentPropsWithoutRef<"p">) =>
            enableInteractions ? (
              <InteractiveWrapper
                componentType="paragraph"
                sectionId={sectionId}
                sectionTitle={sectionTitle}
                onAsk={onComponentAsk}
                onAddToChat={onComponentAddToChat}
              >
                <ParagraphRender {...props} />
              </InteractiveWrapper>
            ) : (
              <ParagraphRender {...props} />
            ),

          // Wrap blockquotes
          blockquote: (props: React.ComponentPropsWithoutRef<"blockquote">) =>
            enableInteractions ? (
              <InteractiveWrapper
                componentType="blockquote"
                sectionId={sectionId}
                sectionTitle={sectionTitle}
                onAsk={onComponentAsk}
                onAddToChat={onComponentAddToChat}
              >
                <BlockquoteRender {...props} />
              </InteractiveWrapper>
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
              <InteractiveWrapper
                componentType="code"
                sectionId={sectionId}
                sectionTitle={sectionTitle}
                onAsk={onComponentAsk}
                onAddToChat={onComponentAddToChat}
                metadata={{ language }}
                className="my-4"
              >
                <CodeRender {...props} />
              </InteractiveWrapper>
            ) : (
              <CodeRender {...props} />
            );
          },

          // Wrap lists
          ul: (props: React.ComponentPropsWithoutRef<"ul">) =>
            enableInteractions ? (
              <InteractiveWrapper
                componentType="list"
                sectionId={sectionId}
                sectionTitle={sectionTitle}
                onAsk={onComponentAsk}
                onAddToChat={onComponentAddToChat}
              >
                <ListRender type="ul" props={{ ...props }} />
              </InteractiveWrapper>
            ) : (
              <ListRender type="ul" props={{ ...props }} />
            ),

          ol: (props: React.ComponentPropsWithoutRef<"ol">) =>
            enableInteractions ? (
              <InteractiveWrapper
                componentType="list"
                sectionId={sectionId}
                sectionTitle={sectionTitle}
                onAsk={onComponentAsk}
                onAddToChat={onComponentAddToChat}
              >
                <ListRender type="ol" props={{ ...props }} />
              </InteractiveWrapper>
            ) : (
              <ListRender type="ol" props={{ ...props }} />
            ),

          // Wrap tables
          table: (props: React.ComponentPropsWithoutRef<"table">) =>
            enableInteractions ? (
              <InteractiveWrapper
                componentType="table"
                sectionId={sectionId}
                sectionTitle={sectionTitle}
                onAsk={onComponentAsk}
                onAddToChat={onComponentAddToChat}
                className="my-4"
              >
                <div className="overflow-x-auto rounded-2xl border border-border">
                  <TableRender type="table" props={{ ...props }} />
                </div>
              </InteractiveWrapper>
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
              <InteractiveWrapper
                componentType="image"
                sectionId={sectionId}
                sectionTitle={sectionTitle}
                onAsk={onComponentAsk}
                onAddToChat={onComponentAddToChat}
                metadata={{ alt: props.alt, href: props.src }}
              >
                <ImageRender
                  {...props}
                  className="max-w-full h-auto rounded-md my-4"
                  alt={props.alt ?? "Image"}
                />
              </InteractiveWrapper>
            ) : (
              <img
                {...props}
                className="max-w-full h-auto rounded-md my-4"
                alt={props.alt ?? "Image"}
              />
            ),
        }),
        [
          sectionId,
          sectionTitle,
          onComponentAsk,
          onComponentAddToChat,
          enableInteractions,
        ]
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

export default SimpleInteractiveMarkdown;
