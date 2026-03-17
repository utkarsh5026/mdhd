import React from 'react';

/**
 * HorizontalRuleRender Component
 *
 * Renders horizontal rule elements with consistent styling.
 */
const HorizontalRuleRender: React.FC<React.ComponentPropsWithoutRef<'hr'>> = ({
  className,
  ...props
}) => {
  return (
    <hr {...props} className={`my-8 border-t border-border${className ? ` ${className}` : ''}`} />
  );
};

export default HorizontalRuleRender;
