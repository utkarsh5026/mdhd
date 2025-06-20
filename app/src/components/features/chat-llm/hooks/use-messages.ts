import {
  useConversationStore,
  useActiveConversation,
  useConversations,
} from "../store/conversation-store";
import type { ChatMessage, Conversation } from "../types";
import { useCallback } from "react";

const generateMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Utility function to generate conversation titles from first message
 */
const generateConversationTitle = (firstMessage: string): string => {
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
    (message: ChatMessage, conversationId: string) => {
      const conversation = validateConversation(conversationId);
      if (!conversation) return;

      const fullMessage: ChatMessage = {
        ...message,
        id: message.id || generateMessageId(),
        timestamp: new Date(),
      };

      let updatedTitle = conversation.title;
      if (
        conversation.messages.length === 0 &&
        message.type === "user" &&
        conversation.title === "New Conversation"
      ) {
        updatedTitle = generateConversationTitle(message.content);
      }

      updateCurrentConversation({
        ...conversation,
        title: updatedTitle,
        messages: [...conversation.messages, fullMessage],
        updatedAt: new Date(),
      });
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
