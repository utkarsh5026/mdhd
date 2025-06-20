import type {
  ComponentSelection,
  ComponentType,
} from "../../services/component-service";
import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";
import { useEnhancedChatStore } from "../../../chat-llm/store/chat-store";
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

/**
 * Enhanced Component Wrapper with full conversation integration
 *
 * This wrapper provides rich interaction capabilities for markdown components:
 * - Ask questions about specific components via dialog
 * - Add components to active conversation context
 * - Visual feedback for component states
 * - Dropdown chat interface for quick questions
 * - Seamless integration with conversation management
 */
const EnhancedComponentWrapper: React.FC<ComponentWrapperProps> = ({
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAddedFeedback, setShowAddedFeedback] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Enhanced chat store hooks
  const getActiveConversation = useEnhancedChatStore(
    (state) => state.getActiveConversation
  );
  const addComponentToConversation = useEnhancedChatStore(
    (state) => state.addComponentToConversation
  );
  const setVisibility = useEnhancedChatStore((state) => state.setVisibility);

  /**
   * Extract meaningful content from the wrapped component
   * Different strategies for different component types
   */
  const extractContent = useCallback((): string => {
    if (!contentRef.current) return "";

    switch (componentType) {
      case "code": {
        // For code blocks, prioritize <code> elements, then <pre>, then text
        const codeElement = contentRef.current.querySelector("code");
        if (codeElement) {
          return codeElement.textContent || "";
        }
        const preElement = contentRef.current.querySelector("pre");
        if (preElement) {
          return preElement.textContent || "";
        }
        return contentRef.current.textContent || "";
      }

      case "table": {
        // For tables, create a structured text representation
        const table = contentRef.current.querySelector("table");
        if (table) {
          const rows = Array.from(table.querySelectorAll("tr"));
          return rows
            .map((row) => {
              const cells = Array.from(row.querySelectorAll("td, th"));
              return cells
                .map((cell) => cell.textContent?.trim() || "")
                .filter(Boolean)
                .join(" | ");
            })
            .filter(Boolean)
            .join("\n");
        }
        return contentRef.current.textContent || "";
      }

      case "blockquote": {
        // For blockquotes, get the inner text without quote markers
        const text = contentRef.current.textContent || "";
        return text.replace(/^[">]*\s*/, "").trim();
      }

      case "list": {
        // For lists, create a numbered/bulleted text representation
        const listItems = Array.from(contentRef.current.querySelectorAll("li"));
        return listItems
          .map((li, index) => {
            const text = li.textContent?.trim() || "";
            const isOrdered = li.closest("ol") !== null;
            const prefix = isOrdered ? `${index + 1}. ` : "• ";
            return prefix + text;
          })
          .join("\n");
      }

      case "heading": {
        // For headings, get clean text without hash markers
        const text = contentRef.current.textContent || "";
        return text.replace(/^#+\s*/, "").trim();
      }

      default:
        // For everything else, just get the text content
        return contentRef.current.textContent || "";
    }
  }, [componentType]);

  /**
   * Generate a smart ID for the component
   * Uses content hash for consistency across renders
   */
  const generateId = useCallback(() => {
    const content = extractContent();
    const contentHash = content.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    return `${sectionId}-${componentType}-${Math.abs(contentHash)}`;
  }, [sectionId, componentType, extractContent]);

  /**
   * Generate a meaningful title for the component
   * Creates human-readable descriptions based on content and type
   */
  const generateTitle = useCallback(() => {
    const content = extractContent();
    const preview = content.slice(0, 60).trim();

    switch (componentType) {
      case "code": {
        const lang = metadata.language ? ` (${metadata.language})` : "";
        const lines = content.split("\n").length;
        const lineText = lines === 1 ? "line" : "lines";
        return `Code Block${lang} - ${lines} ${lineText}`;
      }

      case "table": {
        const rows = content.split("\n").length;
        const rowText = rows === 1 ? "row" : "rows";
        return `Table with ${rows} ${rowText}`;
      }

      case "heading": {
        const level = metadata.level || 1;
        return `H${level}: ${preview}`;
      }

      case "blockquote":
        return `Quote: ${preview}`;

      case "list": {
        const items = content.split("\n").length;
        const itemText = items === 1 ? "item" : "items";
        return `List with ${items} ${itemText}`;
      }

      case "image": {
        const alt = metadata.alt || "Image";
        return `Image: ${alt}`;
      }

      default:
        return `${componentType}: ${preview}`;
    }
  }, [componentType, metadata, extractContent]);

  /**
   * Handle asking a question about this component
   * Show dropdown instead of opening dialog
   */
  const handleAsk = useCallback(() => {
    // Toggle the dropdown instead of opening dialog
    setIsDropdownOpen(true);
  }, []);

  /**
   * Handle adding component to current conversation
   * Creates conversation if none exists, provides visual feedback
   */
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

    // Add to active conversation (will create new one if needed)
    addComponentToConversation(selection);

    // Show visual feedback
    setShowAddedFeedback(true);
    setTimeout(() => setShowAddedFeedback(false), 2000);

    // Show success toast
    toast.success(`Added ${componentType} to conversation`, {
      description: selection.title,
      duration: 3000,
    });

    // Auto-open chat sidebar
    setVisibility(true);

    // Call legacy callback if provided
    onAddToChat?.(selection);
  }, [
    generateId,
    componentType,
    generateTitle,
    extractContent,
    sectionId,
    sectionTitle,
    metadata,
    addComponentToConversation,
    setVisibility,
    onAddToChat,
  ]);

  /**
   * Handle asking with a specific question (from dropdown)
   */
  const handleAskWithQuestion = useCallback(
    (question: string) => {
      const selection: ComponentSelection = {
        id: generateId(),
        type: componentType,
        title: generateTitle(),
        content: extractContent(),
        sectionId,
        sectionTitle,
        metadata,
      };

      // This will be handled by the conversation LLM hook
      // The dropdown should integrate with the ask dialog or conversation system
      onAsk?.(selection, question);
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

  // Check if component is already in active conversation
  const activeConversation = getActiveConversation();
  const isInContext =
    activeConversation?.selectedComponents.some((comp) => {
      const currentContent = extractContent();
      return (
        comp.content === currentContent &&
        comp.type === componentType &&
        comp.sectionId === sectionId
      );
    }) || false;

  // Create current component selection for dropdown
  const currentComponent: ComponentSelection = {
    id: generateId(),
    type: componentType,
    title: generateTitle(),
    content: extractContent(),
    sectionId,
    sectionTitle,
    metadata,
  };

  // Update the showButtons logic to keep buttons visible when dropdown is open
  const showButtons = isHovering || isDropdownOpen || showAddedFeedback;

  return (
    <div
      ref={contentRef}
      className={cn(
        "relative group transition-all duration-300 rounded-2xl",
        isHovering && "bg-transparent ring-1 ring-primary/20",
        isInContext && "ring-1 ring-green-500/30 bg-green-500/5",
        className
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        if (!isDropdownOpen) {
          setIsHovering(false);
        }
      }}
    >
      {children}

      {/* Interaction buttons - Always render ChatDropdown when open */}
      <AnimatePresence>
        {showButtons && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{
              duration: 0.2,
              ease: [0.4, 0, 0.2, 1],
              type: "spring",
              stiffness: 400,
              damping: 25,
            }}
            className="absolute -top-3 -right-3 flex gap-2 z-20"
          >
            {/* Chat Dropdown Button - Always render when dropdown is open */}
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <ChatDropdown
                currentComponent={currentComponent}
                onAskWithQuestion={handleAskWithQuestion}
                open={isDropdownOpen}
                onOpenChange={(open) => {
                  setIsDropdownOpen(open);
                  // When dropdown closes, also reset hover state
                  if (!open) {
                    setIsHovering(false);
                  }
                }}
              />
            </motion.div>

            {/* Add to Chat Button - Only show when hovering or showing feedback */}
            {(showButtons || showAddedFeedback) && (
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleAddToChat}
                  disabled={isInContext}
                  className={cn(
                    "h-8 w-8 p-0 shadow-lg border border-border rounded-full transition-all duration-200 cursor-pointer group",
                    isInContext
                      ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800"
                      : showAddedFeedback
                      ? "bg-green-500 text-white border-green-500"
                      : "bg-background hover:bg-green-600 hover:text-white hover:border-green-600"
                  )}
                  title={
                    isInContext
                      ? "Already in conversation context"
                      : "Add to conversation context"
                  }
                >
                  <AnimatePresence mode="wait">
                    {showAddedFeedback ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 90 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Check className="h-4 w-4" />
                      </motion.div>
                    ) : isInContext ? (
                      <motion.div
                        key="sparkles"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Sparkles className="h-4 w-4" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="plus"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Plus className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Context indicator */}
      {isInContext && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-2 -left-2 z-10"
        >
          <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded-full text-xs font-medium border border-green-200 dark:border-green-800">
            <Sparkles className="w-3 h-3" />
            <span>In Context</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default EnhancedComponentWrapper;
