import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ComponentSelection } from "@/components/features/markdown-render/services/component-service";
import {
  getComponentIcon,
  getComponentColorScheme,
  getQuestionsForComponentType,
} from "./utils";
import ChatInput from "./ChatInput";
import QuestionsAvailable from "./QuestionsAvailable";
import ChatMessages from "./ChatMessages";

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatDialogProps {
  currentComponent: ComponentSelection;
  onSendMessage: (message: string) => Promise<string>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

/**
 * Enhanced Chat Dialog Component
 *
 * A modern, intuitive dialog for chatting about document components.
 * Provides a clean interface with suggested questions, message history,
 * and real-time conversation flow.
 */
const ChatDialog: React.FC<ChatDialogProps> = ({
  currentComponent,
  onSendMessage,
  open = false,
  onOpenChange,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasStartedChat, setHasStartedChat] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setMessages([]);
      setInputValue("");
      setIsLoading(false);
      setHasStartedChat(false);
    }
  }, [open]);

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
      setHasStartedChat(true);

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
    [onSendMessage, isLoading]
  );

  const handleQuestionClick = useCallback((question: string) => {
    setInputValue(question);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage(inputValue);
      }
    },
    [inputValue, handleSendMessage]
  );

  const suggestedQuestions = getQuestionsForComponentType(
    currentComponent.type
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[90vw] h-[80vh] max-h-[700px] min-h-[500px] p-0 flex flex-col font-cascadia-code rounded-2xl border-2 border-border overflow-hidden">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 p-6 border-b border-border bg-gradient-to-r from-muted/50 to-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Component Icon */}
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-xl text-sm font-medium",
                  getComponentColorScheme(currentComponent.type)
                )}
              >
                {getComponentIcon(currentComponent.type)}
              </div>

              {/* Component Info */}
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg font-semibold capitalize">
                  Ask about this {currentComponent.type}
                </DialogTitle>
                <p className="text-sm text-muted-foreground truncate mt-1">
                  {currentComponent.title}
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages or Welcome Screen */}
          {!hasStartedChat ? (
            <QuestionsAvailable
              currentComponent={currentComponent}
              suggestedQuestions={suggestedQuestions}
              handleQuestionClick={handleQuestionClick}
            />
          ) : (
            <ChatMessages
              messages={messages}
              isLoading={isLoading}
              messagesEndRef={messagesEndRef}
            />
          )}

          {/* Input Area */}
          <ChatInput
            inputRef={inputRef}
            inputValue={inputValue}
            setInputValue={setInputValue}
            handleKeyDown={handleKeyDown}
            isLoading={isLoading}
            handleSendMessage={handleSendMessage}
            hasStartedChat={hasStartedChat}
            suggestedQuestions={suggestedQuestions}
            handleQuestionClick={handleQuestionClick}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatDialog;
