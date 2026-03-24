import React from 'react';

import type { Annotation } from '../../../store/types';
import ArrowAnnotation from './arrow-annotation';
import LabelAnnotation from './label-annotation';
import NumberedAnnotation from './numbered-annotation';

export const AnnotationOverlay: React.FC<{ annotations: Annotation[] }> = ({ annotations }) => {
  if (!annotations.length) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 15,
      }}
    >
      {annotations.map((a) => {
        switch (a.type) {
          case 'label':
            return <LabelAnnotation key={a.id} a={a} />;
          case 'numbered':
            return <NumberedAnnotation key={a.id} a={a} />;
          case 'arrow':
            return <ArrowAnnotation key={a.id} a={a} />;
          default:
            return null;
        }
      })}
    </div>
  );
};
