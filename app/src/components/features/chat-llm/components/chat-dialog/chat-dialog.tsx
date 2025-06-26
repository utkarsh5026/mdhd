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
import {
  getComponentIcon,
  getComponentColorScheme,
  getQuestionsForComponentType,
} from "./utils";
import ChatMessages from "./chat-messages";
import WelcomeScreen from "./welcome-screen";
import SuggestedQuestionsDropdown from "./suggested-questions";
import { ChatInput } from "../chat-input";
import {
  useMessage,
  useLLMState,
  useMessages,
  useChatInput,
} from "@/components/features/chat-llm/hooks";

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
  const [suggestedDropdownOpen, setSuggestedDropdownOpen] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendMessage, isLoading: isMessageLoading } = useMessage();
  const { isInitialized } = useLLMState();
  const [conversationId, setConversationId] = useState<string | undefined>(
    undefined
  );
  const { messages } = useMessages(conversationId);
  const { inputValue, handleInputChange } = useChatInput();

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
  }, [messages, isMessageLoading]);

  // Cleanup when dialog closes
  useEffect(() => {
    if (!open) {
      setSuggestedDropdownOpen(false);
    }
  }, [open]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isMessageLoading || !isInitialized) return;

    try {
      const result = await sendMessage(inputValue);
      if (result === null) {
        onOpenChange?.(false);
        return;
      }

      setConversationId(result.conversationId);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message. Please try again.");
    }
  }, [sendMessage, isMessageLoading, isInitialized, onOpenChange, inputValue]);

  /**
   * Handle suggested question selection
   */
  const handleQuestionClick = useCallback(
    (question: string) => {
      handleInputChange(question);
      setSuggestedDropdownOpen(false);
    },
    [handleInputChange]
  );

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
              {isMessageLoading && (
                <Button
                  onClick={() => {}}
                  size="sm"
                  variant="outline"
                  className="gap-2 border-destructive/50 hover:border-destructive text-destructive hover:bg-destructive/10"
                >
                  <StopCircle className="w-4 h-4" />
                  Stop
                </Button>
              )}

              {/* Temporary indicator */}
              {hasMessages && (
                <Badge
                  variant="outline"
                  className="text-xs bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800"
                >
                  Temporary Chat
                </Badge>
              )}

              {/* Add to Chat Bar Button */}
              <AnimatePresence>
                {conversationId && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button
                      onClick={() => {}}
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
            {/* <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-medium">
                Model:
              </span>
              <ModelProvider
                modelPopoverOpen={modelDropdownOpen}
                setModelPopoverOpen={setModelDropdownOpen}
                getProviderIcon={getProviderIcon}
              />
            </div> */}

            {/* Suggested Questions */}
            <SuggestedQuestionsDropdown
              open={suggestedDropdownOpen}
              onOpenChange={setSuggestedDropdownOpen}
              questions={suggestedQuestions}
              onQuestionSelect={handleQuestionClick}
              componentType={currentComponent.type}
              disabled={isMessageLoading}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages or Welcome Screen */}
          {hasMessages ? (
            <div className="flex-1 overflow-hidden">
              <ChatMessages
                messages={messages}
                isLoading={isMessageLoading}
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
              isInitialized={isInitialized}
              isQueryLoading={isMessageLoading}
              handleSendMessage={handleSendMessage}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatDialog;
