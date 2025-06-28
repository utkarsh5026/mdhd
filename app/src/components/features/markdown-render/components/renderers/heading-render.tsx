import React from "react";

type HeadingProps = React.ComponentPropsWithoutRef<"h1" | "h2" | "h3">;

interface HeadingRenderProps extends HeadingProps {
  level: 1 | 2 | 3;
}

/**
 * HeadingRender Component
 *
 * Renders h1, h2, and h3 headings with enhanced typography and visual hierarchy for optimal readability.
 * Features improved contrast, responsive scaling, and better spacing for clear content structure.
 * Optimized for both mobile and desktop viewing with consistent visual progression.
 */
const HeadingRender: React.FC<HeadingRenderProps> = ({ level, ...props }) => {
  const headingStyles = {
    1: [
      "text-lg xs:text-xl sm:text-2xl lg:text-3xl xl:text-3xl",
      "font-bold",
      "mt-8 xs:mt-10 sm:mt-12 lg:mt-16",
      "mb-4 xs:mb-5 sm:mb-6 lg:mb-8",
      "leading-tight xs:leading-tight sm:leading-tight lg:leading-none",
      "tracking-tight xs:tracking-tight sm:tracking-normal",
    ].join(" "),

    2: [
      "text-base xs:text-lg sm:text-xl lg:text-2xl xl:text-2xl",
      "font-semibold",
      "mt-7 xs:mt-8 sm:mt-10 lg:mt-12",
      "mb-3 xs:mb-4 sm:mb-5 lg:mb-6",
      "leading-tight xs:leading-tight sm:leading-normal lg:leading-tight",
      "tracking-tight xs:tracking-normal",
    ].join(" "),

    3: [
      "text-sm xs:text-base sm:text-lg lg:text-xl xl:text-xl",
      "font-medium",
      "mt-6 xs:mt-7 sm:mt-8 lg:mt-10",
      "mb-3 xs:mb-3 sm:mb-4 lg:mb-5",
      "leading-normal xs:leading-normal sm:leading-relaxed",
      "tracking-normal xs:tracking-wide",
    ].join(" "),
  };

  const sharedClasses = [
    "text-primary/85 font-bold",
    "text-pretty break-words",
    "group",
    "selection:bg-primary/20",
    "transition-colors duration-200",
    "hover:text-primary/85",
    "scroll-mt-20",
    "font-feature-settings: 'kern' 1, 'liga' 1",
  ].join(" ");

  const className = `${headingStyles[level]} ${sharedClasses}`;
  const HeadingTag = `h${level}` as React.ElementType;

  return (
    <HeadingTag {...props} className={className}>
      {props.children}
    </HeadingTag>
  );
};

export default HeadingRender;
