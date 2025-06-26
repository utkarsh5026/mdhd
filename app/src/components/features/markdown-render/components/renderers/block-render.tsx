import { cn } from "@/lib/utils";
import React from "react";

/**
 * BlockquoteRender Component
 *
 * Renders blockquote elements with enhanced visual styling and typography for optimal readability.
 * Features improved contrast, spacing, and responsive design for better content differentiation.
 * Optimized for both mobile and desktop viewing with clear visual hierarchy.
 */
const BlockquoteRender: React.FC<
  React.ComponentPropsWithoutRef<"blockquote">
> = (props) => {
  return (
    <blockquote
      {...props}
      className={cn(
        "border-l-4 xs:border-l-5 sm:border-l-6 border-primary/30",
        "px-4 xs:px-5 sm:px-6 lg:px-7",
        "my-5 xs:my-6 sm:my-7 lg:my-8",
        "py-3 xs:py-4 sm:py-5 lg:py-6",
        "text-primary/70",
        "bg-card/50 backdrop-blur-sm",
        "text-base xs:text-lg sm:text-xl lg:text-xl",
        "leading-7 xs:leading-8 sm:leading-9 lg:leading-10",
        "text-pretty break-words",
        "rounded-xl xs:rounded-2xl sm:rounded-3xl",
        "font-medium italic",
        "tracking-normal xs:tracking-wide",
        "shadow-sm",
        "transition-all duration-200",
        "relative",
        "selection:bg-primary/20",
        props.className
      )}
    />
  );
};

export default BlockquoteRender;
