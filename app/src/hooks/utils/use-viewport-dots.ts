import { useState, useCallback } from 'react';
import useResize from './use-resize';

interface UseViewportDotsOptions {
  minDots?: number;
  maxDots?: number;
  reservedHeight?: number;
  debounceDelay?: number;
}

const DOT_HEIGHT = 16; // w-4 h-4 = 16px
const GAP_HEIGHT = 16; // gap-4 = 16px
const TOTAL_PER_DOT = DOT_HEIGHT + GAP_HEIGHT; // 32px per dot

/**
 * useViewportDots
 *
 * Calculates the maximum number of progress indicator dots that can fit
 * in the current viewport height. Adapts dynamically to viewport changes.
 *
 * This hook ensures the progress indicator never overflows by calculating
 * available vertical space and determining how many dots can comfortably fit.
 */
const useViewportDots = (options: UseViewportDotsOptions = {}) => {
  const {
    minDots = 5,
    maxDots = 12,
    reservedHeight = 200, // Space for percentage display + padding
    debounceDelay = 150,
  } = options;

  const calculateMaxDots = useCallback(
    (height: number) => {
      const availableHeight = height - reservedHeight;
      const calculated = Math.floor(availableHeight / TOTAL_PER_DOT);
      return Math.max(minDots, Math.min(calculated, maxDots));
    },
    [minDots, maxDots, reservedHeight]
  );

  const [maxVisibleDots, setMaxVisibleDots] = useState(maxDots);

  useResize(
    ({ height }) => {
      setMaxVisibleDots(calculateMaxDots(height));
    },
    { debounceDelay }
  );

  return maxVisibleDots;
};

export default useViewportDots;
