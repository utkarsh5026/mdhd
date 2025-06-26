import React from "react";

type HeadingProps = React.ComponentPropsWithoutRef<"h1" | "h2" | "h3">;

interface HeadingRenderProps extends HeadingProps {
  level: 1 | 2 | 3;
}

/**
 * HeadingRender Component
 *
 * Renders h1, h2, and h3 headings with responsive typography and consistent spacing.
 * Optimized for mobile readability with fluid scaling and proper line heights.
 */
const HeadingRender: React.FC<HeadingRenderProps> = ({ level, ...props }) => {
  const headingStyles = {
    1: "text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold mt-6 xs:mt-8 sm:mt-10 mb-3 xs:mb-4 leading-tight xs:leading-tight sm:leading-normal",
    2: "text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-semibold mt-5 xs:mt-6 sm:mt-8 mb-2 xs:mb-3 leading-tight xs:leading-normal",
    3: "text-lg xs:text-xl sm:text-2xl lg:text-3xl font-medium mt-4 xs:mt-5 sm:mt-6 mb-2 xs:mb-3 leading-normal",
    4: "text-base xs:text-lg sm:text-xl lg:text-2xl font-normal mt-4 xs:mt-5 sm:mt-6 mb-2 xs:mb-3 leading-normal",
  };

  const className = `${headingStyles[level]} group text-primary/60 text-pretty break-words`;
  const HeadingTag = `h${level}` as React.ElementType;

  return (
    <HeadingTag {...props} className={className}>
      {props.children}
    </HeadingTag>
  );
};

export default HeadingRender;
