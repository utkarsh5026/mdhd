import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { useConversation, useConversationActions, useLLMState } from "../hooks";
import { IoAdd } from "react-icons/io5";
import { RiRobot2Fill } from "react-icons/ri";
import { useConversationLLM } from "../hooks/use-conversation-llm";
import type { MarkdownSection } from "@/services/section/parsing";
import { ConversationListDialog } from "./ConversationListDialog";
import { getProviderIcon } from "./utils";
import { Messages } from "./messages";
import { ChatInput } from "./chat-input";
import { ChatHeader, SelectedComponents } from "./layout";

interface ChatSidebarProps {
  isVisible: boolean;
  onToggle: () => void;
  sections: MarkdownSection[];
  currentSection: MarkdownSection | null;
}

/**
 * Enhanced Chat Sidebar Component
 */
const ChatSidebar: React.FC<ChatSidebarProps> = ({ isVisible, onToggle }) => {
  const [conversationListOpen, setConversationListOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { createConversation } = useConversationActions();
  const { activeConversation, conversationSummaries } = useConversation();
  const [inputValue, setInputValue] = useState<string>("");
  const { isQueryLoading, sendMessageToConversation } = useConversationLLM();
  const { isInitialized, error } = useLLMState();

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  });

  useEffect(() => {
    if (conversationSummaries.length === 0 && isInitialized) {
      createConversation("Welcome to MDHD AI");
    }
  }, [isInitialized, conversationSummaries, createConversation]);

  /**
   * Handle sending a message
   */
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isQueryLoading || !isInitialized) {
      return;
    }

    try {
      if (!activeConversation) {
        await sendMessageToConversation(inputValue, undefined, {
          createNewIfNeeded: true,
          conversationTitle: `Chat: ${inputValue.slice(0, 30)}...`,
        });
      } else {
        await sendMessageToConversation(inputValue, activeConversation.id);
      }

      setInputValue("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  /**
   * Handle creating new conversation
   */
  const handleCreateNewConversation = () => {
    createConversation("New Conversation");
    setConversationListOpen(false);
  };

  if (!isVisible) return null;

  return (
    <>
      <motion.div
        initial={{ x: -400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -400, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="fixed left-0 top-0 h-full w-1/3 bg-card border-r border-border z-50 flex flex-col shadow-2xl font-cascadia-code"
      >
        <div className="flex-shrink-0">
          <ChatHeader
            onOpenConversationList={() => setConversationListOpen(true)}
            isQueryLoading={isQueryLoading}
            onToggle={onToggle}
            error={error}
          />

          <SelectedComponents />
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full px-4">
            <div className="space-y-4 py-4">
              {activeConversation ? (
                <AnimatePresence>
                  <Messages
                    messages={activeConversation.messages}
                    isQueryLoading={isQueryLoading}
                    getProviderIcon={getProviderIcon}
                    messageEndRef={messagesEndRef}
                  />
                </AnimatePresence>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <RiRobot2Fill className="w-16 h-16 mb-4 opacity-30" />
                  <div className="text-center">
                    <h3 className="font-medium mb-2">No active conversation</h3>
                    <p className="text-sm mb-4">
                      Start a new conversation or ask about a component
                    </p>
                    <Button
                      onClick={handleCreateNewConversation}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <IoAdd className="w-4 h-4" />
                      New Conversation
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>
        </div>

        {/* Input Area */}
        <ChatInput
          isInitialized={isInitialized}
          isQueryLoading={isQueryLoading}
          getProviderIcon={getProviderIcon}
          handleSendMessage={handleSendMessage}
        />
      </motion.div>

      {/* Conversation List Dialog */}
      <ConversationListDialog
        open={conversationListOpen}
        onOpenChange={setConversationListOpen}
      />
    </>
  );
};

export default ChatSidebar;
