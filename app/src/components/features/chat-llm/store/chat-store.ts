import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { ComponentSelection } from "../../markdown-render/services/component-service";

export type ChatMessageType = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  type: ChatMessageType;
  content: string;
  timestamp: Date;
  selections?: ComponentSelection[]; // What was selected when asking
  model?: string;
  provider?: string;
  isStreaming?: boolean;
}

/**
 * Conversation represents a complete discussion thread
 * Each conversation has its own messages and component context
 */
export interface Conversation {
  id: string;
  title: string; // Auto-generated from first message or user-defined
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessage[];
  selectedComponents: ComponentSelection[]; // Components in this conversation's context
  currentSectionId?: string; // Which section this conversation started from
  currentSectionTitle?: string;
}

/**
 * Conversation metadata for efficient listing and management
 */
export interface ConversationSummary {
  id: string;
  title: string;
  lastMessage?: string;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
  componentCount: number;
}

interface ChatState {
  // Conversation Management
  conversations: Map<string, Conversation>;
  activeConversationId: string | null;

  // UI State
  inputValue: string;
  isQueryLoading: boolean;
  isVisible: boolean;
  askDialogOpen: boolean;
  currentAskComponent: ComponentSelection | null;

  // Current section context (for new conversations)
  currentSectionId: string;
  currentSectionTitle: string;

  // Model/Provider selection (shared across conversations)
  selectedProvider: string;
  selectedModel: string;

  // Core Conversation Actions
  createConversation: (
    title?: string,
    initialComponent?: ComponentSelection
  ) => string;
  deleteConversation: (conversationId: string) => void;
  setActiveConversation: (conversationId: string | null) => void;
  updateConversationTitle: (conversationId: string, title: string) => void;

  // Message Management
  addMessage: (
    message: Omit<ChatMessage, "timestamp">,
    conversationId?: string
  ) => void;
  updateMessage: (
    messageId: string,
    content: string,
    conversationId?: string
  ) => void;
  setMessageStreaming: (
    messageId: string,
    isStreaming: boolean,
    conversationId?: string
  ) => void;
  clearMessages: (conversationId?: string) => void;

  // Component Management (per conversation)
  addComponentToConversation: (
    component: ComponentSelection,
    conversationId?: string
  ) => void;
  removeComponentFromConversation: (
    componentId: string,
    conversationId?: string
  ) => void;
  clearComponentsFromConversation: (conversationId?: string) => void;

  // UI Actions
  setInputValue: (value: string) => void;
  setIsQueryLoading: (loading: boolean) => void;
  toggleVisibility: () => void;
  setVisibility: (visible: boolean) => void;

  // Ask Dialog Management
  openAskDialog: (component: ComponentSelection) => void;
  closeAskDialog: () => void;
  askAboutComponent: (
    component: ComponentSelection,
    question: string
  ) => Promise<string>; // Returns conversation ID

  // Section Management
  setCurrentSection: (sectionId: string, sectionTitle: string) => void;

  // Model/Provider Management
  setSelectedProvider: (provider: string) => void;
  setSelectedModel: (model: string) => void;

  // Getters
  getActiveConversation: () => Conversation | null;
  getConversationSummaries: () => ConversationSummary[];
  getConversation: (conversationId: string) => Conversation | null;

  // Initialization
  initializeWelcome: () => void;
}

/**
 * Utility function to generate conversation titles from first message
 */
const generateConversationTitle = (firstMessage: string): string => {
  // Take first 50 characters and add ellipsis if needed
  const title = firstMessage.slice(0, 50).trim();
  return title.length < firstMessage.length ? title + "..." : title;
};

/**
 * Generate unique conversation ID
 */
const generateConversationId = (): string => {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generate unique message ID
 */
const generateMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const useEnhancedChatStore = create<ChatState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        conversations: new Map(),
        activeConversationId: null,
        inputValue: "",
        isQueryLoading: false,
        isVisible: false,
        askDialogOpen: false,
        currentAskComponent: null,
        currentSectionId: "",
        currentSectionTitle: "",
        selectedProvider: "openai",
        selectedModel: "gpt-4o",

        // Conversation Management
        createConversation: (title, initialComponent) => {
          const conversationId = generateConversationId();
          const now = new Date();

          const conversation: Conversation = {
            id: conversationId,
            title: title || "New Conversation",
            createdAt: now,
            updatedAt: now,
            messages: [],
            selectedComponents: initialComponent ? [initialComponent] : [],
            currentSectionId: get().currentSectionId,
            currentSectionTitle: get().currentSectionTitle,
          };

          set(
            (state) => {
              const newConversations = new Map(state.conversations);
              newConversations.set(conversationId, conversation);

              return {
                conversations: newConversations,
                activeConversationId: conversationId,
                isVisible: true, // Auto-open when creating conversation
              };
            },
            false,
            "createConversation"
          );

          return conversationId;
        },

        deleteConversation: (conversationId) =>
          set(
            (state) => {
              const newConversations = new Map(state.conversations);
              newConversations.delete(conversationId);

              const newActiveId =
                state.activeConversationId === conversationId
                  ? newConversations.size > 0
                    ? Array.from(newConversations.keys())[0]
                    : null
                  : state.activeConversationId;

              return {
                conversations: newConversations,
                activeConversationId: newActiveId,
              };
            },
            false,
            "deleteConversation"
          ),

        setActiveConversation: (conversationId) =>
          set(
            { activeConversationId: conversationId },
            false,
            "setActiveConversation"
          ),

        updateConversationTitle: (conversationId, title) =>
          set(
            (state) => {
              const conversation = state.conversations.get(conversationId);
              if (!conversation) return state;

              const updatedConversation = {
                ...conversation,
                title,
                updatedAt: new Date(),
              };

              const newConversations = new Map(state.conversations);
              newConversations.set(conversationId, updatedConversation);

              return { conversations: newConversations };
            },
            false,
            "updateConversationTitle"
          ),

        // Message Management
        addMessage: (message, conversationId) =>
          set(
            (state) => {
              const targetId = conversationId || state.activeConversationId;
              if (!targetId) return state;

              const conversation = state.conversations.get(targetId);
              if (!conversation) return state;

              const fullMessage: ChatMessage = {
                ...message,
                id: message.id || generateMessageId(),
                timestamp: new Date(),
              };

              // Auto-generate title from first user message
              let updatedTitle = conversation.title;
              if (
                conversation.messages.length === 0 &&
                message.type === "user" &&
                conversation.title === "New Conversation"
              ) {
                updatedTitle = generateConversationTitle(message.content);
              }

              const updatedConversation = {
                ...conversation,
                title: updatedTitle,
                messages: [...conversation.messages, fullMessage],
                updatedAt: new Date(),
              };

              const newConversations = new Map(state.conversations);
              newConversations.set(targetId, updatedConversation);

              return { conversations: newConversations };
            },
            false,
            "addMessage"
          ),

        updateMessage: (messageId, content, conversationId) =>
          set(
            (state) => {
              const targetId = conversationId || state.activeConversationId;
              if (!targetId) return state;

              const conversation = state.conversations.get(targetId);
              if (!conversation) return state;

              const updatedMessages = conversation.messages.map((msg) =>
                msg.id === messageId ? { ...msg, content } : msg
              );

              const updatedConversation = {
                ...conversation,
                messages: updatedMessages,
                updatedAt: new Date(),
              };

              const newConversations = new Map(state.conversations);
              newConversations.set(targetId, updatedConversation);

              return { conversations: newConversations };
            },
            false,
            "updateMessage"
          ),

        setMessageStreaming: (messageId, isStreaming, conversationId) =>
          set(
            (state) => {
              const targetId = conversationId || state.activeConversationId;
              if (!targetId) return state;

              const conversation = state.conversations.get(targetId);
              if (!conversation) return state;

              const updatedMessages = conversation.messages.map((msg) =>
                msg.id === messageId ? { ...msg, isStreaming } : msg
              );

              const updatedConversation = {
                ...conversation,
                messages: updatedMessages,
                updatedAt: new Date(),
              };

              const newConversations = new Map(state.conversations);
              newConversations.set(targetId, updatedConversation);

              return { conversations: newConversations };
            },
            false,
            "setMessageStreaming"
          ),

        clearMessages: (conversationId) =>
          set(
            (state) => {
              const targetId = conversationId || state.activeConversationId;
              if (!targetId) return state;

              const conversation = state.conversations.get(targetId);
              if (!conversation) return state;

              const updatedConversation = {
                ...conversation,
                messages: [],
                updatedAt: new Date(),
              };

              const newConversations = new Map(state.conversations);
              newConversations.set(targetId, updatedConversation);

              return { conversations: newConversations };
            },
            false,
            "clearMessages"
          ),

        // Component Management
        addComponentToConversation: (component, conversationId) =>
          set(
            (state) => {
              const targetId = conversationId || state.activeConversationId;

              // If no conversation exists, create one
              if (!targetId) {
                get().createConversation(
                  `About ${component.type}: ${component.title.slice(0, 30)}...`,
                  component
                );
                return state; // State updated by createConversation
              }

              const conversation = state.conversations.get(targetId);
              if (!conversation) return state;

              // Check if component already exists
              const exists = conversation.selectedComponents.some(
                (c) =>
                  c.id === component.id ||
                  (c.content === component.content && c.type === component.type)
              );

              if (exists) return state;

              const updatedConversation = {
                ...conversation,
                selectedComponents: [
                  ...conversation.selectedComponents,
                  component,
                ],
                updatedAt: new Date(),
              };

              const newConversations = new Map(state.conversations);
              newConversations.set(targetId, updatedConversation);

              return {
                conversations: newConversations,
                isVisible: true, // Auto-open when adding component
              };
            },
            false,
            "addComponentToConversation"
          ),

        removeComponentFromConversation: (componentId, conversationId) =>
          set(
            (state) => {
              const targetId = conversationId || state.activeConversationId;
              if (!targetId) return state;

              const conversation = state.conversations.get(targetId);
              if (!conversation) return state;

              const updatedConversation = {
                ...conversation,
                selectedComponents: conversation.selectedComponents.filter(
                  (c) => c.id !== componentId
                ),
                updatedAt: new Date(),
              };

              const newConversations = new Map(state.conversations);
              newConversations.set(targetId, updatedConversation);

              return { conversations: newConversations };
            },
            false,
            "removeComponentFromConversation"
          ),

        clearComponentsFromConversation: (conversationId) =>
          set(
            (state) => {
              const targetId = conversationId || state.activeConversationId;
              if (!targetId) return state;

              const conversation = state.conversations.get(targetId);
              if (!conversation) return state;

              const updatedConversation = {
                ...conversation,
                selectedComponents: [],
                updatedAt: new Date(),
              };

              const newConversations = new Map(state.conversations);
              newConversations.set(targetId, updatedConversation);

              return { conversations: newConversations };
            },
            false,
            "clearComponentsFromConversation"
          ),

        // UI Actions
        setInputValue: (value) =>
          set({ inputValue: value }, false, "setInputValue"),

        setIsQueryLoading: (loading) =>
          set({ isQueryLoading: loading }, false, "setIsQueryLoading"),

        toggleVisibility: () =>
          set(
            (state) => ({ isVisible: !state.isVisible }),
            false,
            "toggleVisibility"
          ),

        setVisibility: (visible) =>
          set({ isVisible: visible }, false, "setVisibility"),

        // Ask Dialog
        openAskDialog: (component) =>
          set(
            {
              askDialogOpen: true,
              currentAskComponent: component,
              inputValue: `What does this ${component.type} do?`,
            },
            false,
            "openAskDialog"
          ),

        closeAskDialog: () =>
          set(
            {
              askDialogOpen: false,
              currentAskComponent: null,
              inputValue: "",
            },
            false,
            "closeAskDialog"
          ),

        askAboutComponent: async (component, question) => {
          const state = get();

          // Create conversation if none exists
          let conversationId = state.activeConversationId;
          if (!conversationId) {
            conversationId = state.createConversation(
              generateConversationTitle(question),
              component
            );
          } else {
            // Add component to existing conversation
            state.addComponentToConversation(component, conversationId);
          }

          // Add user message
          const userMessage: Omit<ChatMessage, "timestamp"> = {
            id: generateMessageId(),
            type: "user",
            content: question,
            selections: [component],
          };

          state.addMessage(userMessage, conversationId);
          state.closeAskDialog();
          state.setVisibility(true);

          return conversationId;
        },

        // Section Management
        setCurrentSection: (sectionId, sectionTitle) =>
          set(
            { currentSectionId: sectionId, currentSectionTitle: sectionTitle },
            false,
            "setCurrentSection"
          ),

        // Model/Provider Management
        setSelectedProvider: (provider) =>
          set({ selectedProvider: provider }, false, "setSelectedProvider"),

        setSelectedModel: (model) =>
          set({ selectedModel: model }, false, "setSelectedModel"),

        // Getters
        getActiveConversation: () => {
          const state = get();
          if (!state.activeConversationId) return null;
          return state.conversations.get(state.activeConversationId) || null;
        },

        getConversation: (conversationId) => {
          const state = get();
          return state.conversations.get(conversationId) || null;
        },

        getConversationSummaries: () => {
          const state = get();
          return Array.from(state.conversations.values()).map(
            (conv): ConversationSummary => ({
              id: conv.id,
              title: conv.title,
              lastMessage: conv.messages[conv.messages.length - 1]?.content,
              messageCount: conv.messages.length,
              createdAt: conv.createdAt,
              updatedAt: conv.updatedAt,
              componentCount: conv.selectedComponents.length,
            })
          );
          // .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        },

        // Initialization
        initializeWelcome: () => {
          const state = get();
          if (state.conversations.size === 0) {
            const conversationId = state.createConversation("Welcome");
            const welcomeMessage: Omit<ChatMessage, "timestamp"> = {
              id: generateMessageId(),
              type: "system",
              content: `🤖 Welcome to MDHD AI Assistant!

**How to use:**
📄 Hover over any code block, table, list, or other content
💬 Click "Ask" to ask a specific question about that component
➕ Click "+" to add it to your chat context

You can mix and match different components to ask complex questions!`,
            };

            state.addMessage(welcomeMessage, conversationId);
          }
        },
      }),
      {
        name: "mdhd-enhanced-chat-store",
        partialize: (state) => ({
          conversations: Array.from(state.conversations.entries()), // Convert Map to Array for serialization
          activeConversationId: state.activeConversationId,
          selectedProvider: state.selectedProvider,
          selectedModel: state.selectedModel,
          isVisible: state.isVisible,
        }),
        merge: (persistedState: any, currentState: ChatState) => {
          // Convert persisted conversations array back to Map
          const conversations = new Map(persistedState.conversations || []);
          return {
            ...currentState,
            ...persistedState,
            conversations,
          };
        },
      }
    ),
    {
      name: "mdhd-enhanced-chat-store",
    }
  )
);

// Convenience hooks for specific functionality
export const useActiveConversation = () =>
  useEnhancedChatStore((state) => state.getActiveConversation());

export const useConversationSummaries = () =>
  useEnhancedChatStore((state) => state.getConversationSummaries());

export const useChatVisibility = () =>
  useEnhancedChatStore((state) => state.isVisible);

export const useAskDialog = () =>
  useEnhancedChatStore((state) => ({
    isOpen: state.askDialogOpen,
    component: state.currentAskComponent,
  }));
