import { useCallback, useEffect } from 'react';

import { usePresentationActions } from '../store/presentation-store';

interface UseSlideKeyboardOptions {
  goNext: () => void;
  goPrev: () => void;
  onExit: () => void;
}

export function useSlideKeyboard({ goNext, goPrev, onExit }: UseSlideKeyboardOptions) {
  const { toggleNotes, toggleOverview, toggleFilmstrip, stopPresentation } =
    usePresentationActions();

  const handleExit = useCallback(() => {
    stopPresentation();
    onExit();
  }, [stopPresentation, onExit]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
          e.preventDefault();
          goNext();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          goPrev();
          break;
        case 'Escape':
          e.preventDefault();
          handleExit();
          break;
        case 'n':
        case 'N':
          e.preventDefault();
          toggleNotes();
          break;
        case 'g':
        case 'G':
          e.preventDefault();
          toggleOverview();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFilmstrip();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev, handleExit, toggleNotes, toggleOverview, toggleFilmstrip]);

  return { handleExit };
}
