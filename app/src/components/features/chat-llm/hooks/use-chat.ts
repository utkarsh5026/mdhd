import { useCallback, useRef, useState } from "react";
import { LLMProviderId } from "../types";
import { ComponentSelection } from "../../markdown-render/types";
import { useChatInputStore } from "../store/chat-input-store";

interface LLMStreamOptions {
  provider: LLMProviderId;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

type LLMRequest = {
  message: string;
  context?: ComponentSelection[];
  options: LLMStreamOptions;
};

/**
 * Core LLM functionality - handles raw LLM operations
 *
 * Principles:
 * - Single responsibility: Only LLM communication
 * - No conversation logic
 * - Reusable across different contexts
 * - Clean error handling
 */
export const useLLMCore = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeStreamsRef = useRef(new Map<string, AbortController>());

  const streamMessage = useCallback(
    async (
      request: LLMRequest,
      onChunk: (chunk: string, isComplete: boolean) => void
    ): Promise<string> => {
      const streamId = `stream_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const abortController = new AbortController();

      activeStreamsRef.current.set(streamId, abortController);
      setIsStreaming(true);
      setError(null);

      try {
        let content = "";
        const chunks = request.message.split(" ");

        for (let i = 0; i < chunks.length; i++) {
          if (abortController.signal.aborted) {
            throw new Error("Stream aborted");
          }

          content += (i > 0 ? " " : "") + chunks[i];
          onChunk(content, i === chunks.length - 1);

          // Simulate streaming delay
          await new Promise((resolve) => setTimeout(resolve, 50));
        }

        return content;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Stream failed";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        activeStreamsRef.current.delete(streamId);
        setIsStreaming(false);
      }
    },
    []
  );

  const abortStream = useCallback((streamId?: string) => {
    if (streamId) {
      const controller = activeStreamsRef.current.get(streamId);
      controller?.abort();
    } else {
      activeStreamsRef.current.forEach((controller) => controller.abort());
      activeStreamsRef.current.clear();
    }
  }, []);

  return {
    isStreaming,
    error,
    streamMessage,
    abortStream,
    activeStreams: Array.from(activeStreamsRef.current.keys()),
  };
};

export const useChatInput = () => {
  const inputValue = useChatInputStore((state) => state.inputValue);
  const setInputValue = useChatInputStore((state) => state.setInputValue);
  const clearInput = useChatInputStore((state) => state.clearInput);
  const chatBarOpen = useChatInputStore((state) => state.chatBarOpen);
  const setChatBarOpen = useChatInputStore((state) => state.setChatBarOpen);

  const handleInputChange = useCallback(
    (newValue: string) => {
      setInputValue(newValue);
    },
    [setInputValue]
  );

  return {
    inputValue,
    handleInputChange,
    clearInput,
    chatBarOpen,
    setChatBarOpen,
  };
};

export const useSelectedComponents = () => {
  const selectedComponents = useChatInputStore(
    (state) => state.selectedComponents
  );

  const addComponent = useChatInputStore((state) => state.addComponent);
  const removeComponent = useChatInputStore((state) => state.removeComponent);
  const clearComponents = useChatInputStore((state) => state.clearComponents);

  return {
    selectedComponents,
    addComponent,
    removeComponent,
    clearComponents,
  };
};

export const useChatDialog = () => {
  const chatDialogOpen = useChatInputStore((state) => state.chatDialogOpen);
  const setChatDialogOpen = useChatInputStore(
    (state) => state.setChatDialogOpen
  );

  return {
    chatDialogOpen,
    setChatDialogOpen,
  };
};
