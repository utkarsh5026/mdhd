import React from 'react';

import { cn } from '@/lib/utils';

const iconSizes = {
  xs: 'h-3 w-3',
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
  xl: 'h-6 w-6',
  '2xl': 'h-8 w-8',
} as const;

// Explicit responsive variants so Tailwind's scanner can detect every class.
const responsiveIconSizes = {
  sm: {
    xs: 'sm:h-3 sm:w-3',
    sm: 'sm:h-3.5 sm:w-3.5',
    md: 'sm:h-4 sm:w-4',
    lg: 'sm:h-5 sm:w-5',
    xl: 'sm:h-6 sm:w-6',
    '2xl': 'sm:h-8 sm:w-8',
  },
  md: {
    xs: 'md:h-3 md:w-3',
    sm: 'md:h-3.5 md:w-3.5',
    md: 'md:h-4 md:w-4',
    lg: 'md:h-5 md:w-5',
    xl: 'md:h-6 md:w-6',
    '2xl': 'md:h-8 md:w-8',
  },
  lg: {
    xs: 'lg:h-3 lg:w-3',
    sm: 'lg:h-3.5 lg:w-3.5',
    md: 'lg:h-4 lg:w-4',
    lg: 'lg:h-5 lg:w-5',
    xl: 'lg:h-6 lg:w-6',
    '2xl': 'lg:h-8 lg:w-8',
  },
  xl: {
    xs: 'xl:h-3 xl:w-3',
    sm: 'xl:h-3.5 xl:w-3.5',
    md: 'xl:h-4 xl:w-4',
    lg: 'xl:h-5 xl:w-5',
    xl: 'xl:h-6 xl:w-6',
    '2xl': 'xl:h-8 xl:w-8',
  },
} as const;

export type IconSize = keyof typeof iconSizes;
type Breakpoint = keyof typeof responsiveIconSizes;

type ResponsiveSizeObj = { base?: IconSize } & Partial<Record<Breakpoint, IconSize>>;
type ResponsiveSize = IconSize | ResponsiveSizeObj;

function resolveSize(size: ResponsiveSize): string {
  if (typeof size === 'string') return iconSizes[size];

  const classes: string[] = [];
  const { base, ...breakpoints } = size;

  if (base) classes.push(iconSizes[base]);

  for (const [bp, iconSize] of Object.entries(breakpoints) as [Breakpoint, IconSize][]) {
    classes.push(responsiveIconSizes[bp][iconSize]);
  }

  return classes.join(' ');
}

interface IconProps {
  icon: React.ComponentType<{ className?: string }>;
  size?: ResponsiveSize;
  className?: string;
}

const Icon: React.FC<IconProps> = ({ icon: Component, size = 'md', className }) => (
  <Component className={cn(resolveSize(size), className)} />
);

Icon.displayName = 'Icon';

export default Icon;
