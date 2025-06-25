import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { ComponentSelection } from "@/components/features/markdown-render/services/component-service";
import type { ChatMessage, Conversation } from "../types";

const generateConversationId = () =>
  `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

const generateMessageId = () =>
  `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

type State = {
  conversations: Record<string, Conversation>;
  conversationIds: string[];
  activeConversationId: string | null;
  currentSectionId?: string;
  currentSectionTitle?: string;
};

type Actions = {
  createConversation: (
    title?: string,
    initialComponent?: ComponentSelection
  ) => string;
  deleteConversation: (conversationId: string) => void;
  setActiveConversation: (conversationId: string) => void;

  addMessage: (
    conversationId: string,
    message: Omit<ChatMessage, "id">
  ) => string;
  updateMessage: (
    conversationId: string,
    messageId: string,
    content: string
  ) => void;
  setMessageStreaming: (
    conversationId: string,
    messageId: string,
    isStreaming: boolean
  ) => void;

  // Component actions
  addComponentToConversation: (
    conversationId: string,
    component: ComponentSelection
  ) => void;
  removeComponentFromConversation: (
    conversationId: string,
    componentId: string
  ) => void;
};

// ✅ Stable selectors to prevent unnecessary re-renders
export const useConversationStore = create<State & Actions>()(
  devtools((set, get) => ({
    conversations: {},
    conversationIds: [],
    activeConversationId: null,
    currentSectionId: undefined,
    currentSectionTitle: undefined,

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

      set((state) => ({
        conversations: {
          ...state.conversations, // ✅ Spread to maintain reference stability
          [conversationId]: conversation,
        },
        conversationIds: [conversationId, ...state.conversationIds],
        activeConversationId: conversationId,
      }));

      return conversationId;
    },

    deleteConversation: (conversationId) =>
      set((state) => {
        const { [conversationId]: deleted, ...restConversations } =
          state.conversations;
        const newConversationIds = state.conversationIds.filter(
          (id) => id !== conversationId
        );

        const newActiveId =
          state.activeConversationId === conversationId
            ? newConversationIds[0] || null
            : state.activeConversationId;

        return {
          conversations: restConversations,
          conversationIds: newConversationIds,
          activeConversationId: newActiveId,
        };
      }),

    setActiveConversation: (conversationId) =>
      set({ activeConversationId: conversationId }),

    addMessage: (conversationId, message) => {
      const messageId = `msg_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 9)}`;

      set((state) => {
        const conversation = state.conversations[conversationId];
        if (!conversation) return state;

        return {
          conversations: {
            ...state.conversations,
            [conversationId]: {
              ...conversation,
              messages: [
                ...conversation.messages,
                { ...message, id: messageId },
              ],
              updatedAt: new Date(),
            },
          },
        };
      });

      return messageId;
    },

    updateMessage: (conversationId, messageId, content) =>
      set((state) => {
        const conversation = state.conversations[conversationId];
        if (!conversation) return state;

        const updatedMessages = conversation.messages.map((msg) =>
          msg.id === messageId ? { ...msg, content } : msg
        );

        console.log(
          "updatedMessages",
          conversationId,
          messageId,
          content,

          updatedMessages
        );

        return {
          conversations: {
            ...state.conversations,
            [conversationId]: {
              ...conversation,
              messages: updatedMessages,
              updatedAt: new Date(),
            },
          },
        };
      }),

    setMessageStreaming: (conversationId, messageId, isStreaming) =>
      set((state) => {
        const conversation = state.conversations[conversationId];
        if (!conversation) return state;

        const updatedMessages = conversation.messages.map((msg) =>
          msg.id === messageId ? { ...msg, isStreaming } : msg
        );

        return {
          conversations: {
            ...state.conversations,
            [conversationId]: {
              ...conversation,
              messages: updatedMessages,
              updatedAt: new Date(),
            },
          },
        };
      }),

    addComponentToConversation: (conversationId, component) =>
      set((state) => {
        const conversation = state.conversations[conversationId];
        if (!conversation) return state;

        // Check if component already exists
        const exists = conversation.selectedComponents.some(
          (c) => c.id === component.id
        );
        if (exists) return state;

        return {
          conversations: {
            ...state.conversations,
            [conversationId]: {
              ...conversation,
              selectedComponents: [
                ...conversation.selectedComponents,
                component,
              ],
              updatedAt: new Date(),
            },
          },
        };
      }),

    removeComponentFromConversation: (conversationId, componentId) =>
      set((state) => {
        const conversation = state.conversations[conversationId];
        if (!conversation) return state;

        return {
          conversations: {
            ...state.conversations,
            [conversationId]: {
              ...conversation,
              selectedComponents: conversation.selectedComponents.filter(
                (c) => c.id !== componentId
              ),
              updatedAt: new Date(),
            },
          },
        };
      }),
  }))
);
