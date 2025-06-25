import {
  useConversations,
  useConversationStore,
} from "../store/conversation-store";
import { useCallback, useMemo, useState } from "react";
import type { Conversation } from "../types";
import type { ComponentSelection } from "@/components/features/markdown-render/services/component-service";

const _validateConversationID = (
  conversationId: string,
  conversations: Map<string, Conversation>
) => {
  return conversations.has(conversationId);
};

export const useConversation = () => {
  const [error, setError] = useState<string | null>(null);
  const conversations = useConversations();
  const activeConversation = useActiveConversation();
  const conversationSummaries = useConversationSummaries();

  console.debug(conversations, "conversations");
  console.debug(activeConversation, "activeConversation");

  const setActiveConversation = useCallback(
    (conversationId: string) => {
      if (!_validateConversationID(conversationId, conversations)) {
        setError("Invalid conversation ID");
        return;
      }

      useConversationStore.setState({
        activeConversationId: conversationId,
      });
    },
    [conversations]
  );

  const getConversationFromID = useCallback(
    (conversationId: string) => {
      return conversations.get(conversationId);
    },
    [conversations]
  );

  return {
    error,
    conversations,
    activeConversation,
    setActiveConversation,
    getConversationFromID,
    conversationSummaries,
  };
};

export const useConversationActions = () => {
  const deleteConv = useConversationStore((state) => state.deleteConversation);
  const updateConv = useConversationStore((state) => state.updateConversation);
  const createConv = useConversationStore((state) => state.createConversation);
  const createConversation = useCallback(
    (title?: string, initialComponent?: ComponentSelection) => {
      return createConv(title, initialComponent);
    },
    [createConv]
  );

  const deleteConversation = useCallback(
    (conversationId: string) => {
      deleteConv(conversationId);
    },
    [deleteConv]
  );

  const updateConversation = useCallback(
    (conversationId: string, conversation: Conversation) => {
      updateConv(conversationId, conversation);
    },
    [updateConv]
  );

  return {
    createConversation,
    deleteConversation,
    updateConversation,
  };
};

export const useActiveConversation = () => {
  const activeConversationId = useConversationStore(
    (state) => state.activeConversationId
  );
  const conversations = useConversationStore((state) => state.conversations);

  return useMemo(() => {
    if (!activeConversationId) return null;
    return conversations.get(activeConversationId) || null;
  }, [activeConversationId, conversations]);
};

export const useConversationSummaries = () => {
  const conversations = useConversationStore((state) => state.conversations);

  return useMemo(() => {
    return Array.from(conversations.values()).map(
      ({ id, title, messages, createdAt, updatedAt, selectedComponents }) => {
        const lastMessage = messages[messages.length - 1]?.content;
        const messageCount = messages.length;
        return {
          id,
          title,
          lastMessage,
          messageCount,
          createdAt,
          updatedAt,
          componentCount: selectedComponents.length,
        };
      }
    );
  }, [conversations]);
};
