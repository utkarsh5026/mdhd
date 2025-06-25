import { useConversationStore } from "../store/conversation-store";
import { useCallback, useMemo, useState } from "react";
import type {
  ChatMessage,
  ChatMessageType,
  Conversation,
  LLMQueryOptions,
} from "../types";
import type { ComponentSelection } from "@/components/features/markdown-render/services/component-service";
import { useLLMState } from "./use-llm";

const generateMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

const _generateConversationTitle = (firstMessage: string): string => {
  const title = firstMessage.slice(0, 50).trim();
  return title.length < firstMessage.length ? title + "..." : title;
};

export const useConversation = () => {
  const conversations = useConversationStore((state) => state.conversations);
  const activeConversation = useActiveConversation();
  const conversationSummaries = useConversationSummaries();

  // console.dir(conversations, {
  //   depth: null,
  // });
  // console.dir(activeConversation, {
  //   depth: null,
  // });

  const getConversationFromID = useCallback(
    (conversationId: string) => {
      return conversations[conversationId];
    },
    [conversations]
  );

  return {
    conversations,
    activeConversation,
    getConversationFromID,
    conversationSummaries,
  };
};

export const useConversationActions = () => {
  const conversations = useConversationStore((state) => state.conversations);
  const { activeConversation } = useActiveConversation();
  const deleteConv = useConversationStore((state) => state.deleteConversation);
  const updateConv = useConversationStore((state) => state.updateMessage);
  const createConv = useConversationStore((state) => state.createConversation);

  const createConversation = useCallback(
    async (
      title: string,
      initialComponent?: ComponentSelection,
      onConversationCreated?: (conversation: Conversation) => void
    ): Promise<string> => {
      try {
        const conversationTitle = title;
        const conversationId = createConv(conversationTitle, initialComponent);

        const newConversation = conversations[conversationId];
        if (newConversation && onConversationCreated) {
          onConversationCreated(newConversation);
        }

        return conversationId;
      } catch (error) {
        const err = new Error(`Failed to create conversation: ${error}`);
        throw err;
      }
    },
    [createConv, conversations]
  );

  const deleteConversation = useCallback(
    (conversationId: string) => {
      deleteConv(conversationId);
    },
    [deleteConv]
  );

  const updateConversation = useCallback(
    (conversationId: string, messageId: string, content: string) => {
      updateConv(conversationId, messageId, content);
    },
    [updateConv]
  );

  const updateConversationTitle = useCallback(
    (conversationId: string, title: string) => {
      try {
        const conversation = conversations[conversationId];
        if (!conversation) {
          throw new Error(`Conversation ${conversationId} not found`);
        }

        updateConversation(conversationId, conversation.messages[0].id, title);
      } catch (error) {
        const err = new Error(`Failed to update conversation title: ${error}`);
        throw err;
      }
    },
    [conversations, updateConversation]
  );

  const updateCurrentConversation = useCallback(
    (conversation: Conversation, conversationId?: string) => {
      const targetId = conversationId ?? activeConversation?.id;
      if (!targetId) return;
      updateConversation(
        targetId,
        conversation.messages[0].id,
        conversation.title
      );
    },
    [activeConversation, updateConversation]
  );

  const validateConversation = useCallback(
    (conversationId?: string) => {
      const targetId = conversationId ?? activeConversation?.id;
      if (!targetId) return null;

      if (!conversations[targetId]) return null;

      return conversations[targetId];
    },
    [activeConversation, conversations]
  );

  const clearMessagesOfConversation = useCallback(
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

  const updateMessageOfConversation = useCallback(
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

  const addMessageToConversation = useCallback(
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
  return {
    createConversation,
    deleteConversation,
    updateConversation,
    updateConversationTitle,

    clearMessagesOfConversation,
    updateMessageOfConversation,
    addMessageToConversation,
    setMessageStreaming,
  };
};

export const useActiveConversation = () => {
  const [error, setError] = useState<string | null>(null);
  const activeConversationId = useConversationStore(
    (state) => state.activeConversationId
  );

  const conversations = useConversationStore((state) => state.conversations);

  const setActiveConversation = useCallback(
    (conversationId: string) => {
      if (!conversations[conversationId]) {
        setError("Invalid conversation ID");
        return;
      }

      useConversationStore.setState({
        activeConversationId: conversationId,
      });
    },
    [conversations]
  );

  const activeConversation = useMemo(() => {
    if (!activeConversationId) return null;
    return conversations[activeConversationId] || null;
  }, [activeConversationId, conversations]);

  return {
    activeConversation,
    setActiveConversation,
    error,
  };
};

export const useConversationSummaries = () => {
  const conversations = useConversationStore((state) => state.conversations);

  const summaries = useMemo(() => {
    return Object.values(conversations).map(
      ({ id, title, messages, createdAt, updatedAt, selectedComponents }) => {
        console.log("messages", messages, id, title);
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

  return summaries;
};

export const useStreamMessage = () => {
  const { llmService, isInitialized } = useLLMState();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    addMessageToConversation,
    updateMessageOfConversation,
    setMessageStreaming,
  } = useConversationActions();

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
      addMessageToConversation(assistantMessage, "assistant", conversationId);
    },
    [addMessageToConversation]
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
            console.log("New content Recieved", chunk);
            fullContent += chunk;
            updateMessageOfConversation(
              assistantMessageId,
              fullContent,
              conversationId
            );
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
      updateMessageOfConversation,
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
