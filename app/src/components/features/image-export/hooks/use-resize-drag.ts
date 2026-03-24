import type React from 'react';
import { useCallback, useRef } from 'react';

export function useResizeDrag(onResize: (dx: number, dy: number) => void) {
  const state = useRef<{ lastX: number; lastY: number } | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    state.current = { lastX: e.clientX, lastY: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!state.current) return;
      const dx = e.clientX - state.current.lastX;
      const dy = e.clientY - state.current.lastY;
      state.current.lastX = e.clientX;
      state.current.lastY = e.clientY;
      onResize(dx, dy);
    },
    [onResize]
  );

  const onPointerUp = useCallback(() => {
    state.current = null;
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp };
}
