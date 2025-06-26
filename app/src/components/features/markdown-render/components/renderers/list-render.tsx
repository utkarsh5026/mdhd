import React from "react";

type ListProps =
  | { type: "ul"; props: React.ComponentPropsWithoutRef<"ul"> }
  | { type: "ol"; props: React.ComponentPropsWithoutRef<"ol"> }
  | { type: "li"; props: React.ComponentPropsWithoutRef<"li"> };

/**
 * ListRender Component
 *
 * Renders lists with responsive spacing and typography optimized for mobile devices.
 * Features adaptive margins, padding, and text sizing for improved readability.
 */
const ListRender: React.FC<ListProps> = ({ type, props }) => {
  if (type === "ul") {
    return (
      <ul
        {...props}
        className="my-3 xs:my-4 sm:my-5 ml-4 xs:ml-5 sm:ml-6 list-disc space-y-1 xs:space-y-1.5 sm:space-y-2 text-sm xs:text-base sm:text-lg"
      />
    );
  } else if (type === "ol") {
    return (
      <ol
        {...props}
        className="my-3 xs:my-4 sm:my-5 ml-4 xs:ml-5 sm:ml-6 list-decimal space-y-1 xs:space-y-1.5 sm:space-y-2 text-sm xs:text-base sm:text-lg"
      />
    );
  } else {
    return (
      <li
        {...props}
        className="pl-0.5 xs:pl-1 sm:pl-1 leading-6 xs:leading-7 sm:leading-8 text-foreground/80 break-words text-pretty"
      />
    );
  }
};

export default ListRender;
