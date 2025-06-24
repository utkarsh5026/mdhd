import {
  useConversations,
  useActiveConversation,
  useConversationStore,
  useConversationSummaries,
} from "../store/conversation-store";
import { useCallback, useState } from "react";
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
      createConv(title, initialComponent);
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
