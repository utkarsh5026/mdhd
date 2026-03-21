import React from 'react';

import type { Annotation } from '../../../store/types';

const LabelAnnotation: React.FC<{ a: Annotation }> = ({ a }) => (
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
    }}
  >
    {a.text}
  </div>
);

export default LabelAnnotation;
