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
import { useSelectedComponents } from "@/components/features/chat-llm/hooks";

interface ComponentWrapperProps {
  componentType: ComponentType;
  children: React.ReactNode;
  sectionId: string;
  sectionTitle: string;
  onAsk?: (selection: ComponentSelection, question: string) => void;
  metadata?: ComponentSelection["metadata"];
  className?: string;
}

const ComponentWrapper: React.FC<ComponentWrapperProps> = ({
  componentType,
  children,
  sectionId,
  sectionTitle,
  metadata = {},
  className,
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [showAddedFeedback, setShowAddedFeedback] = useState(false);
  const [extractedContent, setExtractedContent] = useState<string>("");
  const contentRef = useRef<HTMLDivElement>(null);

  const isDialogOpenRef = useRef(false);
  const [, forceUpdate] = useState({});

  const { selectedComponents, addComponent, removeComponent } =
    useSelectedComponents();

  const setDialogOpen = useCallback((open: boolean) => {
    isDialogOpenRef.current = open;
    forceUpdate({});
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

  const isInContext = useMemo(
    () =>
      selectedComponents?.some(
        (c) => c.content === extractedContent && c.type === componentType
      ) ?? false,
    [selectedComponents, extractedContent, componentType]
  );

  const handleToggleComponent = useCallback(() => {
    if (isInContext) {
      // Remove from context
      removeComponent(currentComponent);
      toast.success(`Removed ${componentType} from chat context`, {
        description: currentComponent.title,
        duration: 3000,
      });
    } else {
      // Add to context
      setShowAddedFeedback(true);
      setTimeout(() => setShowAddedFeedback(false), 2000);

      toast.success(`Added ${componentType} to chat context`, {
        description: currentComponent.title,
        duration: 3000,
      });

      addComponent(currentComponent);
    }
  }, [
    removeComponent,
    currentComponent,
    componentType,
    addComponent,
    isInContext,
  ]);

  const handleSendMessage = useCallback(
    async (message: string): Promise<string> => {
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
    [currentComponent, componentType, metadata?.language]
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
      className={cn(
        "relative group transition-all duration-300 ease-out rounded-md",
        // Base state
        "hover:bg-muted/20",
        // Context state - more prominent visual feedback
        isInContext && [
          " border-l-2 border-primary/40 pl-3 ml-[-0.75rem] rounded-2xl",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary/5 before:to-transparent before:rounded-md before:pointer-events-none",
        ],
        // Hover state - clear area indication
        "hover:ring-1 hover:ring-border/50 hover:shadow-sm",
        // Enhanced transitions
        "transition-all duration-200",
        className
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Hover area indicator */}
      <AnimatePresence>
        {isHovering && !isInContext && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 ring-1 ring-primary/20 bg-background/5 rounded-2xl pointer-events-none z-0 border-none p-0"
          />
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10">{children}</div>

      <AnimatePresence>
        {isInContext && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute -left-1 top-1/2 -translate-y-1/2 z-20"
          >
            <div className="flex flex-col items-center gap-1">
              <div className="w-1 h-4 bg-primary/60 rounded-full" />
              <Sparkles className="h-3 w-3 text-primary/70" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isHovering && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute -top-6 left-0 z-30"
          >
            <div className="text-xs text-muted-foreground/80 font-medium bg-background/90 backdrop-blur-sm px-2 py-1 rounded border shadow-sm font-type-mono">
              {componentType}
              {metadata?.language && componentType === "code" && (
                <span className="text-primary/70 ml-1">
                  ({metadata.language})
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interaction buttons */}
      <AnimatePresence>
        {showButtons && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute -top-2 -right-2 flex gap-1 z-30"
          >
            {/* Chat Button */}
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "h-7 w-7 p-0 rounded-full transition-all duration-200",
                "bg-background/90 backdrop-blur-sm border shadow-sm",
                "hover:bg-primary/10 hover:border-primary/30",
                "opacity-90 hover:opacity-100"
              )}
              onClick={() => {
                setDialogOpen(true);
              }}
            >
              <MessageSquare className="h-3.5 w-3.5" />
            </Button>

            {/* Add/Remove Toggle Button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleToggleComponent}
              className={cn(
                "h-7 w-7 p-0 rounded-full transition-all duration-200 border-none",
                "bg-background/90 backdrop-blur-sm border shadow-sm",
                isInContext
                  ? "bg-primary/10 border-primary/30 hover:bg-red-50 hover:border-red-300"
                  : "hover:bg-primary/10 border-none",
                "opacity-90 hover:opacity-100"
              )}
              title={
                isInContext
                  ? `Remove ${componentType} from chat`
                  : `Add ${componentType} to chat`
              }
            >
              <AnimatePresence mode="wait">
                {showAddedFeedback ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  </motion.div>
                ) : isInContext ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.15 }}
                    className="group-hover:text-red-600"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary group-hover:hidden" />
                    <Plus className="h-3.5 w-3.5 rotate-45 text-red-600 hidden group-hover:block" />
                  </motion.div>
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

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
