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
import ChatDialog from "../chat-dropdown/ChatDropdown";
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
  const [showAddedFeedback, setShowAddedFeedback] = useState(false);
  const [extractedContent, setExtractedContent] = useState<string>("");
  const contentRef = useRef<HTMLDivElement>(null);

  // Use refs for dialog state to survive re-renders
  const isDialogOpenRef = useRef(false);
  const [, forceUpdate] = useState({});

  const { activeConversation } = useConversation();
  const { addComponentToConversation } = useComponent();
  const selectedComponents = activeConversation?.selectedComponents;

  // Helper to force re-render when dialog state changes
  const setDialogOpen = useCallback((open: boolean) => {
    isDialogOpenRef.current = open;
    forceUpdate({}); // Force re-render
  }, []);

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
      // if (onAsk) {
      //   onAsk(currentComponent, message);
      // }

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
    [currentComponent, onAsk, componentType, metadata?.language]
  );

  const isInContext = useMemo(
    () =>
      selectedComponents?.some(
        (c) => c.content === extractedContent && c.type === componentType
      ) ?? false,
    [selectedComponents, extractedContent, componentType]
  );

  const showButtons =
    isHovering || isDialogOpenRef.current || showAddedFeedback;

  // Prevent dialog from closing due to hover state changes
  const handleMouseLeave = useCallback(() => {
    // Only hide buttons if dialog is not open
    if (!isDialogOpenRef.current) {
      setIsHovering(false);
    }
  }, []);

  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      setDialogOpen(open);
      if (!open) {
        setTimeout(() => {
          setIsHovering(false);
        }, 100);
      }
    },
    [setDialogOpen]
  );

  return (
    <div
      ref={contentRef}
      className={cn("relative group transition-all duration-200", className)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {/* Interaction buttons */}
      <AnimatePresence>
        {showButtons && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute -top-2 -right-2 flex gap-1 z-20"
          >
            {/* Chat Button */}
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 opacity-60 hover:opacity-100 transition-opacity"
              onClick={() => {
                setDialogOpen(true);
              }}
            >
              <MessageSquare className="h-3 w-3" />
            </Button>

            {/* Add to Chat Button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleAddToChat}
              disabled={isInContext}
              className={cn(
                "h-6 w-6 p-0 transition-opacity",
                isInContext ? "opacity-40" : "opacity-60 hover:opacity-100"
              )}
            >
              <AnimatePresence mode="wait">
                {showAddedFeedback ? (
                  <Check className="h-3 w-3" />
                ) : isInContext ? (
                  <Sparkles className="h-3 w-3" />
                ) : (
                  <Plus className="h-3 w-3" />
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Context indicator */}
      {isInContext && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -top-1 -left-1 z-10"
        >
          <div className="w-2 h-2 rounded-full bg-foreground/30" />
        </motion.div>
      )}

      {/* Chat Dialog */}
      <ChatDialog
        key={`chat-${componentId}`}
        currentComponent={currentComponent}
        onSendMessage={handleSendMessage}
        open={isDialogOpenRef.current}
        onOpenChange={handleDialogOpenChange}
      />
    </div>
  );
};

export default ComponentWrapper;
