import React, { useCallback, useEffect, useRef, useState } from 'react';

import { usePercentageDrag } from '../../hooks/use-percentage-drag';
import type { SharedExportSettings } from '../../store/types';
import { SELECTION_OUTLINE } from './constants';
import type { ResizeAnchor } from './resize-handles';
import ResizeHandles from './resize-handles';
import { resizeContentScale } from './resize-semantics';

export interface ContentDragWrapperProps {
  containerRef: React.RefObject<HTMLElement | null>;
  offsetX: number;
  offsetY: number;
  scaleX: number;
  scaleY: number;
  resizable?: boolean;
  onUpdate: (partial: Partial<SharedExportSettings>) => void;
  children: React.ReactNode;
}

export const ContentDragWrapper: React.FC<ContentDragWrapperProps> = ({
  containerRef,
  offsetX,
  offsetY,
  scaleX,
  scaleY,
  resizable = false,
  onUpdate,
  children,
}) => {
  const [active, setActive] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const drag = usePercentageDrag(containerRef, {
    onDrag: (dx, dy) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const pxDx = (dx / 100) * rect.width;
      const pxDy = (dy / 100) * rect.height;
      onUpdate({
        contentOffsetX: offsetX + pxDx,
        contentOffsetY: offsetY + pxDy,
      });
    },
  });

  const handleContentResize = useCallback(
    (dx: number, dy: number, anchor: ResizeAnchor) => {
      const el = wrapperRef.current;
      if (!el) return;

      const naturalW = el.offsetWidth / scaleX;
      const naturalH = el.offsetHeight / scaleY;
      onUpdate(
        resizeContentScale(scaleX, scaleY, dx, dy, anchor, naturalW, naturalH, offsetX, offsetY)
      );
    },
    [scaleX, scaleY, offsetX, offsetY, onUpdate]
  );

  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active]);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onUpdate({ contentOffsetX: 0, contentOffsetY: 0, contentScaleX: 1, contentScaleY: 1 });
    },
    [onUpdate]
  );

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'relative',
        transform: `translate(${offsetX}px, ${offsetY}px) scale(${scaleX}, ${scaleY})`,
        transformOrigin: 'center center',
        cursor: active ? 'grab' : 'default',
        zIndex: 1,
        ...(active ? SELECTION_OUTLINE : {}),
      }}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest('[data-overlay]')) return;
        setActive(true);
        drag.onPointerDown(e);
      }}
      onPointerMove={drag.onPointerMove}
      onPointerUp={drag.onPointerUp}
      onDoubleClick={handleDoubleClick}
    >
      {children}
      {active && resizable && <ResizeHandles onResize={handleContentResize} />}
    </div>
  );
};
