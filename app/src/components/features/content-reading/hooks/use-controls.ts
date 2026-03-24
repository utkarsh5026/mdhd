import { useCallback, useEffect, useRef, useState } from 'react';

const CONTROLS_TIMEOUT = 4000;

interface UseControlsProps {
  goToNext: () => void;
  goToPrevious: () => void;
  readingMode?: 'card' | 'scroll';
  onSearch?: () => void;
}

export const useControls = ({
  goToNext,
  goToPrevious,
  readingMode = 'card',
  onSearch,
}: UseControlsProps) => {
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    setIsControlsVisible(true);

    controlsTimeoutRef.current = setTimeout(() => {
      setIsControlsVisible(false);
    }, CONTROLS_TIMEOUT);
  }, []);

  const handleInteraction = useCallback(() => {
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      // Show controls when mouse is near top or bottom edges
      if (e.clientY <= 80 || e.clientY >= window.innerHeight - 80) {
        handleInteraction();
      }
    },
    [handleInteraction]
  );

  const handleDoubleClick = useCallback(() => {
    setIsControlsVisible(true);
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd+F should always open search, even from inputs
      if (e.key === 'f' && (e.ctrlKey || e.metaKey) && onSearch) {
        e.preventDefault();
        onSearch();
        return;
      }

      const target = e.target as Element | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.closest?.('[contenteditable="true"]')
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          // Only navigate sections in card mode
          if (readingMode === 'card') {
            goToPrevious();
            handleInteraction();
          }
          // In scroll mode, let browser handle natural scrolling
          break;
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
          // Only navigate sections in card mode
          if (readingMode === 'card') {
            e.preventDefault();
            goToNext();
            handleInteraction();
          }
          // In scroll mode, let browser handle natural scrolling
          break;
        case 'Escape':
          setIsControlsVisible(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [goToNext, goToPrevious, handleInteraction, readingMode, onSearch]);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [resetControlsTimeout]);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove]);

  return {
    isControlsVisible,
    setIsControlsVisible,
    handleInteraction,
    handleDoubleClick,
  };
};
