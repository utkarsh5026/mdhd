import { useCallback } from "react";
import type { ComponentSelection } from "@/components/features/markdown-render/types";
import type { Conversation, ChatMessage } from "../types";

import {
  useConversation,
  useConversationActions,
  useActiveConversation,
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
    defaultConversationTitle = "New Conversation",
    onError,
    onConversationCreated,
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
  } = useConversationActions();

  const {
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

  const isLoading = llmLoading;
  const error = conversationError || llmError;

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

  const clearError = useCallback(() => {
    clearLLMError();
  }, [clearLLMError]);

  return {
    activeConversation,
    conversations,
    conversationSummaries,
    isLoading,
    isInitialized,
    error,
    inputValue,
    selectedComponents,
    availableProviders,
    selectedProvider,
    selectedModel,

    setActiveConversation,
    createConversation,
    deleteConversation,
    updateConversationTitle,
    clearConversationMessages,

    addComponentToConversation,
    removeComponentFromConversation,
    clearConversationComponents,

    setInputValue: handleInputChange,
    clearInput: clearChatInput,
    addComponentToInput: addCompToInput,
    removeComponentFromInput: removeCompFromInput,
    clearInputComponents,

    getCurrentProvider,

    clearError,
  };
};
