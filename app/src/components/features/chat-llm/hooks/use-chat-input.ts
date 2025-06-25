import { useCallback } from "react";
import { useChatInputStore } from "../store/chat-input-store";

export const useChatInput = () => {
  const inputValue = useChatInputStore((state) => state.inputValue);
  const setInputValue = useChatInputStore((state) => state.setInputValue);

  const handleInputChange = useCallback(
    (newValue: string) => {
      setInputValue(newValue);
    },
    [setInputValue]
  );

  return {
    inputValue,
    handleInputChange,
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
