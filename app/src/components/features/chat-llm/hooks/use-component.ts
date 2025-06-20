import { useCallback } from "react";
import {
  useActiveConversation,
  useConversationStore,
  useConversations,
} from "../store/conversation-store";
import type { ComponentSelection } from "../../markdown-render/types";

const useComponent = () => {
  const activeConversation = useActiveConversation();
  const createConversation = useConversationStore(
    (state) => state.createConversation
  );
  const updateConversation = useConversationStore(
    (state) => state.updateConversation
  );
  const conversations = useConversations();

  const addComponentToConversation = useCallback(
    (component: ComponentSelection, conversationId: string) => {
      const targetId = conversationId || activeConversation?.id;

      if (!targetId) {
        createConversation(
          `About ${component.type}: ${component.title.slice(0, 30)}...`,
          component
        );
        return;
      }

      const conversation = conversations.get(targetId);
      if (!conversation) return;

      const exists = conversation.selectedComponents.some(
        (c) =>
          c.id === component.id ||
          (c.content === component.content && c.type === component.type)
      );

      if (exists) return;

      const updatedConversation = {
        ...conversation,
        selectedComponents: [...conversation.selectedComponents, component],
        updatedAt: new Date(),
      };

      updateConversation(targetId, updatedConversation);
    },
    [activeConversation, createConversation, conversations, updateConversation]
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
        updatedAt: new Date(),
      };

      updateConversation(targetId, updatedConversation);
    },
    [activeConversation, conversations, updateConversation]
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
        updatedAt: new Date(),
      };

      updateConversation(targetId, updatedConversation);
    },
    [activeConversation, conversations, updateConversation]
  );

  return {
    addComponentToConversation,
    removeComponentFromConversation,
    clearComponentsFromConversation,
  };
};

export default useComponent;
