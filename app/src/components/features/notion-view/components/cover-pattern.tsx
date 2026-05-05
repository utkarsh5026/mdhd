import React, { memo, useId } from 'react';

import type { CoverPattern as Pattern } from '@/utils/notion-cover';

interface CoverPatternProps {
  pattern: Pattern;
  color: string;
  opacity: number;
}

const CoverPattern: React.FC<CoverPatternProps> = memo(({ pattern, color, opacity }) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const patternId = `cp-${id}`;

  return (
    <svg
      aria-hidden
      className="absolute inset-0 h-full w-full"
      style={{ opacity }}
      preserveAspectRatio="none"
    >
      <defs>{renderPatternDef(pattern, patternId, color)}</defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
});

CoverPattern.displayName = 'CoverPattern';

function renderPatternDef(pattern: Pattern, id: string, color: string): React.ReactNode {
  switch (pattern) {
    case 'dots':
      return (
        <pattern id={id} width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.6" fill={color} />
        </pattern>
      );
    case 'polka':
      return (
        <pattern id={id} width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="5" cy="5" r="1.6" fill={color} />
          <circle cx="15" cy="15" r="1.6" fill={color} />
        </pattern>
      );
    case 'grid':
      return (
        <pattern id={id} width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M32 0H0V32" fill="none" stroke={color} strokeWidth="1" />
        </pattern>
      );
    case 'microgrid':
      return (
        <pattern id={id} width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M16 0H0V16" fill="none" stroke={color} strokeWidth="0.8" />
        </pattern>
      );
    case 'waves':
      return (
        <pattern id={id} width="60" height="20" patternUnits="userSpaceOnUse">
          <path
            d="M0 10 Q 15 0 30 10 T 60 10"
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </pattern>
      );
    case 'stripes':
      return (
        <pattern
          id={id}
          width="14"
          height="14"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="14" stroke={color} strokeWidth="2" />
        </pattern>
      );
    case 'diagonal':
      return (
        <pattern id={id} width="12" height="12" patternUnits="userSpaceOnUse">
          <path d="M-3 12 L12 -3 M0 15 L15 0" fill="none" stroke={color} strokeWidth="1" />
        </pattern>
      );
    case 'crosshatch':
      return (
        <pattern id={id} width="12" height="12" patternUnits="userSpaceOnUse">
          <path
            d="M-3 12 L12 -3 M0 15 L15 0 M-3 0 L12 15 M0 -3 L15 12"
            fill="none"
            stroke={color}
            strokeWidth="0.9"
          />
        </pattern>
      );
    case 'mesh':
      return (
        <pattern id={id} width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M0 20 L20 0 L40 20 L20 40 Z" fill="none" stroke={color} strokeWidth="1" />
        </pattern>
      );
    case 'circles':
      return (
        <pattern id={id} width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="20" cy="20" r="10" fill="none" stroke={color} strokeWidth="1.2" />
          <circle cx="20" cy="20" r="3" fill={color} />
        </pattern>
      );
    case 'checkerboard':
      return (
        <pattern id={id} width="18" height="18" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="9" height="9" fill={color} opacity="0.6" />
          <rect x="9" y="9" width="9" height="9" fill={color} opacity="0.6" />
        </pattern>
      );
    case 'diamonds':
      return (
        <pattern id={id} width="26" height="26" patternUnits="userSpaceOnUse">
          <path d="M13 2 L24 13 L13 24 L2 13 Z" fill="none" stroke={color} strokeWidth="1.1" />
        </pattern>
      );
    case 'plus':
      return (
        <pattern id={id} width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M12 6 V18 M6 12 H18" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </pattern>
      );
    case 'triangles':
      return (
        <pattern id={id} width="28" height="28" patternUnits="userSpaceOnUse">
          <path d="M14 4 L24 22 L4 22 Z" fill="none" stroke={color} strokeWidth="1.2" />
        </pattern>
      );
    case 'hexagons':
      return (
        <pattern id={id} width="34" height="30" patternUnits="userSpaceOnUse">
          <path
            d="M17 3 L26 9 L26 21 L17 27 L8 21 L8 9 Z"
            fill="none"
            stroke={color}
            strokeWidth="1"
          />
          <path
            d="M0 15 L9 9 L9 21 Z M34 15 L25 9 L25 21 Z"
            fill="none"
            stroke={color}
            strokeWidth="1"
          />
        </pattern>
      );
    case 'dash':
      return (
        <pattern id={id} width="18" height="18" patternUnits="userSpaceOnUse">
          <path
            d="M4 6 H9 M11 12 H16"
            fill="none"
            stroke={color}
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </pattern>
      );
    case 'confetti':
      return (
        <pattern id={id} width="28" height="28" patternUnits="userSpaceOnUse">
          <rect x="6" y="7" width="2.2" height="2.2" fill={color} opacity="0.9" />
          <rect x="18" y="5" width="1.8" height="1.8" fill={color} opacity="0.8" />
          <circle cx="10" cy="20" r="1.3" fill={color} opacity="0.85" />
          <circle cx="22" cy="18" r="1.2" fill={color} opacity="0.75" />
          <rect x="14" y="14" width="1.6" height="1.6" fill={color} opacity="0.7" />
        </pattern>
      );
    case 'steps':
      return (
        <pattern id={id} width="24" height="24" patternUnits="userSpaceOnUse">
          <path
            d="M6 8 H12 V14 M18 10 H14 V16"
            fill="none"
            stroke={color}
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </pattern>
      );
  }
}

export default CoverPattern;
