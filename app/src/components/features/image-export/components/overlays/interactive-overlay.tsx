import React, { useState } from 'react';

import { useKeyPress } from '@/hooks';

import type { Annotation, SharedExportSettings } from '../../store/types';
import DraggableAnnotation from './annotations/draggable-annotation';
import DraggableWatermark from './draggable-watermark';

export interface InteractiveOverlayProps {
  containerRef: React.RefObject<HTMLElement | null>;
  annotations: Annotation[];
  settings: SharedExportSettings;
  onAnnotationUpdate: (id: string, partial: Partial<Annotation>) => void;
  onSettingsUpdate: (partial: Partial<SharedExportSettings>) => void;
}

export const InteractiveOverlay: React.FC<InteractiveOverlayProps> = ({
  containerRef,
  annotations,
  settings,
  onAnnotationUpdate,
  onSettingsUpdate,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useKeyPress('Escape', () => setSelectedId(null));

  const hasArrows = annotations.some((a) => a.type === 'arrow');

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 15,
      }}
    >
      {/* SVG layer for arrow annotations */}
      {hasArrows && (
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            overflow: 'visible',
          }}
        >
          {annotations
            .filter((a) => a.type === 'arrow')
            .map((a) => (
              <DraggableAnnotation
                key={a.id}
                annotation={a}
                containerRef={containerRef}
                selected={selectedId === a.id}
                onSelect={() => setSelectedId(a.id)}
                onUpdate={(partial) => onAnnotationUpdate(a.id, partial)}
              />
            ))}
        </svg>
      )}

      {/* DOM layer for label / numbered annotations */}
      {annotations
        .filter((a) => a.type !== 'arrow')
        .map((a) => (
          <DraggableAnnotation
            key={a.id}
            annotation={a}
            containerRef={containerRef}
            selected={selectedId === a.id}
            onSelect={() => setSelectedId(a.id)}
            onUpdate={(partial) => onAnnotationUpdate(a.id, partial)}
          />
        ))}

      {/* Draggable watermark */}
      <DraggableWatermark
        settings={settings}
        containerRef={containerRef}
        selected={selectedId === '__watermark__'}
        onSelect={() => setSelectedId('__watermark__')}
        onUpdate={onSettingsUpdate}
      />
    </div>
  );
};
