import type {
  ComponentSelection,
  ComponentType,
} from "../../services/component-service";
import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus, Sparkles } from "lucide-react";

// Import chat store
import { useSimpleChatStore } from "../../../chat-llm/store/chat-store";
import ChatDropdown from "../chat-dropdown/ChatDropdown";

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
  const contentRef = useRef<HTMLDivElement>(null);

  // Chat store hooks
  const selectedComponents = useSimpleChatStore(
    (state) => state.selectedComponents
  );
  const addComponentToChat = useSimpleChatStore(
    (state) => state.addComponentToChat
  );

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

      // Add component to chat if not already there
      const exists = selectedComponents.some((c) => c.id === selection.id);
      if (!exists) {
        addComponentToChat(selection);
      }
    },
    [
      generateId,
      componentType,
      generateTitle,
      extractContent,
      sectionId,
      sectionTitle,
      metadata,
      selectedComponents,
      addComponentToChat,
    ]
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

    addComponentToChat(selection);
  }, [
    generateId,
    componentType,
    generateTitle,
    extractContent,
    sectionId,
    sectionTitle,
    metadata,
    addComponentToChat,
  ]);

  // Create current component selection
  const currentComponent: ComponentSelection = {
    id: generateId(),
    type: componentType,
    title: generateTitle(),
    content: extractContent(),
    sectionId,
    sectionTitle,
    metadata,
  };

  const isInContext = selectedComponents.some(
    (c) => c.content === currentComponent.content && c.type === componentType
  );

  return (
    <div
      ref={contentRef}
      className={cn(
        "relative group transition-all duration-200 rounded-2xl",
        isHovering && "bg-transparent ring-1 ring-primary/20 border-none",
        className
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {children}

      {/* Interaction buttons */}
      <AnimatePresence>
        {isHovering && (onAsk || onAddToChat) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute -top-2 -right-2 flex gap-1 z-10"
          >
            {onAsk && (
              <ChatDropdown
                currentComponent={currentComponent}
                onAskWithQuestion={handleAskWithQuestion}
              />
            )}

            {onAddToChat && (
              <Button
                size="sm"
                variant="secondary"
                className={cn(
                  "h-7 w-7 p-0 shadow-md border border-border rounded-full cursor-pointer transition-colors",
                  isInContext
                    ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800"
                    : "bg-background hover:bg-green-600 hover:text-white"
                )}
                onClick={handleAddToChat}
                disabled={isInContext}
                title={
                  isInContext ? "Already in context" : "Add to chat context"
                }
              >
                {isInContext ? (
                  <Sparkles className="h-3 w-3" />
                ) : (
                  <Plus className="h-3 w-3" />
                )}
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ComponentWrapper;
