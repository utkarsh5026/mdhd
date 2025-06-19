import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { MDHDLLMService } from "../service/llm-service";
import type {
  LLMProvider,
  LLMProviderId,
  ChatMessage,
  ChatMessageType,
} from "../types";
import type { MarkdownSection } from "@/services/section/parsing";

export interface UseLLMProps {
  openAIApiKey?: string;
  anthropicApiKey?: string;
  googleApiKey?: string;
}

export interface LLMQueryOptions {
  sections: MarkdownSection[];
  provider: LLMProviderId;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

const generateMessageId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export const useLLM = (props: UseLLMProps) => {
  const [llmService, setLLMService] = useState<MDHDLLMService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedProvider, setSelectedProvider] =
    useState<LLMProviderId>("openai");
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const initRef = useRef(false);

  useEffect(() => {
    if (
      !initRef.current &&
      (props.openAIApiKey || props.anthropicApiKey || props.googleApiKey)
    ) {
      initRef.current = true;
      try {
        const service = new MDHDLLMService({
          openai: props.openAIApiKey,
          anthropic: props.anthropicApiKey,
          google: props.googleApiKey,
        });
        setLLMService(service);
        setIsInitialized(true);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to initialize LLM service"
        );
      }
    }
  }, [props.openAIApiKey, props.anthropicApiKey, props.googleApiKey]);

  const availableProviders = useMemo(
    () => llmService?.getAvailableProviders() || [],
    [llmService]
  );

  const addMessage = useCallback(
    (message: Omit<ChatMessage, "id" | "timestamp">) => {
      const newMessage: ChatMessage = {
        ...message,
        id: generateMessageId(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, newMessage]);
      return newMessage;
    },
    []
  );

  const updateMessage = useCallback((messageId: string, content: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, content } : msg))
    );
  }, []);

  const setMessageStreamingState = useCallback(
    (messageId: string, isStreaming: boolean) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, isStreaming } : msg
        )
      );
    },
    []
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const queryLLM = useCallback(
    async (query: string, options: LLMQueryOptions): Promise<string> => {
      if (!llmService) {
        throw new Error("LLM service not initialized");
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await llmService.queryWithContext(query, {
          sections: options.sections,
          sources: [],
          provider: options.provider,
          model: options.model,
          temperature: options.temperature || 0.7,
        });

        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to query LLM";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [llmService]
  );

  const sendMessage = useCallback(
    async (content: string, options: LLMQueryOptions): Promise<ChatMessage> => {
      if (!isInitialized || !llmService) {
        throw new Error("LLM service not initialized");
      }

      const response = await queryLLM(content, options);
      const assistantMessage = addMessage({
        type: "assistant" as ChatMessageType,
        content: response,
        selectedSections: options.sections.map((s) => ({
          id: s.id,
          title: s.title,
        })),
        model: options.model,
        provider: options.provider,
      });

      return assistantMessage;
    },
    [isInitialized, llmService, addMessage, queryLLM]
  );

  const streamMessage = useCallback(
    async (content: string, options: LLMQueryOptions): Promise<ChatMessage> => {
      if (!isInitialized || !llmService) {
        throw new Error("LLM service not initialized");
      }

      setIsLoading(true);
      setError(null);

      try {
        // Create the assistant message placeholder
        const assistantMessage = addMessage({
          type: "assistant" as ChatMessageType,
          content: "",
          selectedSections: options.sections.map((s) => ({
            id: s.id,
            title: s.title,
          })),
          model: options.model,
          provider: options.provider,
          isStreaming: true,
        });

        let fullContent = "";

        await llmService.streamQueryWithContext(
          content,
          {
            sections: options.sections,
            sources: [],
            provider: options.provider,
            model: options.model,
            temperature: options.temperature || 0.7,
          },
          (chunk: string) => {
            fullContent += chunk;
            updateMessage(assistantMessage.id, fullContent);
          }
        );

        // Mark streaming as complete
        setMessageStreamingState(assistantMessage.id, false);

        return assistantMessage;
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
      isInitialized,
      llmService,
      addMessage,
      updateMessage,
      setMessageStreamingState,
    ]
  );

  const updateProvider = useCallback(
    (providerId: LLMProviderId, model?: string) => {
      setSelectedProvider(providerId);
      if (model) {
        setSelectedModel(model);
      } else {
        const provider = availableProviders.find((p) => p.id === providerId);
        if (provider && provider.models.length > 0) {
          setSelectedModel(provider.models[0]);
        }
      }
    },
    [availableProviders]
  );

  const addSystemMessage = useCallback(
    (content: string) => {
      return addMessage({
        type: "system" as ChatMessageType,
        content,
      });
    },
    [addMessage]
  );

  const getCurrentProvider = useCallback((): LLMProvider | null => {
    return availableProviders.find((p) => p.id === selectedProvider) || null;
  }, [availableProviders, selectedProvider]);

  // Check if provider/model combination is available
  const isProviderModelAvailable = useCallback(
    (providerId: LLMProviderId, model: string): boolean => {
      const provider = availableProviders.find((p) => p.id === providerId);
      return provider ? provider.models.includes(model) : false;
    },
    [availableProviders]
  );

  return {
    // State
    isInitialized,
    isLoading,
    error,
    messages,
    selectedProvider,
    selectedModel,

    // Actions
    addMessage,
    addSystemMessage,
    updateMessage,
    setMessageStreamingState,
    clearMessages,
    sendMessage,
    streamMessage,
    queryLLM,
    updateProvider,

    // Providers
    availableProviders,
    getCurrentProvider,
    isProviderModelAvailable,

    // Utils
    setError: (error: string | null) => setError(error),
  };
};

export default useLLM;
