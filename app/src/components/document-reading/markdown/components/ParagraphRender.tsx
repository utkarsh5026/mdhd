import React from "react";

/**
 * ParagraphRender Component
 *
 * Renders paragraph elements with responsive typography optimized for mobile reading.
 * Features improved line height, spacing, and text scaling for better readability.
 */
const ParagraphRender: React.FC<React.ComponentPropsWithoutRef<"p">> = (
  props
) => {
  return (
    <p
      {...props}
      className="text-foreground/80 my-3 xs:my-4 sm:my-5 leading-6 xs:leading-7 sm:leading-8 text-pretty break-words text-base xs:text-base sm:text-lg px-1 xs:px-0"
    />
  );
};

export default ParagraphRender;
