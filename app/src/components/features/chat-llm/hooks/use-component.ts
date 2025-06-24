import { useCallback } from "react";
import {
  useActiveConversation,
  useConversationStore,
  useConversations,
} from "../store/conversation-store";
import type { ComponentSelection } from "../../markdown-render/types";
import type { Conversation } from "../types";

const DEFAULT_TITLE_LENGTH = 30;

const generateConversationTitle = (component: ComponentSelection): string => {
  const truncatedTitle = component.title.slice(0, DEFAULT_TITLE_LENGTH);
  return `About ${component.type}: ${truncatedTitle}${
    component.title.length > DEFAULT_TITLE_LENGTH ? "..." : ""
  }`;
};

const componentExists = (
  components: ComponentSelection[],
  newComponent: ComponentSelection
): boolean => {
  return components.some(
    (c) =>
      c.id === newComponent.id ||
      (c.content === newComponent.content && c.type === newComponent.type)
  );
};

export const useComponent = () => {
  const activeConversation = useActiveConversation();
  const createConversation = useConversationStore(
    (state) => state.createConversation
  );
  const updateConversation = useConversationStore(
    (state) => state.updateConversation
  );
  const conversations = useConversations();

  const updateConversationWithTimestamp = useCallback(
    (conversationId: string, updates: Conversation) => {
      updateConversation(conversationId, {
        ...updates,
        updatedAt: new Date(),
      });
    },
    [updateConversation]
  );

  const addComponentToConversation = useCallback(
    (component: ComponentSelection, conversationId: string) => {
      const targetId = conversationId || activeConversation?.id;

      if (!targetId) {
        const title = generateConversationTitle(component);
        createConversation(title, component);
        return;
      }

      const conversation = conversations.get(targetId);
      if (!conversation) return;

      if (componentExists(conversation.selectedComponents, component)) return;

      const updatedConversation = {
        ...conversation,
        selectedComponents: [...conversation.selectedComponents, component],
      };

      updateConversationWithTimestamp(targetId, updatedConversation);
    },
    [
      activeConversation,
      createConversation,
      conversations,
      updateConversationWithTimestamp,
    ]
  );

  const removeComponentFromConversation = useCallback(
    (componentId: string, conversationId: string) => {
      const targetId = conversationId || activeConversation?.id;
      if (!targetId) return;

      const conversation = conversations.get(targetId);
      if (!conversation) return;

      const updatedConversation = {
        ...conversation,
        selectedComponents: conversation.selectedComponents.filter(
          (c) => c.id !== componentId
        ),
      };

      updateConversationWithTimestamp(targetId, updatedConversation);
    },
    [activeConversation, conversations, updateConversationWithTimestamp]
  );

  const clearComponentsFromConversation = useCallback(
    (conversationId: string) => {
      const targetId = conversationId || activeConversation?.id;
      if (!targetId) return;

      const conversation = conversations.get(targetId);
      if (!conversation) return;

      const updatedConversation = {
        ...conversation,
        selectedComponents: [],
      };

      updateConversationWithTimestamp(targetId, updatedConversation);
    },
    [activeConversation, conversations, updateConversationWithTimestamp]
  );

  return {
    addComponentToConversation,
    removeComponentFromConversation,
    clearComponentsFromConversation,
  };
};

export default useComponent;
