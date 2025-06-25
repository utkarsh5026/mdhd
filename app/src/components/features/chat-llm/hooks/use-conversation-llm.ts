import { useCallback, useState } from "react";
import { useConversationStore } from "../store/conversation-store";
import type { ComponentSelection } from "../../markdown-render/types";
import useComponent from "./use-component";
import { useMessageActions, useStreamMessage } from "./use-messages";
import { useLLMState } from "./use-llm";
import { useActiveConversation } from "./use-conversation";

/**
 * Enhanced LLM integration that bridges the LLM service with conversation management
 *
 * This hook provides a clean interface for:
 * - Sending messages within conversations
 * - Streaming responses to specific conversations
 * - Managing conversation context with components
 * - Automatic conversation creation when needed
 */
export const useConversationLLM = () => {
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

  const { isInitialized, selectedProvider, selectedModel } = useLLMState();
  const { streamMessage } = useStreamMessage();

  /**
   * Generate a contextual prompt that includes component information
   * This helps the LLM understand what components the user is asking about
   */

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
        addMessage(
          {
            content: message,
            selections: options?.components,
          },
          "user",
          targetConversationId
        );

        const assistantMessageId = addMessage(
          {
            content: "",
            selections: options?.components,
          },
          "assistant",
          targetConversationId
        );

        if (!assistantMessageId) {
          throw new Error("Failed to add assistant message");
        }

        const contextualPrompt = _generateContextualPrompt(
          message,
          conversation.selectedComponents,
          conversation.currentSectionId
            ? {
                id: conversation.currentSectionId,
                title: conversation.currentSectionTitle || "Unknown Section",
              }
            : undefined
        );

        await streamMessage(
          contextualPrompt,
          {
            components: conversation.selectedComponents,
            provider: selectedProvider,
            model: selectedModel,
          },
          targetConversationId
        );

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
      isInitialized,
      addMessage,
      setMessageStreaming,
      streamMessage,
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

      if (question) {
        await sendMessageToConversation(question, targetConversationId, {
          components,
        });
      }

      return targetConversationId;
    },
    [createConversation, addComponentToConversation, sendMessageToConversation]
  );

  return {
    isQueryLoading,

    sendMessageToConversation,
    sendMessageToActiveConversation,
    askAboutComponent,
    addComponentsAndAsk,

    isStreaming: currentStreamingConversation !== null,
    streamingConversationId: currentStreamingConversation,
  };
};

/**
 * Hook for using LLM with the currently active conversation
 * Simplified interface for common use cases
 */
export const useActiveConversationLLM = () => {
  const conversationLLM = useConversationLLM();
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
