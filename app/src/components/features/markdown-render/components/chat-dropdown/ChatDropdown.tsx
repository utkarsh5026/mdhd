import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  X,
  Send,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Bot,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComponentSelection } from "../../services/component-service";
import {
  getComponentIcon,
  getComponentColorScheme,
  getQuestionsForComponentType,
} from "./utils";

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface EnhancedChatDropdownProps {
  currentComponent: ComponentSelection;
  onSendMessage: (message: string) => Promise<string>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

const EnhancedChatDropdown: React.FC<EnhancedChatDropdownProps> = ({
  currentComponent,
  onSendMessage,
  open,
  onOpenChange,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const isControlled = open !== undefined && onOpenChange !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (isControlled) {
        onOpenChange?.(newOpen);
      } else {
        setInternalOpen(newOpen);
      }

      // Reset state when closing
      if (!newOpen) {
        setChatExpanded(false);
        setInputValue("");
        setMessages([]);
      }
    },
    [isControlled, onOpenChange]
  );

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        type: "user",
        content: message.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue("");
      setIsLoading(true);

      // Expand chat to show the conversation
      if (!chatExpanded) {
        setChatExpanded(true);
      }

      try {
        const response = await onSendMessage(message.trim());

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          type: "assistant",
          content: response,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error("Failed to send message:", error);

        // Add error message
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          type: "assistant",
          content:
            "Sorry, I encountered an error processing your request. Please try again.",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [onSendMessage, isLoading, chatExpanded]
  );

  const handleQuestionClick = useCallback((question: string) => {
    setInputValue(question);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const suggestedQuestions = getQuestionsForComponentType(
    currentComponent.type
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg p-0 rounded-2xl bg-card/95 backdrop-blur-xl border-0 shadow-2xl font-cascadia-code">
        <div className="flex flex-col max-h-[600px]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-r from-muted/50 to-muted/30 rounded-t-2xl">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg text-sm",
                  getComponentColorScheme(currentComponent.type)
                )}
              >
                {getComponentIcon(currentComponent.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm capitalize">
                  {currentComponent.type}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {currentComponent.title}
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenChange(false)}
              className="h-8 w-8 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Chat Messages - Collapsible */}
          {messages.length > 0 && (
            <Collapsible open={chatExpanded} onOpenChange={setChatExpanded}>
              <div className="border-b border-border/50">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between px-4 py-2 h-auto rounded-none hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Conversation</span>
                      <Badge variant="secondary" className="text-xs">
                        {messages.length}
                      </Badge>
                    </div>

                    {chatExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <ScrollArea className="max-h-80 p-3">
                    <div className="space-y-3">
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "flex gap-2",
                            message.type === "user"
                              ? "justify-end"
                              : "justify-start"
                          )}
                        >
                          {message.type === "assistant" && (
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                              <Bot className="h-3 w-3 text-primary" />
                            </div>
                          )}

                          <div
                            className={cn(
                              "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                              message.type === "user"
                                ? "bg-primary text-primary-foreground ml-8"
                                : "bg-muted text-foreground mr-8"
                            )}
                          >
                            <div className="whitespace-pre-wrap break-words">
                              {message.content}
                            </div>
                          </div>

                          {message.type === "user" && (
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-3 w-3" />
                            </div>
                          )}
                        </motion.div>
                      ))}

                      {isLoading && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex gap-2 justify-start"
                        >
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bot className="h-3 w-3 text-primary animate-pulse" />
                          </div>
                          <div className="bg-muted text-foreground rounded-2xl px-3 py-2 text-sm">
                            <div className="flex items-center gap-1">
                              <span>Thinking</span>
                              <motion.span
                                animate={{ opacity: [1, 0, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                              >
                                ...
                              </motion.span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </ScrollArea>
                </CollapsibleContent>
              </div>
            </Collapsible>
          )}

          {/* Suggested Questions */}
          <div className="p-4 border-b border-border/50 bg-muted/20">
            <div className="text-xs font-medium text-muted-foreground mb-3">
              Quick questions:
            </div>
            <div className="grid gap-2">
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuestionClick(question)}
                  className="justify-start text-left h-auto p-2 text-xs hover:bg-accent/50 rounded-lg"
                >
                  <Sparkles className="h-3 w-3 mr-2 flex-shrink-0 text-primary" />
                  <span className="truncate">{question}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 bg-gradient-to-t from-muted/30 to-transparent rounded-b-2xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="flex gap-2"
            >
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about this component..."
                disabled={isLoading}
                className="flex-1 text-sm border-border/50 focus-visible:ring-primary/50 rounded-xl"
              />

              <Button
                type="submit"
                size="sm"
                disabled={!inputValue.trim() || isLoading}
                className="px-3 rounded-xl hover:scale-105 transition-transform"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Bot className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedChatDropdown;
