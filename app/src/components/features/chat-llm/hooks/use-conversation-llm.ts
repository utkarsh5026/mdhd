import { useCallback, useEffect, useState } from "react";
import { useLLM } from "./use-llm";
import {
  useActiveConversation,
  useConversationStore,
} from "../store/conversation-store";
import type { MarkdownSection } from "@/services/section/parsing";
import type { LLMProviderId } from "../types";
import type { ComponentSelection } from "../../markdown-render/types";
import useComponent from "./use-component";
import { useMessageActions } from "./use-messages";

/**
 * Enhanced LLM integration that bridges the LLM service with conversation management
 *
 * This hook provides a clean interface for:
 * - Sending messages within conversations
 * - Streaming responses to specific conversations
 * - Managing conversation context with components
 * - Automatic conversation creation when needed
 */
export const useConversationLLM = (llmConfig: {
  openAIApiKey?: string;
  anthropicApiKey?: string;
  googleApiKey?: string;
}) => {
  const [currentStreamingConversation, setCurrentStreamingConversation] =
    useState<string | null>(null);

  const createConversation = useConversationStore(
    (state) => state.createConversation
  );
  const getConversation = useConversationStore(
    (state) => state.getConversation
  );

  const activeConversation = useActiveConversation();
  const { addComponentToConversation } = useComponent();
  const { addMessage, setMessageStreaming } = useMessageActions();
  const [isQueryLoading, setIsQueryLoading] = useState(false);

  const {
    selectedProvider,
    selectedModel,
    streamMessage,
    isInitialized,
    availableProviders,
    updateProvider,
    isLoading,
    error,
    isProviderModelAvailable,
  } = useLLM(llmConfig);

  /**
   * Convert ComponentSelection to MarkdownSection for LLM processing
   * This bridges the component system with the LLM's expected input format
   */
  const convertComponentsToSections = useCallback(
    (components: ComponentSelection[]): MarkdownSection[] => {
      return components.map((component, index) => ({
        id: component.id,
        title: component.title,
        content: component.content,
        level: (component.metadata?.level || 1) as 0 | 2 | 1,
        wordCount: component.content.split(/\s+/).length,
        slug: `component-${index}`,
      }));
    },
    []
  );

  /**
   * Generate a contextual prompt that includes component information
   * This helps the LLM understand what components the user is asking about
   */
  const generateContextualPrompt = useCallback(
    (
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
    },
    []
  );

  /**
   * Send a message to a specific conversation and get an AI response
   * This is the main interface for conversation-based AI interactions
   */
  const sendMessageToConversation = useCallback(
    async (
      message: string,
      conversationId?: string,
      options?: {
        createNewIfNeeded?: boolean;
        conversationTitle?: string;
        components?: ComponentSelection[];
      }
    ): Promise<{ conversationId: string; messageId: string }> => {
      if (!isInitialized) {
        throw new Error("LLM service not initialized");
      }

      let targetConversationId = conversationId;

      if (!targetConversationId && options?.createNewIfNeeded) {
        targetConversationId = createConversation(
          options.conversationTitle || `Chat: ${message.slice(0, 30)}...`,
          options.components?.[0]
        );

        if (options.components && options.components.length > 1) {
          options.components.slice(1).forEach((component) => {
            addComponentToConversation(component, targetConversationId!);
          });
        }
      }

      if (!targetConversationId) {
        throw new Error(
          "No conversation specified and createNewIfNeeded is false"
        );
      }

      const conversation = getConversation(targetConversationId);
      if (!conversation) {
        throw new Error(`Conversation ${targetConversationId} not found`);
      }

      setIsQueryLoading(true);
      setCurrentStreamingConversation(targetConversationId);

      try {
        // Add user message to conversation
        const userMessageId = `msg_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 9)}`;
        addMessage(
          {
            id: userMessageId,
            type: "user",
            content: message,
            timestamp: new Date(),
            selections: options?.components,
          },
          targetConversationId
        );

        // Create assistant message placeholder
        const assistantMessageId = `msg_${Date.now() + 1}_${Math.random()
          .toString(36)
          .substring(2, 9)}`;
        addMessage(
          {
            id: assistantMessageId,
            type: "assistant",
            content: "",
            timestamp: new Date(),
            isStreaming: true,
            model: selectedModel,
            provider: selectedProvider,
          },
          targetConversationId
        );

        // Convert components to sections for LLM
        const sections = convertComponentsToSections(
          conversation.selectedComponents
        );

        // Generate contextual prompt
        const contextualPrompt = generateContextualPrompt(
          message,
          conversation.selectedComponents,
          conversation.currentSectionId
            ? {
                id: conversation.currentSectionId,
                title: conversation.currentSectionTitle || "Unknown Section",
              }
            : undefined
        );

        // Stream response from LLM
        await streamMessage(contextualPrompt, {
          sections,
          provider: selectedProvider,
          model: selectedModel,
        });

        // The streamMessage should handle updating the message content
        // But we need to mark streaming as complete
        setMessageStreaming(assistantMessageId, false, targetConversationId);

        return {
          conversationId: targetConversationId,
          messageId: assistantMessageId,
        };
      } catch (error) {
        console.error("Failed to send message:", error);
        throw error;
      } finally {
        setIsQueryLoading(false);
        setCurrentStreamingConversation(null);
      }
    },
    [
      createConversation,
      addComponentToConversation,
      getConversation,
      selectedProvider,
      selectedModel,
      convertComponentsToSections,
      generateContextualPrompt,
      streamMessage,
      isInitialized,
      addMessage,
      setMessageStreaming,
    ]
  );

  /**
   * Ask a question about a specific component
   * This creates or uses an existing conversation and adds the component to context
   */
  const askAboutComponent = useCallback(
    async (
      component: ComponentSelection,
      question: string,
      conversationId?: string
    ): Promise<string> => {
      const targetConversationId =
        conversationId ||
        createConversation(
          `About ${component.type}: ${component.title.slice(0, 30)}...`,
          component
        );

      addComponentToConversation(component, targetConversationId);
      await sendMessageToConversation(question, targetConversationId, {
        components: [component],
      });
      return targetConversationId;
    },
    [sendMessageToConversation, createConversation, addComponentToConversation]
  );

  /**
   * Send a message in the currently active conversation
   * Convenience method for the most common use case
   */
  const sendMessageToActiveConversation = useCallback(
    async (message: string) => {
      if (!activeConversation) {
        // Create new conversation if none active
        return sendMessageToConversation(message, undefined, {
          createNewIfNeeded: true,
          conversationTitle: `Chat: ${message.slice(0, 30)}...`,
        });
      }

      return sendMessageToConversation(message, activeConversation.id);
    },
    [sendMessageToConversation, activeConversation]
  );

  /**
   * Add components to the current conversation and optionally ask a question
   */
  const addComponentsAndAsk = useCallback(
    async (
      components: ComponentSelection[],
      question?: string,
      conversationId?: string
    ): Promise<string> => {
      let targetConversationId = conversationId;

      // Create conversation if needed
      if (!targetConversationId) {
        const firstComponent = components[0];
        targetConversationId = createConversation(
          firstComponent
            ? `About ${firstComponent.type}: ${firstComponent.title.slice(
                0,
                30
              )}...`
            : "New Discussion",
          firstComponent
        );
      }

      // Add all components to conversation
      components.forEach((component) => {
        addComponentToConversation(component, targetConversationId);
      });

      // Ask question if provided
      if (question) {
        await sendMessageToConversation(question, targetConversationId, {
          components,
        });
      }

      return targetConversationId;
    },
    [createConversation, addComponentToConversation, sendMessageToConversation]
  );

  /**
   * Initialize LLM integration
   * Sets up welcome messages and provider configuration
   */
  useEffect(() => {
    if (isInitialized && availableProviders.length > 0) {
      // Update provider/model if current selection is not available
      const currentProvider = availableProviders.find(
        (p) => p.id === selectedProvider
      );
      if (!currentProvider) {
        const firstProvider = availableProviders[0];
        updateProvider(firstProvider.id as LLMProviderId);
      } else if (!currentProvider.models.includes(selectedModel || "")) {
        updateProvider(selectedProvider as LLMProviderId);
      }
    }
  }, [
    isInitialized,
    availableProviders,
    selectedProvider,
    selectedModel,
    updateProvider,
  ]);

  return {
    // LLM service state
    isInitialized,
    isLoading,
    error,
    availableProviders,
    isQueryLoading,

    // Conversation actions
    sendMessageToConversation,
    sendMessageToActiveConversation,
    askAboutComponent,
    addComponentsAndAsk,

    // Current state
    isStreaming: currentStreamingConversation !== null,
    streamingConversationId: currentStreamingConversation,

    // Provider management
    updateProvider,
    isProviderModelAvailable,
  };
};

/**
 * Hook for using LLM with the currently active conversation
 * Simplified interface for common use cases
 */
export const useActiveConversationLLM = (llmConfig: {
  openAIApiKey?: string;
  anthropicApiKey?: string;
  googleApiKey?: string;
}) => {
  const conversationLLM = useConversationLLM(llmConfig);
  const activeConversation = useActiveConversation();

  const sendMessage = useCallback(
    async (message: string) => {
      return conversationLLM.sendMessageToActiveConversation(message);
    },
    [conversationLLM]
  );

  const askAboutComponent = useCallback(
    async (component: ComponentSelection, question: string) => {
      return conversationLLM.askAboutComponent(
        component,
        question,
        activeConversation?.id
      );
    },
    [conversationLLM, activeConversation]
  );

  return {
    ...conversationLLM,
    sendMessage,
    askAboutComponent,
    activeConversation,
  };
};
