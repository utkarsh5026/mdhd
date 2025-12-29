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
        // Slightly more prominent border
        "border-l-4 xs:border-l-4 sm:border-l-5 border-primary/40",
        "px-4 xs:px-5 sm:px-6 lg:px-7",
        "my-5 xs:my-6 sm:my-7 lg:my-8",
        "py-3 xs:py-4 sm:py-5 lg:py-6",
        // Improved contrast: 70% -> 85% for readability while maintaining distinct quote feel
        "text-foreground/85",
        "bg-card/50 backdrop-blur-sm",
        // Match paragraph sizing - cap at text-lg
        "text-base xs:text-base sm:text-lg lg:text-lg",
        "leading-relaxed xs:leading-7 sm:leading-7 lg:leading-8",
        "text-pretty break-words",
        "rounded-xl xs:rounded-2xl sm:rounded-3xl",
        // Normal weight with italic - italic provides distinction
        "font-normal italic",
        "tracking-normal",
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
