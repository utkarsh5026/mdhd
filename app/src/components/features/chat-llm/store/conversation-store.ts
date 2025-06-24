import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { ComponentSelection } from "@/components/features/markdown-render/services/component-service";
import type { Conversation, ConversationSummary } from "../types";

const generateConversationId = () =>
  `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

type State = {
  conversations: Map<string, Conversation>;
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
  updateConversationTitle: (conversationId: string, title: string) => void;
  updateConversation: (
    conversationId: string,
    conversation: Conversation
  ) => void;

  getActiveConversation: () => Conversation | null;
  getConversation: (conversationId: string) => Conversation | null;
  getConversationSummaries: () => ConversationSummary[];
};

export const useConversationStore = create<State & Actions>()(
  devtools(
    persist(
      (set, get) => ({
        conversations: new Map(),
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

          set(
            (state) => {
              const newConversations = new Map(state.conversations);
              newConversations.set(conversationId, conversation);

              return {
                conversations: newConversations,
                activeConversationId: conversationId,
              };
            },
            false,
            "createConversation"
          );

          return conversationId;
        },

        updateConversation: (conversationId, conversation) =>
          set(
            (state) => {
              const newConversations = new Map(state.conversations);
              newConversations.set(conversationId, conversation);

              return {
                conversations: newConversations,
              };
            },
            false,
            "updateConversation"
          ),
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

        setActiveConversation: (conversationId: string) =>
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
            ({
              id,
              title,
              messages,
              createdAt,
              updatedAt,
              selectedComponents,
            }) => {
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
        },
      }),
      {
        name: "conversation-store",
        partialize: (state) => ({
          conversations: Array.from(state.conversations.entries()),
          activeConversationId: state.activeConversationId,
          currentSectionId: state.currentSectionId,
          currentSectionTitle: state.currentSectionTitle,
        }),
        merge: (
          persistedState: PersistedState,
          currentState: State & Actions
        ) => {
          const conversations = new Map(persistedState.conversations || []);
          return {
            ...currentState,
            ...persistedState,
            conversations,
          };
        },
      }
    )
  )
);

export const useConversations = () =>
  useConversationStore((state) => state.conversations);
