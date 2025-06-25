import { useCallback, useState } from "react";
import type { ComponentSelection } from "@/components/features/markdown-render/types";
import type { Conversation, ChatMessage } from "../types";

import {
  useConversation,
  useConversationActions,
  useActiveConversation,
  useStreamMessage,
} from "./use-conversation";
import { useLLMState, useLLMActions } from "./use-llm";
import { useComponent } from "./use-component";
import { useChatInput, useSelectedComponents } from "./use-chat";

/**
 * Configuration options for the LLM conversation manager
 */
interface ConversationLLMConfig {
  /** Auto-create a conversation when sending first message */
  autoCreateConversation?: boolean;
  /** Default title for auto-created conversations */
  defaultConversationTitle?: string;
  /** Callback fired when an error occurs */
  onError?: (error: Error) => void;
  /** Callback fired when a message is sent */
  onMessageSent?: (message: ChatMessage) => void;
  /** Callback fired when a response is received */
  onResponseReceived?: (message: ChatMessage) => void;
  /** Callback fired when conversation is created */
  onConversationCreated?: (conversation: Conversation) => void;
  /** Auto-clear input after sending message */
  autoClearInput?: boolean;
  /** Maximum retry attempts for failed messages */
  maxRetries?: number;
}

/**
 * Options for sending messages
 */
interface SendMessageOptions {
  /** Specific conversation ID to send to */
  conversationId?: string;
  /** Components to include in context */
  components?: ComponentSelection[];
  /** Create new conversation if none exists */
  createIfNeeded?: boolean;
  /** Custom conversation title if creating new */
  conversationTitle?: string;
  /** Temperature for LLM response */
  temperature?: number;
  /** Maximum tokens for response */
  maxTokens?: number;
}

/**
 * 🚀 Enhanced LLM Conversation Manager Hook
 *
 * A comprehensive hook that unifies all LLM conversation functionality into a single,
 * intuitive API. This hook manages:
 *
 * - Conversation lifecycle (create, update, delete)
 * - Message sending and streaming
 * - Component context management
 * - Input state management
 * - Provider selection
 * - Error handling and retries
 *
 * @param config Configuration options for the conversation manager
 * @returns Comprehensive conversation management interface
 */
export const useConversationLLMManager = (
  config: ConversationLLMConfig = {}
) => {
  const {
    autoCreateConversation = true,
    defaultConversationTitle = "New Conversation",
    onError,
    onMessageSent,
    onResponseReceived,
    onConversationCreated,
    autoClearInput = true,
    maxRetries = 3,
  } = config;
  const { conversations, conversationSummaries } = useConversation();
  const {
    activeConversation,
    setActiveConversation,
    error: conversationError,
  } = useActiveConversation();

  const {
    createConversation: createConv,
    deleteConversation: deleteConv,
    clearMessagesOfConversation,
    updateConversationTitle,
    addMessageToConversation,
    setMessageStreaming,
  } = useConversationActions();

  const {
    streamMessage,
    isLoading: streamLoading,
    error: streamError,
  } = useStreamMessage();

  const {
    llmService,
    isInitialized,
    isLoading: llmLoading,
    error: llmError,
    selectedProvider,
    selectedModel,
    availableProviders,
  } = useLLMState();

  const { getCurrentProvider, clearError: clearLLMError } = useLLMActions();

  const {
    addComponentToConversation: addCompToConv,
    removeComponentFromConversation: removeCompFromConv,
    clearComponentsFromConversation: clearCompFromConv,
  } = useComponent();

  const {
    inputValue,
    handleInputChange,
    clearInput: clearChatInput,
  } = useChatInput();

  const {
    selectedComponents,
    addComponent: addCompToInput,
    removeComponent: removeCompFromInput,
    clearComponents: clearInputComps,
  } = useSelectedComponents();

  const [retryCount, setRetryCount] = useState(0);
  const [lastFailedMessage, setLastFailedMessage] = useState<{
    message: string;
    options?: SendMessageOptions;
  } | null>(null);

  const isLoading = llmLoading || streamLoading;
  const isStreaming = streamLoading;
  const error = conversationError || streamError || llmError;

  const createConversation = useCallback(
    async (
      title?: string,
      initialComponent?: ComponentSelection
    ): Promise<string> => {
      try {
        const conversationTitle = title || defaultConversationTitle;
        return createConv(
          conversationTitle,
          initialComponent,
          onConversationCreated
        );
      } catch (err) {
        onError?.(err as Error);
        throw err;
      }
    },
    [createConv, defaultConversationTitle, onConversationCreated, onError]
  );

  const switchToConversation = useCallback(
    (conversationId: string) => {
      try {
        setActiveConversation(conversationId);
        setRetryCount(0); // Reset retry count when switching conversations
        setLastFailedMessage(null);
      } catch (error) {
        const err = new Error(`Failed to switch conversation: ${error}`);
        onError?.(err);
        throw err;
      }
    },
    [setActiveConversation, onError]
  );

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      try {
        deleteConv(conversationId);
      } catch (error) {
        const err = new Error(`Failed to delete conversation: ${error}`);
        onError?.(err);
        throw err;
      }
    },
    [deleteConv, onError]
  );

  const clearConversationMessages = useCallback(
    (conversationId?: string) => {
      try {
        const targetId = conversationId || activeConversation?.id;
        if (!targetId) throw new Error("No conversation specified or active");

        clearMessagesOfConversation(targetId);
      } catch (error) {
        const err = new Error(`Failed to clear messages: ${error}`);
        onError?.(err);
        throw err;
      }
    },
    [activeConversation, clearMessagesOfConversation, onError]
  );

  const sendMessage = useCallback(
    async (
      message: string,
      options: SendMessageOptions = {}
    ): Promise<{
      conversationId: string;
      messageId: string;
    }> => {
      if (!isInitialized || !llmService) {
        const err = new Error("LLM service not initialized");
        onError?.(err);
        throw err;
      }

      if (!message.trim()) {
        const err = new Error("Message cannot be empty");
        onError?.(err);
        throw err;
      }

      try {
        let targetConversationId =
          options.conversationId || activeConversation?.id;

        // Auto-create conversation if needed
        if (
          !targetConversationId &&
          (autoCreateConversation || options.createIfNeeded)
        ) {
          const title =
            options.conversationTitle || `Chat: ${message.slice(0, 30)}...`;
          targetConversationId = await createConversation(
            title,
            options.components?.[0]
          );
        }

        if (!targetConversationId) {
          throw new Error(
            "No conversation available and auto-creation disabled"
          );
        }

        const conversation = conversations.get(targetConversationId);
        if (!conversation) {
          throw new Error(`Conversation ${targetConversationId} not found`);
        }

        // Add user message
        const userMessageId = addMessageToConversation(
          {
            content: message,
            selections: options.components || selectedComponents,
          },
          "user",
          targetConversationId
        );

        if (!userMessageId) {
          throw new Error("Failed to add user message");
        }

        const userMessage = {
          id: userMessageId,
          type: "user" as const,
          content: message,
          timestamp: new Date(),
          selections: options.components || selectedComponents,
        };

        onMessageSent?.(userMessage);

        // Add assistant message placeholder
        const assistantMessageId = addMessageToConversation(
          {
            content: "",
            selections: options.components || selectedComponents,
          },
          "assistant",
          targetConversationId
        );

        if (!assistantMessageId) {
          throw new Error("Failed to add assistant message");
        }

        // Generate contextual prompt
        const allComponents = [
          ...conversation.selectedComponents,
          ...(options.components || selectedComponents),
        ];

        const contextualPrompt = _generateContextualPrompt(
          message,
          allComponents,
          conversation.currentSectionId
            ? {
                id: conversation.currentSectionId,
                title: conversation.currentSectionTitle || "Unknown Section",
              }
            : undefined
        );

        // Stream response
        await streamMessage(
          contextualPrompt,
          {
            components: allComponents,
            provider: selectedProvider,
            model: selectedModel,
            temperature: options.temperature || 0.7,
            maxTokens: options.maxTokens,
          },
          targetConversationId
        );

        setMessageStreaming(assistantMessageId, false, targetConversationId);

        const assistantMessage = {
          id: assistantMessageId,
          type: "assistant" as const,
          content: "", // Will be updated via streaming
          timestamp: new Date(),
          selections: options.components || selectedComponents,
        };

        onResponseReceived?.(assistantMessage);

        // Clear input if configured
        if (autoClearInput) {
          clearChatInput();
        }

        // Reset retry count on success
        setRetryCount(0);
        setLastFailedMessage(null);

        return {
          conversationId: targetConversationId,
          messageId: assistantMessageId,
        };
      } catch (error) {
        // Store failed message for retry
        setLastFailedMessage({ message, options });

        const err = new Error(`Failed to send message: ${error}`);
        onError?.(err);
        throw err;
      }
    },
    [
      isInitialized,
      llmService,
      activeConversation,
      autoCreateConversation,
      conversations,
      selectedComponents,
      selectedProvider,
      selectedModel,
      addMessageToConversation,
      setMessageStreaming,
      streamMessage,
      createConversation,
      autoClearInput,
      clearChatInput,
      onError,
      onMessageSent,
      onResponseReceived,
    ]
  );

  const askAboutComponent = useCallback(
    async (
      component: ComponentSelection,
      question: string,
      options: Omit<SendMessageOptions, "components"> = {}
    ): Promise<string> => {
      try {
        // Create conversation with component context
        const conversationTitle = `About ${
          component.type
        }: ${component.title.slice(0, 30)}...`;
        const conversationId =
          options.conversationId ||
          (await createConversation(conversationTitle, component));

        // Add component to conversation if not already there
        addCompToConv(component, conversationId);

        // Send message with component context
        await sendMessage(question, {
          ...options,
          conversationId,
          components: [component],
        });

        return conversationId;
      } catch (error) {
        const err = new Error(`Failed to ask about component: ${error}`);
        onError?.(err);
        throw err;
      }
    },
    [createConversation, addCompToConv, sendMessage, onError]
  );

  // =================== COMPONENT MANAGEMENT ===================
  const addComponentToConversation = useCallback(
    (component: ComponentSelection, conversationId?: string) => {
      try {
        const targetId = conversationId || activeConversation?.id;
        if (!targetId) {
          throw new Error("No conversation specified or active");
        }
        addCompToConv(component, targetId);
      } catch (error) {
        const err = new Error(`Failed to add component: ${error}`);
        onError?.(err);
        throw err;
      }
    },
    [activeConversation, addCompToConv, onError]
  );

  const removeComponentFromConversation = useCallback(
    (componentId: string, conversationId?: string) => {
      try {
        const targetId = conversationId || activeConversation?.id;
        if (!targetId) throw new Error("No conversation specified or active");

        removeCompFromConv(componentId, targetId);
      } catch (error) {
        const err = new Error(`Failed to remove component: ${error}`);
        onError?.(err);
        throw err;
      }
    },
    [activeConversation, removeCompFromConv, onError]
  );

  const clearConversationComponents = useCallback(
    (conversationId?: string) => {
      try {
        const targetId = conversationId || activeConversation?.id;
        if (!targetId) {
          throw new Error("No conversation specified or active");
        }
        clearCompFromConv(targetId);
      } catch (error) {
        const err = new Error(`Failed to clear components: ${error}`);
        onError?.(err);
        throw err;
      }
    },
    [activeConversation, clearCompFromConv, onError]
  );

  const clearInputComponents = useCallback(() => {
    clearInputComps();
  }, [clearInputComps]);

  // =================== UTILITY METHODS ===================
  const retryLastMessage = useCallback(async () => {
    if (!lastFailedMessage) {
      const err = new Error("No failed message to retry");
      onError?.(err);
      throw err;
    }

    if (retryCount >= maxRetries) {
      const err = new Error(`Maximum retry attempts (${maxRetries}) exceeded`);
      onError?.(err);
      throw err;
    }

    try {
      setRetryCount((prev) => prev + 1);
      await sendMessage(lastFailedMessage.message, lastFailedMessage.options);
    } catch (error) {
      const err = new Error(`Retry failed: ${error}`);
      onError?.(err);
      throw err;
    }
  }, [lastFailedMessage, retryCount, maxRetries, sendMessage, onError]);

  const clearError = useCallback(() => {
    clearLLMError();
    setRetryCount(0);
    setLastFailedMessage(null);
  }, [clearLLMError]);

  return {
    activeConversation,
    conversations,
    conversationSummaries,
    isLoading,
    isStreaming,
    isInitialized,
    error,
    inputValue,
    selectedComponents,
    availableProviders,
    selectedProvider,
    selectedModel,

    setActiveConversation,
    createConversation,
    switchToConversation,
    deleteConversation,
    updateConversationTitle,
    clearConversationMessages,

    sendMessage,
    askAboutComponent,

    addComponentToConversation,
    removeComponentFromConversation,
    clearConversationComponents,

    setInputValue: handleInputChange,
    clearInput: clearChatInput,
    addComponentToInput: addCompToInput,
    removeComponentFromInput: removeCompFromInput,
    clearInputComponents,

    getCurrentProvider,

    retryLastMessage,
    clearError,
  };
};

/**
 * Generate a contextual prompt that includes component information
 * This helps the LLM understand what components the user is asking about
 */
const _generateContextualPrompt = (
  question: string,
  components: ComponentSelection[],
  sectionContext?: { id: string; title: string }
): string => {
  let prompt = question;

  if (sectionContext) {
    prompt = `Context: This question is about content from the section "${sectionContext.title}".

${question}`;
  }

  if (components.length > 0) {
    const componentDescriptions = components
      .map((comp) => `- ${comp.type}: ${comp.title}`)
      .join("\n");

    prompt = `${prompt}

Available components to reference:
${componentDescriptions}

Please provide a helpful response based on the provided content.`;
  }

  return prompt;
};
