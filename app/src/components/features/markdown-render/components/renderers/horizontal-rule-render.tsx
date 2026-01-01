import React from 'react';

/**
 * HorizontalRuleRender Component
 *
 * Renders horizontal rule elements with consistent styling.
 */
const HorizontalRuleRender: React.FC<React.ComponentPropsWithoutRef<'hr'>> = (props) => {
  return <hr {...props} className="my-8 border-t border-[#222222]" />;
};

export default HorizontalRuleRender;
