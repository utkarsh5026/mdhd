import type {
  ComponentSelection,
  ComponentType,
} from "../../services/component-service";
import { useState, useCallback, useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MessageSquare, Plus, ChevronDown, Send } from "lucide-react";

interface ComponentWrapperProps {
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
const ComponentWrapper: React.FC<ComponentWrapperProps> = ({
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

export default ComponentWrapper;
