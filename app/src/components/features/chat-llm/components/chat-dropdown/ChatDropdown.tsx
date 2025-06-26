import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MessageSquarePlus, StopCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { ComponentSelection } from "@/components/features/markdown-render/services/component-service";
import { getProviderIcon } from "@/components/features/chat-llm/components/utils";
import { useChatDialogIntegration } from "./useDialg";
import {
  getComponentIcon,
  getComponentColorScheme,
  getQuestionsForComponentType,
} from "./utils";
import ChatInput from "./ChatInput";
import ChatMessages from "./chat-messages";
import WelcomeScreen from "./welcome-screen";
import SuggestedQuestionsDropdown from "./suggested-questions";
import { ModelProvider } from "../chat-input";

interface ChatDialogProps {
  currentComponent: ComponentSelection;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Enhanced ChatDialog with Temporary Conversation Management
 *
 * Key Features:
 * - Temporary local conversation state
 * - Model selection within dialog
 * - Suggested questions dropdown
 * - Transfer to persistent conversation store
 * - Streaming message support
 * - Proper cleanup on close
 */
const ChatDialog: React.FC<ChatDialogProps> = ({
  currentComponent,
  open = false,
  onOpenChange,
}) => {
  // =================== STATE ===================

  const [inputValue, setInputValue] = useState("");
  const [suggestedDropdownOpen, setSuggestedDropdownOpen] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  // Refs
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // =================== HOOKS ===================

  const {
    messages,
    isTemporary,
    isLoading,
    isInitialized,
    sendTempMessage,
    transferToPersistent,
    stopStreaming,
    resetTempState,
    canTransfer,
  } = useChatDialogIntegration(currentComponent);

  // =================== EFFECTS ===================

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current && isInitialized) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open, isInitialized]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // Cleanup when dialog closes
  useEffect(() => {
    if (!open) {
      resetTempState();
      setInputValue("");
      setSuggestedDropdownOpen(false);
      setModelDropdownOpen(false);
    }
  }, [open, resetTempState]);

  // =================== HANDLERS ===================

  /**
   * Handle sending a message
   */
  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || isLoading || !isInitialized) return;

      try {
        await sendTempMessage(message);
        setInputValue("");
      } catch (error) {
        console.error("Failed to send message:", error);
        toast.error("Failed to send message. Please try again.");
      }
    },
    [sendTempMessage, isLoading, isInitialized]
  );

  /**
   * Handle transferring conversation to chat bar
   */
  const handleAddToChatBar = useCallback(async () => {
    try {
      const conversationId = await transferToPersistent();
      if (conversationId) {
        toast.success("Conversation added to chat bar!", {
          description: "You can continue the conversation in the main chat.",
        });
        // Close dialog after successful transfer
        onOpenChange?.(false);
      }
    } catch (error) {
      console.error("Failed to add to chat bar:", error);
      toast.error("Failed to add conversation to chat bar. Please try again.");
    }
  }, [transferToPersistent, onOpenChange]);

  /**
   * Handle suggested question selection
   */
  const handleQuestionClick = useCallback((question: string) => {
    setInputValue(question);
    setSuggestedDropdownOpen(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage(inputValue);
      } else if (e.key === "Escape" && isLoading) {
        e.preventDefault();
        stopStreaming();
      }
    },
    [inputValue, handleSendMessage, isLoading, stopStreaming]
  );

  /**
   * Handle stopping current message
   */
  const handleStopMessage = useCallback(() => {
    stopStreaming();
    toast.info("Message generation stopped");
  }, [stopStreaming]);

  // =================== COMPUTED VALUES ===================

  const suggestedQuestions = getQuestionsForComponentType(
    currentComponent.type
  );
  const hasMessages = messages.length > 0;

  // =================== RENDER ===================

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[90vw] h-[80vh] max-h-[700px] min-h-[500px] p-0 flex flex-col font-cascadia-code rounded-2xl border-2 border-border overflow-hidden">
        <DialogHeader className="flex-shrink-0 p-6 border-b border-border bg-gradient-to-r from-muted/50 to-muted/30">
          <div className="flex items-center justify-between">
            {/* Component Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-xl text-sm font-medium flex-shrink-0",
                  getComponentColorScheme(currentComponent.type)
                )}
              >
                {getComponentIcon(currentComponent.type)}
              </div>

              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg font-semibold capitalize">
                  Ask about this {currentComponent.type}
                </DialogTitle>
                <p className="text-sm text-muted-foreground truncate mt-1">
                  {currentComponent.title}
                </p>
              </div>
            </div>

            {/* Status & Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Loading indicator */}
              {isLoading && (
                <Button
                  onClick={handleStopMessage}
                  size="sm"
                  variant="outline"
                  className="gap-2 border-destructive/50 hover:border-destructive text-destructive hover:bg-destructive/10"
                >
                  <StopCircle className="w-4 h-4" />
                  Stop
                </Button>
              )}

              {/* Temporary indicator */}
              {isTemporary && hasMessages && (
                <Badge
                  variant="outline"
                  className="text-xs bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800"
                >
                  Temporary Chat
                </Badge>
              )}

              {/* Add to Chat Bar Button */}
              <AnimatePresence>
                {canTransfer && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button
                      onClick={handleAddToChatBar}
                      size="sm"
                      className="gap-2 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl hover:shadow-primary/25 transition-all duration-200"
                    >
                      <MessageSquarePlus className="w-4 h-4" />
                      Add to Chat Bar
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-shrink-0 px-6 py-3 border-b border-border/50 bg-muted/10">
          <div className="flex items-center justify-between">
            {/* Model Selection */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-medium">
                Model:
              </span>
              <ModelProvider
                modelPopoverOpen={modelDropdownOpen}
                setModelPopoverOpen={setModelDropdownOpen}
                getProviderIcon={getProviderIcon}
              />
            </div>

            {/* Suggested Questions */}
            <SuggestedQuestionsDropdown
              open={suggestedDropdownOpen}
              onOpenChange={setSuggestedDropdownOpen}
              questions={suggestedQuestions}
              onQuestionSelect={handleQuestionClick}
              componentType={currentComponent.type}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages or Welcome Screen */}
          {hasMessages ? (
            <div className="flex-1 overflow-hidden">
              <ChatMessages
                messages={messages}
                isLoading={isLoading}
                messagesEndRef={messagesEndRef}
              />
            </div>
          ) : (
            <WelcomeScreen
              componentType={currentComponent.type}
              componentTitle={currentComponent.title}
              onQuestionClick={handleQuestionClick}
              suggestedQuestions={suggestedQuestions.slice(0, 3)}
              isInitialized={isInitialized}
            />
          )}

          {/* Input Area */}
          <div className="flex-shrink-0">
            <ChatInput
              inputRef={inputRef}
              inputValue={inputValue}
              setInputValue={setInputValue}
              handleKeyDown={handleKeyDown}
              isLoading={isLoading}
              handleSendMessage={handleSendMessage}
              hasStartedChat={hasMessages}
              suggestedQuestions={[]} // Using dropdown instead
              handleQuestionClick={handleQuestionClick}
              disabled={!isInitialized}
              placeholder={
                !isInitialized
                  ? "Initializing AI assistant..."
                  : `Ask me anything about this ${currentComponent.type}...`
              }
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatDialog;
