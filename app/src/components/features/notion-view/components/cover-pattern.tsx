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
    case 'grid':
      return (
        <pattern id={id} width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M32 0H0V32" fill="none" stroke={color} strokeWidth="1" />
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
  }
}

export default CoverPattern;
