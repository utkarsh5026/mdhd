import React, { useCallback } from 'react';

import { usePercentageDrag } from '../../hooks/use-percentage-drag';
import type { SharedExportSettings } from '../../store/types';
import { SELECTION_OUTLINE } from './constants';
import ResizeHandles from './resize-handles';
import { resizeWatermarkSize } from './resize-semantics';

const PRESET_POSITIONS: Record<string, { x: number; y: number }> = {
  'bottom-right': { x: 92, y: 95 },
  'bottom-left': { x: 8, y: 95 },
  'top-right': { x: 92, y: 5 },
  'top-left': { x: 8, y: 5 },
};

const DraggableWatermark: React.FC<{
  settings: SharedExportSettings;
  containerRef: React.RefObject<HTMLElement | null>;
  selected: boolean;
  onSelect: () => void;
  onUpdate: (partial: Partial<SharedExportSettings>) => void;
}> = ({ settings, containerRef, selected, onSelect, onUpdate }) => {
  const { watermarkText, watermarkX, watermarkY, watermarkPosition, watermarkSize } = settings;

  const preset = PRESET_POSITIONS[watermarkPosition] ?? PRESET_POSITIONS['bottom-right'];
  const x = watermarkX >= 0 ? watermarkX : preset.x;
  const y = watermarkY >= 0 ? watermarkY : preset.y;

  const drag = usePercentageDrag(containerRef, {
    onDrag: (dx, dy) => {
      onUpdate({
        watermarkX: Math.max(0, Math.min(100, x + dx)),
        watermarkY: Math.max(0, Math.min(100, y + dy)),
      });
    },
  });

  const handleWatermarkResize = useCallback(
    (dx: number, dy: number) => {
      onUpdate({ watermarkSize: resizeWatermarkSize(watermarkSize, dx, dy) });
    },
    [watermarkSize, onUpdate]
  );

  if (!watermarkText) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        opacity: settings.watermarkOpacity / 100,
        fontSize: `${watermarkSize}px`,
        color: settings.watermarkColor,
        fontFamily: settings.watermarkFontFamily,
        textShadow: '0 1px 3px rgba(0,0,0,0.4)',
        pointerEvents: 'auto',
        userSelect: 'none',
        zIndex: 10,
        cursor: 'grab',
        whiteSpace: 'nowrap',
        ...(selected ? SELECTION_OUTLINE : {}),
      }}
      onPointerDown={(e) => {
        onSelect();
        drag.onPointerDown(e);
      }}
      onPointerMove={drag.onPointerMove}
      onPointerUp={drag.onPointerUp}
    >
      {watermarkText}
      {selected && <ResizeHandles onResize={handleWatermarkResize} />}
    </div>
  );
};

export default DraggableWatermark;
