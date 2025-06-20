import { useState, useCallback } from "react";

export const useChatUI = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleVisibility = useCallback(() => setIsVisible((prev) => !prev), []);

  const clearInput = useCallback(() => setInputValue(""), []);

  return {
    isVisible,
    setIsVisible,
    toggleVisibility,
    inputValue,
    setInputValue,
    clearInput,
    isExpanded,
    setIsExpanded,
  };
};
