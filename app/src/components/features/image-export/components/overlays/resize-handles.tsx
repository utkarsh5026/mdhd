import React, { memo, useCallback } from 'react';

import { useResizeDrag } from '../../hooks/use-resize-drag';

const H = 8;
const E = -H / 2 - 3;

const BASE_STYLE: React.CSSProperties = {
  position: 'absolute',
  width: H,
  height: H,
  background: 'rgba(59,130,246,0.9)',
  border: '1.5px solid white',
  borderRadius: 2,
  pointerEvents: 'auto',
  zIndex: 20,
};

// anchor: relative point from element center that stays fixed during resize.
// e.g. [-0.5, 0] = left-center stays fixed (E handle), [0.5, 0.5] = bottom-right stays fixed (NW handle)
type HandleDef = {
  style: React.CSSProperties;
  mask: (dx: number, dy: number) => [number, number];
  anchor: readonly [number, number];
};

const CORNERS: HandleDef[] = [
  {
    style: { top: E, left: E, cursor: 'nwse-resize' },
    mask: (dx, dy) => [-dx, -dy],
    anchor: [0.5, 0.5],
  },
  {
    style: { top: E, right: E, cursor: 'nesw-resize' },
    mask: (dx, dy) => [dx, -dy],
    anchor: [-0.5, 0.5],
  },
  {
    style: { bottom: E, left: E, cursor: 'nesw-resize' },
    mask: (dx, dy) => [-dx, dy],
    anchor: [0.5, -0.5],
  },
  {
    style: { bottom: E, right: E, cursor: 'nwse-resize' },
    mask: (dx, dy) => [dx, dy],
    anchor: [-0.5, -0.5],
  },
];

const EDGE_MIDPOINTS: HandleDef[] = [
  {
    style: { top: E, left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' },
    mask: (_, dy) => [0, -dy],
    anchor: [0, 0.5],
  },
  {
    style: { bottom: E, left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' },
    mask: (_, dy) => [0, dy],
    anchor: [0, -0.5],
  },
  {
    style: { left: E, top: '50%', transform: 'translateY(-50%)', cursor: 'w-resize' },
    mask: (dx) => [-dx, 0],
    anchor: [0.5, 0],
  },
  {
    style: { right: E, top: '50%', transform: 'translateY(-50%)', cursor: 'e-resize' },
    mask: (dx) => [dx, 0],
    anchor: [-0.5, 0],
  },
];

const HANDLES: HandleDef[] = [...CORNERS, ...EDGE_MIDPOINTS];

export type ResizeAnchor = readonly [number, number];

const ResizeHandle = memo(
  ({
    style,
    mask,
    anchor,
    onResize,
  }: {
    style: React.CSSProperties;
    mask: (dx: number, dy: number) => [number, number];
    anchor: ResizeAnchor;
    onResize: (dx: number, dy: number, anchor: ResizeAnchor) => void;
  }) => {
    const maskedResize = useCallback(
      (dx: number, dy: number) => {
        const [mx, my] = mask(dx, dy);
        onResize(mx, my, anchor);
      },
      [mask, anchor, onResize]
    );
    const drag = useResizeDrag(maskedResize);
    return (
      <div
        style={{ ...BASE_STYLE, ...style }}
        onPointerDown={drag.onPointerDown}
        onPointerMove={drag.onPointerMove}
        onPointerUp={drag.onPointerUp}
      />
    );
  }
);
ResizeHandle.displayName = 'ResizeHandle';

const ResizeHandles: React.FC<{
  onResize: (dx: number, dy: number, anchor: ResizeAnchor) => void;
}> = ({ onResize }) => (
  <>
    {HANDLES.map((def, i) => (
      <ResizeHandle
        key={i}
        style={def.style}
        mask={def.mask}
        anchor={def.anchor}
        onResize={onResize}
      />
    ))}
  </>
);

export default ResizeHandles;
