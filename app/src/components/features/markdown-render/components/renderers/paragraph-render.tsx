import React from "react";

/**
 * ParagraphRender Component
 *
 * Renders paragraph elements with enhanced typography and spacing for optimal readability.
 * Features responsive design, improved visual hierarchy, and better reading comfort.
 * Optimized for both mobile and desktop viewing experiences with proper text flow.
 */
const ParagraphRender: React.FC<React.ComponentPropsWithoutRef<"p">> = (
  props
) => {
  // Enhanced paragraph styling for better readability
  const paragraphClasses = [
    // Improved text color and contrast for better readability
    "text-foreground/80",
    // Enhanced responsive margins for better content separation
    "my-4 xs:my-5 sm:my-6 lg:my-7",
    // Optimized line heights for reading comfort across devices
    "leading-7 xs:leading-8 sm:leading-9 lg:leading-10",
    // Enhanced text rendering and flow
    "text-pretty break-words",
    // Improved responsive typography scaling
    "text-base xs:text-lg sm:text-xl lg:text-xl",
    // Better horizontal spacing - subtle padding on mobile, none on larger screens
    "px-0.5 xs:px-0",
    // Enhanced paragraph spacing for better visual hierarchy
    "first:mt-0 last:mb-0",
    // Improved text spacing and kerning
    "tracking-normal xs:tracking-wide",
    // Better font weight for enhanced readability
    "font-normal",
  ].join(" ");

  return <p {...props} className={paragraphClasses} />;
};

export default ParagraphRender;
