import { useEffect, useRef, useCallback } from 'react';

interface UseResizeOptions {
  debounceDelay?: number;
  skipUnchanged?: boolean;
  listenToOrientation?: boolean;
}

/**
 * useResize
 *
 * A reusable hook for handling viewport resize events with debouncing.
 * Provides a clean API for responding to window size changes.
 *
 * @param callback - Function called when resize occurs, receives { width, height }
 * @param options - Configuration options
 */
const useResize = (
  callback: (dimensions: { width: number; height: number }) => void,
  options: UseResizeOptions = {}
) => {
  const { debounceDelay = 150, skipUnchanged = true, listenToOrientation = false } = options;

  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dimensionsRef = useRef({ width: 0, height: 0 });
  const callbackRef = useRef(callback);

  callbackRef.current = callback;

  const handleResize = useCallback(() => {
    if (globalThis.window === undefined) return;

    const newWidth = globalThis.innerWidth;
    const newHeight = globalThis.innerHeight;

    if (
      skipUnchanged &&
      newWidth === dimensionsRef.current.width &&
      newHeight === dimensionsRef.current.height
    ) {
      return;
    }

    if (resizeTimerRef.current) {
      clearTimeout(resizeTimerRef.current);
    }

    resizeTimerRef.current = setTimeout(() => {
      dimensionsRef.current = { width: newWidth, height: newHeight };
      callbackRef.current({ width: newWidth, height: newHeight });
    }, debounceDelay);
  }, [debounceDelay, skipUnchanged]);

  useEffect(() => {
    if (globalThis.window === undefined) return;

    dimensionsRef.current = {
      width: globalThis.innerWidth,
      height: globalThis.innerHeight,
    };
    callbackRef.current(dimensionsRef.current);

    globalThis.addEventListener('resize', handleResize);

    if (listenToOrientation) {
      globalThis.addEventListener('orientationchange', handleResize);
    }

    return () => {
      globalThis.removeEventListener('resize', handleResize);

      if (listenToOrientation) {
        globalThis.removeEventListener('orientationchange', handleResize);
      }

      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
      }
    };
  }, [handleResize, listenToOrientation]);

  return dimensionsRef.current;
};

export default useResize;
