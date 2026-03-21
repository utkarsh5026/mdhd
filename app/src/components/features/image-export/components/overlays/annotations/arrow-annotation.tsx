import React from 'react';

import type { Annotation } from '../../../store/types';

const ArrowAnnotation: React.FC<{ a: Annotation }> = ({ a }) => {
  const toX = a.toX ?? a.x + 10;
  const toY = a.toY ?? a.y + 10;

  const dx = toX - a.x;
  const dy = toY - a.y;
  const angle = Math.atan2(dy, dx);
  const headLen = 8;

  return (
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
      <line
        x1={`${a.x}%`}
        y1={`${a.y}%`}
        x2={`${toX}%`}
        y2={`${toY}%`}
        stroke={a.color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <line
        x1={`${toX}%`}
        y1={`${toY}%`}
        x2={`${toX - headLen * Math.cos(angle - Math.PI / 6) * 0.15}%`}
        y2={`${toY - headLen * Math.sin(angle - Math.PI / 6) * 0.15}%`}
        stroke={a.color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <line
        x1={`${toX}%`}
        y1={`${toY}%`}
        x2={`${toX - headLen * Math.cos(angle + Math.PI / 6) * 0.15}%`}
        y2={`${toY - headLen * Math.sin(angle + Math.PI / 6) * 0.15}%`}
        stroke={a.color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
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
    </svg>
  );
};

export default ArrowAnnotation;
