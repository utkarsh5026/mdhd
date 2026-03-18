export type TextSizeScale = 'xs' | 'sm' | 'base' | 'lg' | 'xl';

export const TEXT_SIZE_SCALE_CLASSES = {
  paragraph: {
    xs: 'text-xs sm:text-sm',
    sm: 'text-sm sm:text-base',
    base: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl',
    xl: 'text-xl sm:text-2xl',
  },
  h1: {
    xs: 'text-base sm:text-lg lg:text-xl',
    sm: 'text-lg sm:text-xl lg:text-2xl',
    base: 'text-xl sm:text-2xl lg:text-3xl',
    lg: 'text-2xl sm:text-3xl lg:text-4xl',
    xl: 'text-3xl sm:text-4xl lg:text-5xl',
  },
  h2: {
    xs: 'text-sm sm:text-base lg:text-lg',
    sm: 'text-base sm:text-lg lg:text-xl',
    base: 'text-lg sm:text-xl lg:text-2xl',
    lg: 'text-xl sm:text-2xl lg:text-3xl',
    xl: 'text-2xl sm:text-3xl lg:text-4xl',
  },
  h3: {
    xs: 'text-xs sm:text-sm lg:text-base',
    sm: 'text-sm sm:text-base lg:text-lg',
    base: 'text-base sm:text-lg lg:text-xl',
    lg: 'text-lg sm:text-xl lg:text-2xl',
    xl: 'text-xl sm:text-2xl lg:text-3xl',
  },
  h4: {
    xs: 'text-xs lg:text-sm',
    sm: 'text-xs sm:text-sm lg:text-base',
    base: 'text-sm sm:text-base lg:text-lg',
    lg: 'text-base sm:text-lg lg:text-xl',
    xl: 'text-lg sm:text-xl lg:text-2xl',
  },
  h5: {
    xs: 'text-xs',
    sm: 'text-xs lg:text-sm',
    base: 'text-xs sm:text-sm lg:text-base',
    lg: 'text-sm sm:text-base lg:text-lg',
    xl: 'text-base sm:text-lg lg:text-xl',
  },
} as const;
