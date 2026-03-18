import React from 'react';

import { cn } from '@/lib/utils';

/**
 * ImageRender Component
 *
 * Renders image elements with consistent styling and proper alt text.
 */
const ImageRender: React.FC<React.ComponentPropsWithoutRef<'img'>> = ({
  className,
  alt,
  ...props
}) => {
  return (
    <img
      {...props}
      className={cn('max-w-full h-auto rounded-md my-4', className)}
      alt={alt ?? 'Image'}
    />
  );
};

export default ImageRender;
