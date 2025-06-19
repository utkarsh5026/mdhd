import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import {
  IoSend,
  IoClose,
  IoTrashOutline,
  IoCodeSlashOutline,
  IoLayersOutline,
  IoDocumentTextOutline,
  IoListOutline,
  IoChatbubbleOutline,
  IoImageOutline,
} from "react-icons/io5";

import { useSimpleChatStore } from "../store/chat-store";
import type {
  ComponentSelection,
  ComponentType,
} from "../../markdown-render/services/component-service";

/**
 * Get icon for component type
 */
const getComponentIcon = (type: ComponentType) => {
  switch (type) {
    case "code":
      return <IoCodeSlashOutline className="w-4 h-4" />;
    case "table":
      return <IoLayersOutline className="w-4 h-4" />;
    case "heading":
      return <IoDocumentTextOutline className="w-4 h-4" />;
    case "list":
      return <IoListOutline className="w-4 h-4" />;
    case "blockquote":
      return <IoChatbubbleOutline className="w-4 h-4" />;
    case "image":
      return <IoImageOutline className="w-4 h-4" />;
    default:
      return <IoDocumentTextOutline className="w-4 h-4" />;
  }
};

/**
 * Get color scheme for component type
 */
const getComponentColorScheme = (type: ComponentType) => {
  switch (type) {
    case "code":
      return "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800";
    case "table":
      return "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800";
    case "heading":
      return "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800";
    case "list":
      return "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800";
    case "blockquote":
      return "bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800";
    case "image":
      return "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800";
    default:
      return "bg-gray-50 dark:bg-gray-950/30 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800";
  }
};

/**
 * Ask Dialog - Opens when user clicks "Ask" on a component
 */
export const AskDialog: React.FC = () => {
  const isOpen = useSimpleChatStore((state) => state.askDialogOpen);
  const component = useSimpleChatStore((state) => state.currentAskComponent);
  const inputValue = useSimpleChatStore((state) => state.inputValue);
  const closeAskDialog = useSimpleChatStore((state) => state.closeAskDialog);
  const askAboutComponent = useSimpleChatStore(
    (state) => state.askAboutComponent
  );
  const setInputValue = useSimpleChatStore((state) => state.setInputValue);

  const handleSubmit = () => {
    if (component && inputValue.trim()) {
      askAboutComponent(component, inputValue);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!component) return null;

  return (
    <Dialog open={isOpen} onOpenChange={closeAskDialog}>
      <DialogContent className="sm:max-w-md font-cascadia-code rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className={cn(
                "p-2 rounded-lg",
                getComponentColorScheme(component.type)
              )}
            >
              {getComponentIcon(component.type)}
            </div>
            Ask about this {component.type}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Component preview */}
          <div className="bg-muted p-3 rounded-2xl text-sm">
            <div className="font-medium mb-1">{component.title}</div>
            <div className="text-muted-foreground text-xs">
              {component.content.slice(0, 150)}
              {component.content.length > 150 ? "..." : ""}
            </div>
          </div>

          {/* Question input */}
          <div>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="What would you like to know about this component?"
              onKeyPress={handleKeyPress}
              className="text-sm"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={closeAskDialog}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!inputValue.trim()}
            className="rounded-2xl"
          >
            <IoSend className="w-4 h-4 mr-2" />
            Ask AI
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Component display in chat context
 */
const ComponentBadge: React.FC<{
  component: ComponentSelection;
  onRemove?: (id: string) => void;
  showRemove?: boolean;
}> = ({ component, onRemove, showRemove = true }) => {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-2 py-1 rounded-lg text-xs border",
        getComponentColorScheme(component.type)
      )}
    >
      {getComponentIcon(component.type)}
      <span className="font-medium">{component.title}</span>
      {showRemove && onRemove && (
        <button
          onClick={() => onRemove(component.id)}
          className="hover:bg-black/10 rounded p-0.5"
          title="Remove from context"
        >
          <IoClose className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

/**
 * Selected components display
 */
export const SelectedComponentsDisplay: React.FC = () => {
  const selectedComponents = useSimpleChatStore(
    (state) => state.selectedComponents
  );
  const removeComponent = useSimpleChatStore((state) => state.removeComponent);
  const clearComponents = useSimpleChatStore((state) => state.clearComponents);

  if (selectedComponents.length === 0) return null;

  return (
    <div className="border-b border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">
          Context ({selectedComponents.length})
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearComponents}
          className="h-6 text-xs text-muted-foreground hover:text-destructive"
        >
          <IoTrashOutline className="w-3 h-3 mr-1" />
          Clear
        </Button>
      </div>

      <div className="flex flex-wrap gap-1">
        {selectedComponents.map((component) => (
          <ComponentBadge
            key={component.id}
            component={component}
            onRemove={removeComponent}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Simple chat messages display
 */
export const ChatMessages: React.FC = () => {
  const messages = useSimpleChatStore((state) => state.messages);
  const isQueryLoading = useSimpleChatStore((state) => state.isQueryLoading);

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="space-y-2">
            <div
              className={cn(
                "p-3 rounded-lg text-sm",
                message.type === "user"
                  ? "bg-primary text-primary-foreground ml-8"
                  : message.type === "system"
                  ? "bg-muted text-muted-foreground border"
                  : "bg-card border mr-8"
              )}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>

              {/* Show what was selected for user messages */}
              {message.type === "user" && message.selections && (
                <div className="mt-2 pt-2 border-t border-primary/20">
                  <div className="text-xs opacity-80 mb-1">Asked about:</div>
                  <div className="flex flex-wrap gap-1">
                    {message.selections.map((selection) => (
                      <ComponentBadge
                        key={selection.id}
                        component={selection}
                        showRemove={false}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isQueryLoading && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
            Thinking...
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

/**
 * Chat input area
 */
export const ChatInput: React.FC = () => {
  const inputValue = useSimpleChatStore((state) => state.inputValue);
  const selectedComponents = useSimpleChatStore(
    (state) => state.selectedComponents
  );
  const setInputValue = useSimpleChatStore((state) => state.setInputValue);
  const addMessage = useSimpleChatStore((state) => state.addMessage);
  const setIsQueryLoading = useSimpleChatStore(
    (state) => state.setIsQueryLoading
  );

  const handleSend = async () => {
    if (!inputValue.trim() || selectedComponents.length === 0) return;

    // Add user message
    const userMessage = {
      id: `user-${Date.now()}`,
      type: "user" as const,
      content: inputValue,
      timestamp: new Date(),
      selections: selectedComponents,
    };

    addMessage(userMessage);
    const currentInput = inputValue;
    setInputValue("");
    setIsQueryLoading(true);

    try {
      // Here you would integrate with your LLM service
      // For now, just simulate a response
      setTimeout(() => {
        const assistantMessage = {
          id: `assistant-${Date.now()}`,
          type: "assistant" as const,
          content: `I can help you understand these components: ${selectedComponents
            .map((c) => c.title)
            .join(", ")}. 

Based on your question "${currentInput}", here's what I can tell you...

[This is where the LLM response would go - integrate with your existing LLM service here]`,
          timestamp: new Date(),
        };

        addMessage(assistantMessage);
        setIsQueryLoading(false);
      }, 1000);
    } catch (error) {
      setIsQueryLoading(false);
      console.error("Failed to get response:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border p-4">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={
            selectedComponents.length === 0
              ? "Add some components to context first..."
              : "Ask about your selected components..."
          }
          disabled={selectedComponents.length === 0}
          onKeyPress={handleKeyPress}
          className="text-sm"
        />
        <Button
          onClick={handleSend}
          disabled={!inputValue.trim() || selectedComponents.length === 0}
          size="sm"
        >
          <IoSend className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
