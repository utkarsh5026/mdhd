import { useState, useRef, useCallback, useEffect } from "react";

const CONTROLS_TIMEOUT = 4000;

interface UseControlsProps {
  goToNext: () => void;
  goToPrevious: () => void;
}

/**
 * 🎮 Controls hook for managing UI visibility and interactions
 *
 * ⌛ Handles auto-hiding controls after timeout
 * 🖱️ Responds to mouse movements and clicks
 * ⌨️ Handles keyboard navigation
 *
 * Flow:
 *  [👀 Visible] -> ⏳ timeout -> [🙈 Hidden]
 *       ⬆️            |              |
 *       |‾‾‾‾‾‾‾‾‾‾‾‾‾              |
 *       ‾‾‾‾‾‾‾ 🖱️ interaction ‾‾‾‾‾‾
 *
 */
export const useControls = ({ goToNext, goToPrevious }: UseControlsProps) => {
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 🔄 Resets the auto-hide timeout for controls
   *
   * Flow:
   * [⏱️ Old Timer] -> 🗑️ Clear -> 👀 Show Controls -> ⏰ New Timer
   */
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    setIsControlsVisible(true);

    controlsTimeoutRef.current = setTimeout(() => {
      setIsControlsVisible(false);
    }, CONTROLS_TIMEOUT);
  }, []);

  /**
   * 🖱️ Handles any user interaction
   *
   * Flow: 👆 Interaction -> 🔄 Reset Timer
   */
  const handleInteraction = useCallback(() => {
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  /**
   * 🖱️ Handles mouse movement near edges
   *
   * Flow:
   * Mouse at edges? -> 👀 Show Controls
   *     ↓
   *    ❌ Do nothing
   *
   * @param {MouseEvent} e - Mouse event
   */
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      // Show controls when mouse is near top or bottom edges
      if (e.clientY <= 80 || e.clientY >= window.innerHeight - 80) {
        handleInteraction();
      }
    },
    [handleInteraction]
  );

  /**
   * 👆👆 Handles double click
   *
   * Flow: Double Click -> 👀 Show -> 🔄 Reset Timer
   */
  const handleDoubleClick = useCallback(() => {
    setIsControlsVisible(true);
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  /**
   * ⌨️ Keyboard navigation effect
   *
   * Controls:
   * ⬅️ ⬆️ : Previous
   * ➡️ ⬇️ : Next
   * ␣ : Next
   * Esc: Hide controls
   */
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowLeft":
        case "ArrowUp":
          goToPrevious();
          handleInteraction();
          break;
        case "ArrowRight":
        case "ArrowDown":
        case " ":
          e.preventDefault();
          goToNext();
          handleInteraction();
          break;
        case "Escape":
          setIsControlsVisible(false);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [goToNext, goToPrevious, handleInteraction]);

  /**
   * ⚡ Initialize controls timeout
   *
   * Flow: Mount -> 🔄 Start Timer -> Unmount -> 🗑️ Cleanup
   */
  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [resetControlsTimeout]);

  /**
   * 🖱️ Mouse movement tracking effect
   *
   * Flow: Mount -> 👂 Listen -> Unmount -> 🗑️ Cleanup
   */
  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [handleMouseMove]);

  return {
    isControlsVisible,
    setIsControlsVisible,
    handleInteraction,
    handleDoubleClick,
  };
};
