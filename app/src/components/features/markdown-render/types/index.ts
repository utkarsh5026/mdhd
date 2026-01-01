export type ComponentType =
  | 'code'
  | 'table'
  | 'blockquote'
  | 'list'
  | 'paragraph'
  | 'heading'
  | 'image'
  | 'section';

export interface ComponentSelection {
  id: string;
  type: ComponentType;
  title: string;
  content: string; // The actual text/code content
  sectionId: string; // Which section this belongs to
  sectionTitle: string;

  metadata?: {
    language?: string; // For code blocks
    level?: number; // For headings
    alt?: string; // For images
    href?: string; // For links
  };
}

// Simple context for chat
export interface ChatContext {
  selections: ComponentSelection[];
  currentSection?: {
    id: string;
    title: string;
  };
}
