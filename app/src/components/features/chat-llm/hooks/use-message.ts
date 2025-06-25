import { useCallback, useRef, useState, useEffect } from "react";
import { useLLMState } from "./use-llm";
import { useConversationStore } from "../store/conversation-store";
import type { ComponentSelection } from "@/components/features/markdown-render/services/component-service";
import type { LLMProviderId } from "../types";

interface SendMessageOptions {
  conversationId?: string;
  components?: ComponentSelection[];
  temperature?: number;
  createNewIfNeeded?: boolean;
  conversationTitle?: string;
}

interface StreamingState {
  [messageId: string]: {
    abortController: AbortController;
    content: string;
    conversationId: string;
  };
}

const BATCH_UPDATE_INTERVAL = 50;

/**
 * 🚀 Simple Chat Hook - Just sendMessage and stopMessage
 *
 * This hook has ZERO complex dependencies to prevent infinite renders.
 * It only does two things:
 * 1. Send messages with streaming
 * 2. Stop/abort messages
 */
export const useMessage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Use refs for streaming state - no re-renders
  const streamingStatesRef = useRef<StreamingState>({});
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { llmService, isInitialized, selectedProvider, selectedModel } =
    useLLMState();

  const createConversation = useConversationStore(
    (state) => state.createConversation
  );
  const addMessage = useConversationStore((state) => state.addMessage);
  const updateMessage = useConversationStore((state) => state.updateMessage);
  const setMessageStreaming = useConversationStore(
    (state) => state.setMessageStreaming
  );

  const activeConversationId = useConversationStore(
    (state) => state.activeConversationId
  );

  /**
   * ✅ Batched update mechanism to prevent excessive re-renders
   */
  const batchUpdate = useCallback(
    (messageId: string, content: string) => {
      if (streamingStatesRef.current[messageId]) {
        streamingStatesRef.current[messageId].content = content;
      }

      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }

      batchTimeoutRef.current = setTimeout(() => {
        Object.entries(streamingStatesRef.current).forEach(([id, state]) => {
          updateMessage(state.conversationId, id, state.content);
        });
      }, BATCH_UPDATE_INTERVAL);
    },
    [updateMessage]
  );

  /**
   * 🛑 Stop/abort a specific message or all messages
   */
  const stopMessage = useCallback(
    (messageId?: string) => {
      if (messageId) {
        const streamState = streamingStatesRef.current[messageId];
        if (streamState) {
          streamState.abortController.abort();
          setMessageStreaming(streamState.conversationId, messageId, false);
          delete streamingStatesRef.current[messageId];
        }
      } else {
        Object.entries(streamingStatesRef.current).forEach(([id, state]) => {
          state.abortController.abort();
          setMessageStreaming(state.conversationId, id, false);
        });
        streamingStatesRef.current = {};
      }

      setIsLoading(false);
      setError(null);
    },
    [setMessageStreaming]
  );

  /**
   * 📤 Send a message with streaming support
   */
  const sendMessage = useCallback(
    async (
      message: string,
      options: SendMessageOptions = {}
    ): Promise<{ conversationId: string; messageId: string } | null> => {
      if (!message.trim()) {
        setError("Message cannot be empty");
        return null;
      }

      if (!isInitialized || !llmService) {
        setError("LLM service not initialized");
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        // ✅ Get or create conversation ID
        let conversationId = options.conversationId || activeConversationId;

        if (!conversationId && options.createNewIfNeeded) {
          const title =
            options.conversationTitle || `Chat: ${message.slice(0, 30)}...`;
          conversationId = createConversation(title, options.components?.[0]);
        }

        if (!conversationId) {
          throw new Error("No conversation available");
        }

        const userMessageId = addMessage(conversationId, {
          type: "user",
          content: message.trim(),
          timestamp: new Date(),
          selections: options.components || [],
        });

        const assistantMessageId = addMessage(conversationId, {
          type: "assistant",
          content: "",
          timestamp: new Date(),
          selections: options.components || [],
          provider: selectedProvider,
          model: selectedModel,
          isStreaming: true,
        });

        const abortController = new AbortController();

        streamingStatesRef.current[assistantMessageId] = {
          abortController,
          content: "",
          conversationId,
        };

        const contextualPrompt = _generateContextualPrompt(
          message,
          options.components || []
        );

        let fullContent = "";

        await llmService.streamQueryWithContext(
          contextualPrompt,
          {
            components: options.components || [],
            sources: [],
            provider: selectedProvider as LLMProviderId,
            model: selectedModel,
            temperature: options.temperature || 0.7,
          },
          (chunk: string) => {
            if (abortController.signal.aborted) {
              return;
            }
            console.log("chunk", chunk);
            fullContent += chunk;

            batchUpdate(assistantMessageId, fullContent);
          }
        );

        // ✅ Finalize message
        if (!abortController.signal.aborted) {
          setMessageStreaming(conversationId, assistantMessageId, false);
          updateMessage(conversationId, assistantMessageId, fullContent);
        }

        // ✅ Cleanup
        delete streamingStatesRef.current[assistantMessageId];
        setIsLoading(false);

        return {
          conversationId,
          messageId: assistantMessageId,
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
        setIsLoading(false);

        // ✅ Cleanup on error
        Object.values(streamingStatesRef.current).forEach((state) => {
          state.abortController.abort();
        });
        streamingStatesRef.current = {};

        return null;
      }
    },
    [
      // ✅ Minimal dependencies - only stable values
      isInitialized,
      llmService,
      selectedProvider,
      selectedModel,
      activeConversationId,
      // Store actions (stable)
      createConversation,
      addMessage,
      updateMessage,
      setMessageStreaming,
      batchUpdate,
    ]
  );

  // ✅ Cleanup on unmount
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
      // Abort all active streams
      Object.values(streamingStatesRef.current).forEach((state) => {
        state.abortController.abort();
      });
    };
  }, []);

  return {
    sendMessage,
    stopMessage,
    isLoading,
    error,
    activeStreams: Object.keys(streamingStatesRef.current),
  };
};

/**
 * ✅ Helper function to generate contextual prompts
 */
const _generateContextualPrompt = (
  question: string,
  components: ComponentSelection[]
): string => {
  if (components.length === 0) {
    return question;
  }

  const componentDescriptions = components
    .map((comp) => `- ${comp.type}: ${comp.title}`)
    .join("\n");

  return `${question}

Available components to reference:
${componentDescriptions}

Please provide a helpful response based on the provided content.`;
};
