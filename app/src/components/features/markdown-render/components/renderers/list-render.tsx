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
    "my-4 xs:my-5 sm:my-6",
    "ml-5 xs:ml-6 sm:ml-7 lg:ml-8",
    "space-y-2 xs:space-y-2.5 sm:space-y-3",
    "text-base xs:text-base sm:text-lg lg:text-xl",
    "leading-relaxed xs:leading-relaxed sm:leading-loose",
    "text-pretty break-words",
  ].join(" ");

  const listItemClasses = [
    "pl-1 xs:pl-1.5 sm:pl-2",
    "leading-7 xs:leading-8 sm:leading-9",
    "text-foreground/85",
    "break-words text-pretty",
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

  return <li {...props} className={listItemClasses} />;
};

export default ListRender;
