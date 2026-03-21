import { useCallback, useEffect, useRef, useState } from 'react';

import {
  usePresentationShowFilmstrip,
  usePresentationShowNotes,
  usePresentationShowOverview,
} from '../store/presentation-store';

const CONTROLS_HIDE_DELAY = 3000;

export function useControlsVisibility(currentSlide: number) {
  const [controlsVisible, setControlsVisible] = useState(true);
  const [cursorHidden, setCursorHidden] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showNotes = usePresentationShowNotes();
  const showOverview = usePresentationShowOverview();
  const showFilmstrip = usePresentationShowFilmstrip();

  const panelsOpen = showNotes || showOverview || showFilmstrip;

  const resetHideTimer = useCallback(() => {
    setControlsVisible(true);
    setCursorHidden(false);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
      setCursorHidden(true);
    }, CONTROLS_HIDE_DELAY);
  }, []);

  useEffect(() => {
    if (panelsOpen) {
      setControlsVisible(true);
      setCursorHidden(false);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    } else {
      resetHideTimer();
    }
  }, [panelsOpen, resetHideTimer]);

  useEffect(() => {
    if (!panelsOpen) resetHideTimer();
  }, [currentSlide, resetHideTimer, panelsOpen]);

  useEffect(() => {
    const handleMouseMove = () => {
      if (!panelsOpen) resetHideTimer();
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [panelsOpen, resetHideTimer]);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  return { controlsVisible, cursorHidden };
}
