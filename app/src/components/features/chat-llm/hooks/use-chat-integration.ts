// src/components/features/chat-llm/hooks/index.ts

import { ComponentSelection } from "../../markdown-render/services/component-service";
import { useEnhancedChatStore } from "../store/chat-store";
import { useConversationLLM } from "./use-conversation-llm";

/**
 * Centralized exports for all chat and LLM related hooks
 * This provides a clean API for components to interact with the conversation system
 */

// Enhanced conversation management hooks
export { useEnhancedChatStore } from "../store/chat-store";
export {
  useConversationLLM,
  useActiveConversationLLM,
} from "./use-conversation-llm";

// Legacy LLM hooks (for backwards compatibility)
export { useLLM } from "./use-llm";
export { useMDHDRAG } from "./use-rag";

// Convenience hooks for specific functionality
export {
  useActiveConversation,
  useConversationSummaries,
  useChatVisibility,
  useAskDialog,
} from "../store/chat-store";

// Types
export type {
  ChatMessage,
  Conversation,
  ConversationSummary,
} from "../store/chat-store";

export type {
  ComponentSelection,
  ComponentType,
} from "../../markdown-render/services/component-service";

/**
 * Main hook for components that need to interact with the conversation system
 * This is the primary interface most components should use
 */
export const useChatIntegration = () => {
  const store = useEnhancedChatStore();
  const llm = useConversationLLM({
    openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY,
    anthropicApiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
    googleApiKey: import.meta.env.VITE_GOOGLE_API_KEY,
  });

  return {
    // Store state
    activeConversation: store.getActiveConversation(),
    conversations: store.getConversationSummaries(),
    isVisible: store.isVisible,
    isLoading: store.isQueryLoading,

    // Core actions
    askAboutComponent: llm.askAboutComponent,
    addComponentToChat: store.addComponentToConversation,
    sendMessage: llm.sendMessageToActiveConversation,

    // Conversation management
    createConversation: store.createConversation,
    setActiveConversation: store.setActiveConversation,
    deleteConversation: store.deleteConversation,

    // UI management
    openAskDialog: store.openAskDialog,
    closeAskDialog: store.closeAskDialog,
    setVisibility: store.setVisibility,
    toggleVisibility: store.toggleVisibility,

    // LLM state
    isInitialized: llm.isInitialized,
    availableProviders: llm.availableProviders,
    error: llm.error,
  };
};

/**
 * Hook for components that only need to add items to chat
 * Simplified interface for the most common use case
 */
export const useAddToChat = () => {
  const { addComponentToConversation, setVisibility } = useEnhancedChatStore();

  return (component: ComponentSelection) => {
    addComponentToConversation(component);
    setVisibility(true);
  };
};

/**
 * Hook for components that only need to ask questions
 * Simplified interface for question asking
 */
export const useAskAboutComponent = () => {
  const { openAskDialog } = useEnhancedChatStore();

  return (component: ComponentSelection) => {
    openAskDialog(component);
  };
};
