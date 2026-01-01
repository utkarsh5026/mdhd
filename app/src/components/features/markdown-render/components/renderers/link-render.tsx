import React, { ComponentPropsWithoutRef } from 'react';

interface LinkRenderProps extends ComponentPropsWithoutRef<'a'> {
  children: React.ReactNode;
}

/**
 * LinkRender Component
 *
 * A functional React component that renders a hyperlink (`<a>` element) with
 * additional styling and accessibility features. This component is designed
 * to be used within a Markdown renderer to ensure that links are styled
 * consistently and behave correctly based on their target.
 *
 * Props:
 * - children (React.ReactNode): The content to be displayed inside the link.
 *   This can be text or any other React component.
 * - ...props (ComponentPropsWithoutRef<"a">): Any additional props that
 *   should be passed to the anchor element. This includes standard anchor
 *   attributes such as `href`, `title`, etc.
 *
 * The component automatically applies the following behaviors:
 * - If the `href` prop starts with "http", it sets the `target` attribute to
 *   "_blank", which opens the link in a new tab.
 * - It also sets the `rel` attribute to "noopener noreferrer" for security
 *   reasons when opening external links in a new tab.
 * - The `aria-label` attribute is conditionally set to improve accessibility.
 *   If there are no children, it uses the `title` prop or defaults to "Link".
 *
 * Usage:
 * ```jsx
 * <LinkRender href="https://example.com" title="Example Link">
 *   Click here to visit Example
 * </LinkRender>
 * ```
 */
const LinkRender: React.FC<LinkRenderProps> = ({ children, ...props }) => {
  return (
    <a
      {...props}
      className="text-primary hover:underline"
      target={props.href?.startsWith('http') ? '_blank' : undefined}
      rel={props.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      aria-label={children ? undefined : (props.title ?? 'Link')}
    >
      {children}
    </a>
  );
};

export default LinkRender;
