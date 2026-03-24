import React from 'react';

import type { Annotation } from '../../../store/types';

const NumberedAnnotation: React.FC<{ a: Annotation }> = ({ a }) => (
  <div
    style={{
      position: 'absolute',
      left: `${a.x}%`,
      top: `${a.y}%`,
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'auto',
      userSelect: 'none',
    }}
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
  </div>
);

export default NumberedAnnotation;
