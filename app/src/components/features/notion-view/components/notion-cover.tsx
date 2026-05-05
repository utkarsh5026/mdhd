import React, { memo } from 'react';

import { cn } from '@/lib/utils';
import type { CoverStyle } from '@/utils/notion-cover';

import CoverPattern from './cover-pattern';

interface NotionCoverProps {
  style: CoverStyle;
  className?: string;
}

const NotionCover: React.FC<NotionCoverProps> = memo(({ style, className }) => {
  return (
    <div
      className={cn(
        'relative w-full h-40 sm:h-56 md:h-64 overflow-hidden',
        'rounded-t-2xl',
        className
      )}
      style={{ background: style.gradient }}
    >
      <CoverPattern
        pattern={style.pattern}
        color={style.patternColor}
        opacity={style.patternOpacity}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at top, transparent 40%, rgba(0,0,0,0.18) 100%)',
        }}
      />
    </div>
  );
});

NotionCover.displayName = 'NotionCover';

export default NotionCover;
