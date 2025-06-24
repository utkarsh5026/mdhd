import type {
  ComponentSelection,
  ComponentType,
} from "../../services/component-service";
import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus, Sparkles, Check, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import ChatDropdown from "../chat-dropdown/ChatDropdown";
import {
  useComponent,
  useConversation,
} from "@/components/features/chat-llm/hooks";

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAddedFeedback, setShowAddedFeedback] = useState(false);
  const [extractedContent, setExtractedContent] = useState<string>("");
  const contentRef = useRef<HTMLDivElement>(null);

  const { activeConversation } = useConversation();
  const { addComponentToConversation } = useComponent();
  const selectedComponents = activeConversation?.selectedComponents;

  useEffect(() => {
    if (!contentRef.current) return;

    const extractContent = () => {
      if (!contentRef.current) return "";

      switch (componentType) {
        case "code": {
          const codeElement = contentRef.current.querySelector("code");
          if (codeElement) return codeElement.textContent || "";
          const preElement = contentRef.current.querySelector("pre");
          if (preElement) return preElement.textContent || "";
          return contentRef.current.textContent || "";
        }
        case "table": {
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
        case "heading": {
          const text = contentRef.current.textContent || "";
          return text.replace(/^#+\s*/, "").trim();
        }
        default:
          return contentRef.current.textContent || "";
      }
    };

    const content = extractContent();
    setExtractedContent(content);
  }, [componentType]);

  const title = useMemo(() => {
    if (!extractedContent) return `${componentType} component`;

    const preview = extractedContent.slice(0, 60).trim();
    switch (componentType) {
      case "code": {
        const lang = metadata?.language ? ` (${metadata.language})` : "";
        const lines = extractedContent.split("\n").length;
        const lineText = lines === 1 ? "line" : "lines";
        return `Code Block${lang} - ${lines} ${lineText}`;
      }
      case "table": {
        const rows = extractedContent.split("\n").length;
        const rowText = rows === 1 ? "row" : "rows";
        return `Table with ${rows} ${rowText}`;
      }
      case "heading": {
        const level = metadata?.level || 1;
        return `H${level}: ${preview}`;
      }
      default:
        return `${componentType}: ${preview}`;
    }
  }, [componentType, metadata, extractedContent]);

  const componentId = useMemo(() => {
    if (!extractedContent) return `${sectionId}-${componentType}-empty`;

    const contentHash = extractedContent.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return `${sectionId}-${componentType}-${Math.abs(contentHash)}`;
  }, [sectionId, componentType, extractedContent]);

  const currentComponent = useMemo<ComponentSelection>(
    () => ({
      id: componentId,
      type: componentType,
      title: title,
      content: extractedContent,
      sectionId,
      sectionTitle,
    }),
    [
      componentId,
      componentType,
      title,
      extractedContent,
      sectionId,
      sectionTitle,
    ]
  );

  const handleAddToChat = useCallback(() => {
    if (activeConversation?.id) {
      addComponentToConversation(currentComponent, activeConversation.id);
    }

    setShowAddedFeedback(true);
    setTimeout(() => setShowAddedFeedback(false), 2000);

    toast.success(`Added ${componentType} to chat context`, {
      description: currentComponent.title,
      duration: 3000,
    });

    onAddToChat?.(currentComponent);
  }, [
    currentComponent,
    activeConversation,
    addComponentToConversation,
    componentType,
    onAddToChat,
  ]);

  const handleSendMessage = useCallback(
    async (message: string): Promise<string> => {
      // Add component to context automatically when asking
      const exists = selectedComponents?.some(
        (c) =>
          c.content === currentComponent.content &&
          c.type === currentComponent.type
      );

      if (!exists && activeConversation?.id) {
        addComponentToConversation(currentComponent, activeConversation?.id);
      }

      // Call the legacy onAsk callback if provided for backwards compatibility
      if (onAsk) {
        onAsk(currentComponent, message);
      }

      return new Promise((resolve) => {
        setTimeout(() => {
          const mockResponses = {
            code: `This is a ${metadata?.language || "code"} snippet. ${
              message.toLowerCase().includes("explain")
                ? "Let me break down what this code does step by step..."
                : "I can help you understand this code better."
            }`,
            table: `This table contains structured data. ${
              message.toLowerCase().includes("explain")
                ? "Let me analyze the data patterns and relationships..."
                : "I can help interpret this data for you."
            }`,
            heading: `This is a section heading: "${currentComponent.title}". ${
              message.toLowerCase().includes("summarize")
                ? "This section covers the main topic and its key concepts..."
                : "I can provide more context about this section."
            }`,
            default: `I can help explain this ${componentType} component. What specific aspect would you like me to clarify?`,
          };

          const response =
            mockResponses[componentType as keyof typeof mockResponses] ||
            mockResponses.default;
          resolve(response);
        }, 1000 + Math.random() * 1000); // Simulate network delay
      });
    },
    [
      currentComponent,
      selectedComponents,
      addComponentToConversation,
      activeConversation,
      onAsk,
      componentType,
    ]
  );

  const isInContext = useMemo(
    () =>
      selectedComponents?.some(
        (c) => c.content === extractedContent && c.type === componentType
      ) ?? false,
    [selectedComponents, extractedContent, componentType]
  );

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

      {/* Interaction buttons */}
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
            {/* Enhanced Chat Dropdown */}
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                size="sm"
                variant="secondary"
                className={cn(
                  "h-7 px-2 py-0 shadow-md bg-background border border-border rounded-full transition-all duration-200",
                  "hover:bg-primary hover:text-primary-foreground hover:border-primary",
                  "bg-primary text-primary-foreground border-primary cursor-pointer",
                  className
                )}
                onClick={() => {
                  setIsDropdownOpen(true);
                }}
              >
                <MessageSquare className="h-3 w-3" />
              </Button>
            </motion.div>

            {/* Add to Chat Button */}
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

      <ChatDropdown
        currentComponent={currentComponent}
        onSendMessage={handleSendMessage}
        open={isDropdownOpen}
        onOpenChange={(open) => {
          setIsDropdownOpen(open);
          // When dropdown closes, also reset hover state
          if (!open) {
            setIsHovering(false);
          }
        }}
      />
    </div>
  );
};

export default ComponentWrapper;
