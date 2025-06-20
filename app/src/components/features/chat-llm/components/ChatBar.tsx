import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

import {
  IoSend,
  IoClose,
  IoWarning,
  IoChevronDown,
  IoCheckmark,
  IoAdd,
  IoMenu,
  IoTrashOutline,
  IoTimeOutline,
} from "react-icons/io5";
import { RiRobot2Fill, RiLoader4Line } from "react-icons/ri";
import { SiAnthropic, SiGoogle, SiOpenai } from "react-icons/si";

import ModelProvider from "./ModelProvider";
import SettingsDropdown from "./SettingsDropdown";
import ChatMarkdownRenderer from "./ChatMarkdownRenderer";
import {
  useEnhancedChatStore,
  type Conversation,
  type ChatMessage,
} from "../store/chat-store";
import { useConversationLLM } from "../hooks/use-conversation-llm";
import type { MarkdownSection } from "@/services/section/parsing";
import type { LLMProviderId } from "../types";
import type { ComponentSelection } from "../../markdown-render/services/component-service";
import { ConversationListDialog } from "./ChatDialog";

interface EnhancedChatSidebarProps {
  isVisible: boolean;
  onToggle: () => void;
  sections: MarkdownSection[];
  currentSection: MarkdownSection | null;
}

/**
 * Get provider icon component
 */
const getProviderIcon = (providerId: LLMProviderId) => {
  switch (providerId) {
    case "openai":
      return <SiOpenai className="w-4 h-4" />;
    case "anthropic":
      return <SiAnthropic className="w-4 h-4" />;
    case "google":
      return <SiGoogle className="w-4 h-4" />;
    default:
      return <RiRobot2Fill className="w-4 h-4" />;
  }
};

/**
 * Component Badge for displaying in conversation context
 */
const ComponentBadge: React.FC<{
  component: ComponentSelection;
  onRemove?: (id: string) => void;
  showRemove?: boolean;
}> = ({ component, onRemove, showRemove = true }) => {
  const getComponentColorScheme = (type: string) => {
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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="group"
    >
      <Badge
        variant="secondary"
        className={`text-xs pr-1 cursor-pointer transition-colors border ${getComponentColorScheme(
          component.type
        )}`}
      >
        <span className="max-w-32 truncate">{component.title}</span>
        {showRemove && onRemove && (
          <button
            onClick={() => onRemove(component.id)}
            className="ml-1 opacity-60 group-hover:opacity-100 hover:bg-destructive/20 rounded p-0.5 transition-all"
            title="Remove from context"
          >
            <IoClose className="w-3 h-3" />
          </button>
        )}
      </Badge>
    </motion.div>
  );
};

/**
 * Message Component with enhanced styling and metadata
 */
const MessageComponent: React.FC<{
  message: ChatMessage;
  getProviderIcon: (providerId: LLMProviderId) => React.ReactNode;
}> = ({ message, getProviderIcon }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex w-full items-start max-w-full"
    >
      <div
        className={`rounded-2xl px-4 py-3 text-sm w-full max-w-full overflow-hidden transition-all ${
          message.type === "user"
            ? "bg-primary text-primary-foreground ml-8"
            : message.type === "assistant"
            ? "bg-secondary/50 text-secondary-foreground border border-border mr-8"
            : "bg-muted/50 text-muted-foreground border border-muted mx-4"
        }`}
      >
        {/* Message content */}
        <div className="leading-relaxed text-sm max-w-full">
          {message.type === "assistant" ? (
            <ChatMarkdownRenderer
              content={message.content}
              className="text-inherit w-full max-w-full"
              isStreaming={message.isStreaming}
            />
          ) : (
            <div className="whitespace-pre-wrap break-words">
              {message.content}
            </div>
          )}

          {/* Streaming indicator */}
          {message.isStreaming && message.content && (
            <span className="inline-block w-2 h-4 bg-primary ml-1 opacity-75 animate-pulse" />
          )}
        </div>

        {/* Message metadata */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <div className="flex gap-1 text-muted-foreground items-center">
            {/* Timestamp */}
            <IoTimeOutline className="w-3 h-3" />
            <span>
              {message.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>

            {/* Model info for assistant messages */}
            {message.type === "assistant" &&
              message.provider &&
              message.model && (
                <>
                  <span className="mx-1">•</span>
                  <div className="flex items-center gap-1">
                    {getProviderIcon(message.provider as LLMProviderId)}
                    <span>{message.model}</span>
                  </div>
                </>
              )}
          </div>

          {/* Message status */}
          {message.type === "user" && !message.isStreaming && (
            <IoCheckmark className="w-3 h-3 text-green-500" />
          )}
        </div>

        {/* Component selections for user messages */}
        {message.type === "user" &&
          message.selections &&
          message.selections.length > 0 && (
            <div className="mt-3 pt-3 border-t border-primary/20">
              <div className="text-xs opacity-80 mb-2">
                Referenced components:
              </div>
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
    </motion.div>
  );
};

/**
 * Conversation Header with title and management options
 */
const ConversationHeader: React.FC<{
  conversation: Conversation | null;
  onOpenConversationList: () => void;
  onDeleteConversation?: () => void;
}> = ({ conversation, onOpenConversationList, onDeleteConversation }) => {
  return (
    <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenConversationList}
          className="h-8 px-2 flex items-center gap-2 hover:bg-primary/10"
        >
          <IoMenu className="w-4 h-4" />
          <span className="text-sm font-medium truncate max-w-32">
            {conversation?.title || "No Conversation"}
          </span>
          <IoChevronDown className="w-3 h-3" />
        </Button>
      </div>

      {conversation && (
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="text-xs">
            {conversation.messages.length} messages
          </Badge>
          {onDeleteConversation && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDeleteConversation}
              className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
            >
              <IoTrashOutline className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Enhanced Chat Sidebar Component
 */
const EnhancedChatSidebar: React.FC<EnhancedChatSidebarProps> = ({
  isVisible,
  onToggle,
  currentSection,
}) => {
  const [modelPopoverOpen, setModelPopoverOpen] = useState(false);
  const [conversationListOpen, setConversationListOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Enhanced chat store
  const {
    getActiveConversation,
    getConversationSummaries,
    inputValue,
    setInputValue,
    isQueryLoading,
    createConversation,
    deleteConversation,
    removeComponentFromConversation,
    selectedProvider,
    selectedModel,
    setSelectedProvider,
    setSelectedModel,
    setCurrentSection,
  } = useEnhancedChatStore();

  // LLM integration
  const conversationLLM = useConversationLLM({
    openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY,
    anthropicApiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
    googleApiKey: import.meta.env.VITE_GOOGLE_API_KEY,
  });

  // Update current section in store when it changes
  useEffect(() => {
    if (currentSection) {
      setCurrentSection(currentSection.id, currentSection.title);
    }
  }, [currentSection, setCurrentSection]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  });

  // Initialize welcome conversation if none exist
  useEffect(() => {
    const summaries = getConversationSummaries();
    if (summaries.length === 0 && conversationLLM.isInitialized) {
      createConversation("Welcome to MDHD AI");
      // Add welcome message through the store
      // This should be handled by the initialization logic
    }
  }, [
    conversationLLM.isInitialized,
    getConversationSummaries,
    createConversation,
  ]);

  const activeConversation = getActiveConversation();
  const error = conversationLLM.error;

  /**
   * Handle sending a message
   */
  const handleSendMessage = async () => {
    if (
      !inputValue.trim() ||
      isQueryLoading ||
      !conversationLLM.isInitialized
    ) {
      return;
    }

    try {
      if (!activeConversation) {
        // Create new conversation
        await conversationLLM.sendMessageToConversation(inputValue, undefined, {
          createNewIfNeeded: true,
          conversationTitle: `Chat: ${inputValue.slice(0, 30)}...`,
        });
      } else {
        // Send to active conversation
        await conversationLLM.sendMessageToConversation(
          inputValue,
          activeConversation.id
        );
      }

      setInputValue("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  /**
   * Handle model selection
   */
  const handleModelSelect = (providerId: LLMProviderId, model: string) => {
    conversationLLM.updateProvider(providerId, model);
    setSelectedProvider(providerId);
    setSelectedModel(model);
    setModelPopoverOpen(false);
  };

  /**
   * Handle removing component from active conversation
   */
  const handleRemoveComponent = (componentId: string) => {
    if (activeConversation) {
      removeComponentFromConversation(componentId, activeConversation.id);
    }
  };

  /**
   * Handle creating new conversation
   */
  const handleCreateNewConversation = () => {
    createConversation("New Conversation");
    setConversationListOpen(false);
  };

  /**
   * Handle deleting active conversation
   */
  const handleDeleteActiveConversation = () => {
    if (
      activeConversation &&
      confirm("Are you sure you want to delete this conversation?")
    ) {
      deleteConversation(activeConversation.id);
    }
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
        {/* Header */}
        <div className="flex-shrink-0">
          {/* Main header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <RiRobot2Fill className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">AI Assistant</h2>
                {isQueryLoading && (
                  <RiLoader4Line className="w-4 h-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center gap-1">
                <SettingsDropdown
                  providers={conversationLLM.availableProviders}
                  getProviderIcon={getProviderIcon}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                >
                  <IoClose className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <IoWarning className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              </div>
            )}
          </div>

          {/* Conversation header */}
          <ConversationHeader
            conversation={activeConversation}
            onOpenConversationList={() => setConversationListOpen(true)}
            onDeleteConversation={handleDeleteActiveConversation}
          />

          {/* Selected Components */}
          {activeConversation &&
            activeConversation.selectedComponents.length > 0 && (
              <div className="p-3 border-b border-border bg-muted/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Context ({activeConversation.selectedComponents.length})
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (activeConversation) {
                        activeConversation.selectedComponents.forEach(
                          (comp) => {
                            removeComponentFromConversation(
                              comp.id,
                              activeConversation.id
                            );
                          }
                        );
                      }
                    }}
                    className="h-6 text-xs text-muted-foreground hover:text-destructive"
                  >
                    Clear All
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  <AnimatePresence>
                    {activeConversation.selectedComponents.map((component) => (
                      <ComponentBadge
                        key={component.id}
                        component={component}
                        onRemove={handleRemoveComponent}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full px-4">
            <div className="space-y-4 py-4">
              {activeConversation ? (
                <>
                  <AnimatePresence>
                    {activeConversation.messages.map((message) => (
                      <MessageComponent
                        key={message.id}
                        message={message}
                        getProviderIcon={getProviderIcon}
                      />
                    ))}
                  </AnimatePresence>

                  {isQueryLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-2 mr-8">
                        <RiLoader4Line className="w-4 h-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">
                          Analyzing content...
                        </span>
                      </div>
                    </motion.div>
                  )}
                </>
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
        <div className="flex-shrink-0 p-4 border-t border-border">
          <div className="mb-4">
            <div className="flex gap-2">
              {/* Model Selection */}
              <div className="flex-1">
                <ModelProvider
                  modelPopoverOpen={modelPopoverOpen}
                  setModelPopoverOpen={setModelPopoverOpen}
                  isInitialized={conversationLLM.isInitialized}
                  providers={conversationLLM.availableProviders}
                  selectedProvider={selectedProvider as LLMProviderId}
                  selectedModel={selectedModel}
                  handleModelSelect={handleModelSelect}
                  getProviderIcon={getProviderIcon}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder={
                  !conversationLLM.isInitialized
                    ? "Initializing..."
                    : "Ask about your document..."
                }
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && !e.shiftKey && handleSendMessage()
                }
                disabled={!conversationLLM.isInitialized || isQueryLoading}
                className="text-sm rounded-2xl border-1 border-border bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary/30"
              />
              <motion.div
                animate={{
                  scale:
                    !conversationLLM.isInitialized ||
                    isQueryLoading ||
                    !inputValue.trim()
                      ? 0.95
                      : 1,
                }}
                whileHover={
                  !conversationLLM.isInitialized ||
                  isQueryLoading ||
                  !inputValue.trim()
                    ? {}
                    : {
                        scale: 1.05,
                        rotate: [0, -2, 2, 0],
                      }
                }
                whileTap={
                  !conversationLLM.isInitialized ||
                  isQueryLoading ||
                  !inputValue.trim()
                    ? {}
                    : { scale: 0.95 }
                }
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 17,
                  rotate: { duration: 0.3 },
                }}
              >
                <Button
                  onClick={handleSendMessage}
                  disabled={
                    !conversationLLM.isInitialized ||
                    isQueryLoading ||
                    !inputValue.trim()
                  }
                  size="sm"
                  className="shrink-0 px-3 rounded-2xl relative overflow-hidden group bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 border border-primary/40 text-primary hover:from-primary/30 hover:via-primary/50 hover:to-primary/30 hover:border-primary/60 hover:text-primary-foreground shadow-lg hover:shadow-primary/25 transition-all duration-300 ease-out cursor-pointer"
                >
                  <motion.div
                    animate={
                      isQueryLoading
                        ? {
                            rotate: 360,
                            scale: [1, 1.1, 1],
                          }
                        : {}
                    }
                    transition={
                      isQueryLoading
                        ? {
                            rotate: {
                              duration: 2,
                              repeat: Infinity,
                              ease: "linear",
                            },
                            scale: {
                              duration: 1,
                              repeat: Infinity,
                              ease: "easeInOut",
                            },
                          }
                        : {}
                    }
                  >
                    <IoSend className="w-4 h-4 relative z-10" />
                  </motion.div>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Conversation List Dialog */}
      <ConversationListDialog
        open={conversationListOpen}
        onOpenChange={setConversationListOpen}
      />
    </>
  );
};

export default EnhancedChatSidebar;
