import type React from 'react';
import { useCallback, useRef } from 'react';

interface DragCallbacks {
  onDrag: (dx: number, dy: number) => void;
  onDragEnd?: () => void;
}

export function usePercentageDrag(
  containerRef: React.RefObject<HTMLElement | null>,
  cb: DragCallbacks
) {
  const dragging = useRef<{ startX: number; startY: number; accX: number; accY: number } | null>(
    null
  );

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    dragging.current = { startX: e.clientX, startY: e.clientY, accX: 0, accY: 0 };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dx = ((e.clientX - dragging.current.startX) / rect.width) * 100;
      const dy = ((e.clientY - dragging.current.startY) / rect.height) * 100;
      cb.onDrag(dx - dragging.current.accX, dy - dragging.current.accY);
      dragging.current.accX = dx;
      dragging.current.accY = dy;
    },
    [containerRef, cb]
  );

  const onPointerUp = useCallback(() => {
    dragging.current = null;
    cb.onDragEnd?.();
  }, [cb]);

  return { onPointerDown, onPointerMove, onPointerUp };
}
