import React from "react";

/**
 * BlockquoteRender Component
 *
 * Renders blockquote elements with responsive styling and improved mobile readability.
 * Features adaptive padding, margins, and border styling for different screen sizes.
 */
const BlockquoteRender: React.FC<
  React.ComponentPropsWithoutRef<"blockquote">
> = (props) => {
  return (
    <blockquote
      {...props}
      className="border-l-4 border-primary/20 
                 px-2 xs:px-3 sm:px-4 my-4 xs:my-5 sm:my-6 
                 py-2 xs:py-2 sm:py-3 
                 text-foreground rounded-2xl 
                 bg-card/40 text-sm xs:text-base sm:text-lg
                 leading-6 xs:leading-7 sm:leading-8 text-pretty break-words"
    />
  );
};

export default BlockquoteRender;
