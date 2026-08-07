import React, { ComponentPropsWithoutRef } from 'react';

import { isDocumentLink } from '@/services/markdown/links';

import { useDocumentLink } from '../../context/document-link-context';

interface LinkRenderProps extends ComponentPropsWithoutRef<'a'> {
  children?: React.ReactNode;
}

/** Schemes the renderer will emit an `href` for. Anything else is stripped. */
const SAFE_URL_PATTERN = /^(https?:\/\/|mailto:|#)/i;

/**
 * Anchors that stay useful inside a single-page reader.
 *
 * Three kinds of link are handled differently:
 *
 * - **External** (`https:`, `mailto:`) — opened in a new tab with
 *   `noopener noreferrer`.
 * - **Local documents** (`./setup.md`, `../api.md#usage`) — resolved against
 *   the containing document and opened as a tab. These are how a docs folder
 *   navigates itself, so they are intercepted rather than handed to the
 *   browser, which has no route that could serve them.
 * - **In-page fragments** (`#heading`) — left alone, to match the `id`s
 *   rehype-slug puts on headings.
 *
 * Unrecognised schemes (`javascript:`, `data:`) render without an href.
 */
const LinkRender: React.FC<LinkRenderProps> = ({ children, ...props }) => {
  const { openDocument } = useDocumentLink();
  const { href, onClick, title, ...rest } = props;

  const isLocalDocument = isDocumentLink(href);

  if (isLocalDocument) {
    // No host wiring (the public share view, for one) means there is no file
    // tree to resolve against. Showing plain text is more honest than a link
    // that silently does nothing.
    if (!openDocument || !href) {
      return (
        <span className="text-muted-foreground" title={`Unresolved link: ${href ?? ''}`}>
          {children}
        </span>
      );
    }

    // The app has no URL that maps to a stored document, so every click is
    // handled here — including modified ones, which would otherwise open a
    // new browser tab on a route that does not exist.
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      openDocument(href);
    };

    return (
      <a
        {...rest}
        href={href}
        title={title ?? href}
        onClick={handleClick}
        className="text-primary hover:underline"
      >
        {children}
      </a>
    );
  }

  const isSafe = !href || SAFE_URL_PATTERN.test(href);
  const safeHref = isSafe ? href : undefined;
  const isExternal = safeHref?.startsWith('http');

  return (
    <a
      {...rest}
      href={safeHref}
      title={title}
      onClick={onClick}
      className="text-primary hover:underline"
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      aria-label={children ? undefined : (title ?? 'Link')}
    >
      {children}
    </a>
  );
};

export default LinkRender;
