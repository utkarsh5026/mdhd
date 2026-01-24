import { useCallback, useEffect, useRef } from 'react';

interface UseZenModeOptions {
  isZenMode: boolean;
  setZenMode: (value: boolean) => void;
  showZenControls: () => void;
  hideZenControls: () => void;
}

interface UseZenModeReturn {
  handleZenTap: () => void;
  handleZenDoubleTap: () => void;
}

/**
 * Shared hook for zen mode interaction logic.
 * Works with both global store actions and local useState setters.
 */
export const useZenMode = ({
  isZenMode,
  setZenMode,
  showZenControls,
  hideZenControls,
}: UseZenModeOptions): UseZenModeReturn => {
  const zenControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleZenTap = useCallback(() => {
    if (!isZenMode) return;

    if (zenControlsTimeoutRef.current) {
      clearTimeout(zenControlsTimeoutRef.current);
    }

    showZenControls();

    zenControlsTimeoutRef.current = setTimeout(() => {
      hideZenControls();
    }, 2000);
  }, [isZenMode, showZenControls, hideZenControls]);

  const handleZenDoubleTap = useCallback(() => {
    if (isZenMode) {
      setZenMode(false);
    }
  }, [isZenMode, setZenMode]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (zenControlsTimeoutRef.current) {
        clearTimeout(zenControlsTimeoutRef.current);
      }
    };
  }, []);

  return { handleZenTap, handleZenDoubleTap };
};
