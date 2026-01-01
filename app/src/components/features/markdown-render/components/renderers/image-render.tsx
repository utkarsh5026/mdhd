import React from 'react';

/**
 * ImageRender Component
 *
 * Renders image elements with consistent styling and proper alt text.
 */
const ImageRender: React.FC<React.ComponentPropsWithoutRef<'img'>> = (props) => {
  return (
    <img {...props} className="max-w-full h-auto rounded-md my-4" alt={props.alt ?? 'Image'} />
  );
};

export default ImageRender;
