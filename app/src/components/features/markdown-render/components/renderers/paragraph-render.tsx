import React from 'react';

/**
 * ParagraphRender Component
 *
 * Renders paragraph elements with enhanced typography and spacing for optimal readability.
 * Features responsive design, improved visual hierarchy, and better reading comfort.
 * Optimized for both mobile and desktop viewing experiences with proper text flow.
 */
const ParagraphRender: React.FC<React.ComponentPropsWithoutRef<'p'>> = (props) => {
  // Enhanced paragraph styling for better readability
  const paragraphClasses = [
    // Improved contrast: 80% -> 92% for better readability while maintaining subtle softness
    'text-foreground/92',
    // Slightly reduced vertical margins for tighter content grouping
    'my-3 xs:my-4 sm:my-5 lg:my-6',
    // Optimized line heights - slightly reduced for denser, more book-like reading
    'leading-relaxed xs:leading-relaxed sm:leading-7 lg:leading-8',
    // Enhanced text rendering and flow
    'text-pretty break-words',
    // Refined font size scaling - cap at text-lg for comfortable reading
    'text-base xs:text-base sm:text-lg lg:text-lg',
    // Clean horizontal alignment
    'px-0',
    // Enhanced paragraph spacing for better visual hierarchy
    'first:mt-0 last:mb-0',
    // Normal tracking throughout - consistent letter spacing
    'tracking-normal',
    // Normal font weight for body text
    'font-normal',
  ].join(' ');

  return <p {...props} className={paragraphClasses} />;
};

export default ParagraphRender;
