import React from "react";

type ListProps =
  | { type: "ul"; props: React.ComponentPropsWithoutRef<"ul"> }
  | { type: "ol"; props: React.ComponentPropsWithoutRef<"ol"> }
  | { type: "li"; props: React.ComponentPropsWithoutRef<"li"> };

/**
 * ListRender Component
 *
 * Renders lists with enhanced typography and spacing for optimal readability.
 * Features responsive design, improved visual hierarchy, and better contrast.
 * Optimized for both mobile and desktop viewing experiences.
 */
const ListRender: React.FC<ListProps> = ({ type, props }) => {
  // Base classes for consistent styling across all list types
  const baseListClasses = [
    // Responsive margins for better spacing
    "my-4 xs:my-5 sm:my-6",
    // Responsive left margins for proper indentation
    "ml-5 xs:ml-6 sm:ml-7 lg:ml-8",
    // Improved spacing between list items
    "space-y-2 xs:space-y-2.5 sm:space-y-3",
    // Enhanced typography for better readability
    "text-base xs:text-base sm:text-lg lg:text-xl",
    // Better line height for reading comfort
    "leading-relaxed xs:leading-relaxed sm:leading-loose",
    // Improved text rendering
    "text-pretty break-words",
  ].join(" ");

  const listItemClasses = [
    // Enhanced padding for better visual separation
    "pl-1 xs:pl-1.5 sm:pl-2",
    // Improved line height for readability
    "leading-7 xs:leading-8 sm:leading-9",
    // Better text color and contrast
    "text-foreground/85",
    // Enhanced text rendering
    "break-words text-pretty",
    // Better margin between items
    "mb-1 xs:mb-1.5 sm:mb-2",
  ].join(" ");

  if (type === "ul") {
    return (
      <ul
        {...props}
        className={`${baseListClasses} list-disc marker:text-primary/60 text-foreground/80`}
      />
    );
  }

  if (type === "ol") {
    return (
      <ol
        {...props}
        className={`${baseListClasses} list-decimal marker:text-primary/60 marker:font-medium text-foreground/80`}
      />
    );
  }

  // List item rendering
  return <li {...props} className={listItemClasses} />;
};

export default ListRender;
