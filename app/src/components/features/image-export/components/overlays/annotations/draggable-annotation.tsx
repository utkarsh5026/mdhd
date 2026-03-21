import React, { useCallback } from 'react';

import type { Annotation } from '../../../store/types';
import { SELECTION_OUTLINE } from '../constants';
import { usePercentageDrag } from '../hooks/use-percentage-drag';
import ResizeHandles from '../resize-handles';
import { resizeAnnotationFontSize } from '../resize-semantics';

const DraggableAnnotation: React.FC<{
  annotation: Annotation;
  containerRef: React.RefObject<HTMLElement | null>;
  selected: boolean;
  onSelect: () => void;
  onUpdate: (partial: Partial<Annotation>) => void;
}> = ({ annotation: a, containerRef, selected, onSelect, onUpdate }) => {
  const drag = usePercentageDrag(containerRef, {
    onDrag: (dx, dy) => {
      onUpdate({
        x: Math.max(0, Math.min(100, a.x + dx)),
        y: Math.max(0, Math.min(100, a.y + dy)),
        ...(a.type === 'arrow' && a.toX != null && a.toY != null
          ? {
              toX: Math.max(0, Math.min(100, a.toX + dx)),
              toY: Math.max(0, Math.min(100, a.toY + dy)),
            }
          : {}),
      });
    },
  });

  const arrowStartDrag = usePercentageDrag(containerRef, {
    onDrag: (dx, dy) => {
      onUpdate({
        x: Math.max(0, Math.min(100, a.x + dx)),
        y: Math.max(0, Math.min(100, a.y + dy)),
      });
    },
  });

  const arrowEndDrag = usePercentageDrag(containerRef, {
    onDrag: (dx, dy) => {
      onUpdate({
        toX: Math.max(0, Math.min(100, (a.toX ?? 70) + dx)),
        toY: Math.max(0, Math.min(100, (a.toY ?? 70) + dy)),
      });
    },
  });

  const handleAnnotationResize = useCallback(
    (dx: number, dy: number) => {
      onUpdate({ fontSize: resizeAnnotationFontSize(a.fontSize, dx, dy) });
    },
    [a.fontSize, onUpdate]
  );

  // --- Arrow ---
  if (a.type === 'arrow') {
    const toX = a.toX ?? a.x + 10;
    const toY = a.toY ?? a.y + 10;
    const ddx = toX - a.x;
    const ddy = toY - a.y;
    const angle = Math.atan2(ddy, ddx);
    const headLen = 8;

    return (
      <>
        {/* Invisible wider line for easier grab */}
        <line
          x1={`${a.x}%`}
          y1={`${a.y}%`}
          x2={`${toX}%`}
          y2={`${toY}%`}
          stroke="transparent"
          strokeWidth={16}
          style={{ cursor: 'grab', pointerEvents: 'auto' }}
          onPointerDown={(e) => {
            onSelect();
            drag.onPointerDown(e);
          }}
          onPointerMove={drag.onPointerMove}
          onPointerUp={drag.onPointerUp}
        />
        {/* Visible line */}
        <line
          x1={`${a.x}%`}
          y1={`${a.y}%`}
          x2={`${toX}%`}
          y2={`${toY}%`}
          stroke={a.color}
          strokeWidth={2.5}
          strokeLinecap="round"
          style={{ pointerEvents: 'none' }}
        />
        {/* Arrowhead */}
        <line
          x1={`${toX}%`}
          y1={`${toY}%`}
          x2={`${toX - headLen * Math.cos(angle - Math.PI / 6) * 0.15}%`}
          y2={`${toY - headLen * Math.sin(angle - Math.PI / 6) * 0.15}%`}
          stroke={a.color}
          strokeWidth={2.5}
          strokeLinecap="round"
          style={{ pointerEvents: 'none' }}
        />
        <line
          x1={`${toX}%`}
          y1={`${toY}%`}
          x2={`${toX - headLen * Math.cos(angle + Math.PI / 6) * 0.15}%`}
          y2={`${toY - headLen * Math.sin(angle + Math.PI / 6) * 0.15}%`}
          stroke={a.color}
          strokeWidth={2.5}
          strokeLinecap="round"
          style={{ pointerEvents: 'none' }}
        />
        {/* Label near start */}
        {a.text && (
          <text
            x={`${a.x}%`}
            y={`${a.y}%`}
            dy={-10}
            textAnchor="middle"
            fill={a.color}
            fontSize={a.fontSize}
            fontWeight="600"
            fontFamily="system-ui, sans-serif"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' } as React.CSSProperties}
          >
            {a.text}
          </text>
        )}
        {/* Draggable start handle */}
        {selected && (
          <circle
            cx={`${a.x}%`}
            cy={`${a.y}%`}
            r={5}
            fill="rgba(59,130,246,0.9)"
            stroke="white"
            strokeWidth={1.5}
            style={{ cursor: 'grab', pointerEvents: 'auto' }}
            onPointerDown={(e) => {
              onSelect();
              arrowStartDrag.onPointerDown(e);
            }}
            onPointerMove={arrowStartDrag.onPointerMove}
            onPointerUp={arrowStartDrag.onPointerUp}
          />
        )}
        {/* Draggable end handle */}
        {selected && (
          <circle
            cx={`${toX}%`}
            cy={`${toY}%`}
            r={5}
            fill="rgba(59,130,246,0.9)"
            stroke="white"
            strokeWidth={1.5}
            style={{ cursor: 'grab', pointerEvents: 'auto' }}
            onPointerDown={(e) => {
              onSelect();
              arrowEndDrag.onPointerDown(e);
            }}
            onPointerMove={arrowEndDrag.onPointerMove}
            onPointerUp={arrowEndDrag.onPointerUp}
          />
        )}
      </>
    );
  }

  // --- Numbered ---
  if (a.type === 'numbered') {
    return (
      <div
        style={{
          position: 'absolute',
          left: `${a.x}%`,
          top: `${a.y}%`,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'auto',
          userSelect: 'none',
          cursor: 'grab',
          ...(selected ? SELECTION_OUTLINE : {}),
        }}
        onPointerDown={(e) => {
          onSelect();
          drag.onPointerDown(e);
        }}
        onPointerMove={drag.onPointerMove}
        onPointerUp={drag.onPointerUp}
      >
        <div
          style={{
            width: a.fontSize * 2,
            height: a.fontSize * 2,
            borderRadius: '50%',
            backgroundColor: a.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `${a.fontSize}px`,
            fontWeight: 700,
            color: '#fff',
            fontFamily: 'system-ui, sans-serif',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          }}
        >
          {a.text}
        </div>
        {selected && <ResizeHandles onResize={handleAnnotationResize} />}
      </div>
    );
  }

  // --- Label ---
  return (
    <div
      style={{
        position: 'absolute',
        left: `${a.x}%`,
        top: `${a.y}%`,
        transform: 'translate(-50%, -50%)',
        color: a.color,
        fontSize: `${a.fontSize}px`,
        fontWeight: 600,
        fontFamily: 'system-ui, sans-serif',
        padding: '2px 8px',
        borderRadius: 6,
        backgroundColor: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        whiteSpace: 'nowrap',
        pointerEvents: 'auto',
        userSelect: 'none',
        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
        cursor: 'grab',
        ...(selected ? SELECTION_OUTLINE : {}),
      }}
      onPointerDown={(e) => {
        onSelect();
        drag.onPointerDown(e);
      }}
      onPointerMove={drag.onPointerMove}
      onPointerUp={drag.onPointerUp}
    >
      {a.text}
      {selected && <ResizeHandles onResize={handleAnnotationResize} />}
    </div>
  );
};

export default DraggableAnnotation;
