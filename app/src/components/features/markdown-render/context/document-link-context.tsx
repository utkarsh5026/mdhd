import { createContext, type ReactNode, useContext } from 'react';

/**
 * Wiring that lets rendered markdown navigate to other documents.
 *
 * The renderer knows a link is relative but not what it points at — only the
 * host knows which document is open and how to open another. Consumers that
 * do not provide this context still render links, they just fall back to
 * default browser behaviour.
 */
export interface DocumentLinkContextValue {
  /** Absolute path of the document being rendered, e.g. `/docs/guide/setup.md`. */
  basePath?: string;
  /**
   * Opens a link that points at another local document.
   *
   * @param href - The href exactly as written in the markdown source.
   */
  openDocument?: (href: string) => void;
}

const DocumentLinkContext = createContext<DocumentLinkContextValue>({});

/**
 * Supplies the document path and open handler used to resolve relative links.
 */
export function DocumentLinkProvider({
  value,
  children,
}: {
  value: DocumentLinkContextValue;
  children: ReactNode;
}) {
  return <DocumentLinkContext.Provider value={value}>{children}</DocumentLinkContext.Provider>;
}

/**
 * Reads the active document-link wiring. Returns an empty object when no
 * provider is mounted, which disables in-app link resolution.
 */
export function useDocumentLink(): DocumentLinkContextValue {
  return useContext(DocumentLinkContext);
}
