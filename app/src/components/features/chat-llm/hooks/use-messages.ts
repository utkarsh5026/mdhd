import {
  useConversationStore,
  useActiveConversation,
  useConversations,
} from "../store/conversation-store";
import type {
  ChatMessage,
  Conversation,
  LLMQueryOptions,
  ChatMessageType,
} from "../types";
import { useCallback, useState } from "react";
import { useLLMState } from "./use-llm";

const generateMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

const _generateConversationTitle = (firstMessage: string): string => {
  const title = firstMessage.slice(0, 50).trim();
  return title.length < firstMessage.length ? title + "..." : title;
};

export const useMessageActions = () => {
  const activeConversation = useActiveConversation();
  const conversations = useConversations();
  const updateConversation = useConversationStore(
    (state) => state.updateConversation
  );

  const validateConversation = useCallback(
    (conversationId?: string) => {
      const targetId = conversationId ?? activeConversation?.id;
      if (!targetId) return null;

      const conversation = conversations.get(targetId);
      if (!conversation) return null;

      return conversation;
    },
    [activeConversation, conversations]
  );

  const updateCurrentConversation = useCallback(
    (conversation: Conversation, conversationId?: string) => {
      const targetId = conversationId ?? activeConversation?.id;
      if (!targetId) return;
      updateConversation(targetId, conversation);
    },
    [activeConversation, updateConversation]
  );

  const addMessage = useCallback(
    (
      message: Pick<ChatMessage, "content" | "selections">,
      msgType: ChatMessageType,
      conversationId: string
    ): string | undefined => {
      const conversation = validateConversation(conversationId);
      if (!conversation) return undefined;

      const messageId = generateMessageId();
      const fullMessage: ChatMessage = {
        ...message,
        id: messageId,
        timestamp: new Date(),
        type: msgType,
      };

      let updatedTitle = conversation.title;
      if (
        conversation.messages.length === 0 &&
        msgType === "user" &&
        conversation.title === "New Conversation"
      ) {
        updatedTitle = _generateConversationTitle(message.content);
      }

      updateCurrentConversation({
        ...conversation,
        title: updatedTitle,
        messages: [...conversation.messages, fullMessage],
        updatedAt: new Date(),
      });

      return messageId;
    },
    [updateCurrentConversation, validateConversation]
  );

  const updateMessage = useCallback(
    (messageId: string, content: string, conversationId: string) => {
      const conversation = validateConversation(conversationId);
      if (!conversation) return;

      const updatedMessages = conversation.messages.map((msg) =>
        msg.id === messageId ? { ...msg, content } : msg
      );

      const updatedConversation = {
        ...conversation,
        messages: updatedMessages,
        updatedAt: new Date(),
      };

      updateCurrentConversation(updatedConversation);
    },
    [updateCurrentConversation, validateConversation]
  );

  const setMessageStreaming = useCallback(
    (messageId: string, isStreaming: boolean, conversationId: string) => {
      const conversation = validateConversation(conversationId);
      if (!conversation) return;

      const updatedMessages = conversation.messages.map((msg) =>
        msg.id === messageId ? { ...msg, isStreaming } : msg
      );

      const updatedConversation = {
        ...conversation,
        messages: updatedMessages,
        updatedAt: new Date(),
      };

      updateCurrentConversation(updatedConversation);
    },
    [updateCurrentConversation, validateConversation]
  );

  const clearMessages = useCallback(
    (conversationId: string) => {
      const conversation = validateConversation(conversationId);
      if (!conversation) return;

      const updatedConversation = {
        ...conversation,
        messages: [],
        updatedAt: new Date(),
      };

      updateCurrentConversation(updatedConversation);
    },
    [updateCurrentConversation, validateConversation]
  );

  return {
    addMessage,
    updateMessage,
    setMessageStreaming,
    clearMessages,
  };
};

export const useStreamMessage = () => {
  const { llmService, isInitialized } = useLLMState();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addMessage, updateMessage, setMessageStreaming } =
    useMessageActions();

  const addFirstMessage = useCallback(
    (options: LLMQueryOptions, conversationId: string, msgId: string) => {
      const { components, model, provider } = options;
      const assistantMessage = {
        type: "assistant" as const,
        content: "",
        selections: components,
        model,
        provider,
        isStreaming: true,
        id: msgId,
        timestamp: new Date(),
      };
      addMessage(assistantMessage, "assistant", conversationId);
    },
    [addMessage]
  );

  const streamMessage = useCallback(
    async (
      content: string,
      options: LLMQueryOptions,
      conversationId: string
    ) => {
      if (!isInitialized || !llmService) {
        setError("LLM service is not initialized");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { components, model, provider } = options;
        const assistantMessageId = generateMessageId();
        addFirstMessage(options, conversationId, assistantMessageId);

        let fullContent = "";

        await llmService.streamQueryWithContext(
          content,
          {
            components,
            sources: [],
            provider,
            model,
            temperature: options.temperature || 0.7,
          },
          (chunk: string) => {
            fullContent += chunk;
            updateMessage(assistantMessageId, fullContent, conversationId);
          }
        );

        setMessageStreaming(assistantMessageId, false, conversationId);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to stream LLM response";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [
      llmService,
      addFirstMessage,
      updateMessage,
      setMessageStreaming,
      isInitialized,
    ]
  );

  return {
    isLoading,
    error,
    streamMessage,
  };
};
