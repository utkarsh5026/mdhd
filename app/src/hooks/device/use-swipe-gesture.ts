import { useEffect, useRef, useState } from "react";

interface SwipeGestureOptions {
  threshold?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onDoubleTap?: () => void;
  targetRef?: React.RefObject<HTMLElement>;
}

/**
 * ✨ useSwipeGesture ✨
 *
 * A delightful hook that adds touch gesture superpowers to your components! 👆✨
 *
 * This hook is your friendly gesture detector that works behind the scenes to:
 *
 * 👈 Detect left swipes for navigation or dismissal actions
 * 👉 Catch right swipes for revealing menus or previous content
 * 👆👆 Recognize double taps for zooming or special actions
 * 🎯 Target specific elements or use the entire document
 * 🔄 Provide controls to pause and resume gesture detection
 * 📏 Customize sensitivity with adjustable thresholds
 *
 * Perfect for creating intuitive touch interactions that feel natural on mobile!
 * Let this hook handle the complex touch event logic while you focus on the user experience. 😊
 */
export const useSwipeGesture = (options: SwipeGestureOptions = {}) => {
  const {
    threshold = 50,
    onSwipeLeft,
    onSwipeRight,
    onDoubleTap,
    targetRef,
  } = options;

  /**
   * 📱 Gesture State
   *
   * Keeps track of touch positions and timing for accurate gesture detection
   */
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastTapRef = useRef<number>(0);
  const [isListening, setIsListening] = useState(true);

  /**
   * 👆 Touch Event Handler
   *
   * Sets up and manages all the touch event listeners for detecting swipes and taps
   */
  useEffect(() => {
    const targetElement = targetRef?.current || document;

    /**
     * ✋ handleTouchStart
     *
     * Captures the initial touch position and checks for double taps
     */
    const handleTouchStart = (e: TouchEvent) => {
      if (!isListening) return;

      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };

      // Check for double tap
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300; // ms

      if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
        if (onDoubleTap) {
          e.preventDefault();
          onDoubleTap();
        }
      }

      lastTapRef.current = now;
    };

    /**
     * 👋 handleTouchEnd
     *
     * Calculates the swipe direction and distance, then triggers the appropriate callback
     */
    const handleTouchEnd = (e: TouchEvent) => {
      if (!isListening || !touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const endX = touch.clientX;
      const endY = touch.clientY;

      const deltaX = endX - touchStartRef.current.x;
      const deltaY = endY - touchStartRef.current.y;

      // Only trigger if swipe is more horizontal than vertical
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
        if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        } else if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        }
      }

      touchStartRef.current = null;
    };

    targetElement.addEventListener(
      "touchstart",
      handleTouchStart as EventListener,
      {
        passive: false,
      }
    );
    targetElement.addEventListener(
      "touchend",
      handleTouchEnd as EventListener,
      {
        passive: false,
      }
    );

    return () => {
      targetElement.removeEventListener(
        "touchstart",
        handleTouchStart as EventListener
      );
      targetElement.removeEventListener(
        "touchend",
        handleTouchEnd as EventListener
      );
    };
  }, [
    threshold,
    onSwipeLeft,
    onSwipeRight,
    onDoubleTap,
    isListening,
    targetRef,
  ]);

  /**
   * 🎮 Gesture Controls
   *
   * Returns helpful functions to control the gesture detection behavior
   */
  return {
    pauseListening: () => setIsListening(false),
    resumeListening: () => setIsListening(true),
    isListening,
  };
};
