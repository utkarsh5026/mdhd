const NOTES_MARKER = '<!-- notes -->';

export interface SlideContent {
  slideMarkdown: string;
  notes: string;
}

/**
 * Splits a section's markdown content into slide content and presenter notes.
 * Notes are delimited by an HTML comment: <!-- notes -->
 * Everything after the marker becomes presenter notes (invisible in normal rendering).
 */
export function parsePresenterNotes(content: string): SlideContent {
  const idx = content.indexOf(NOTES_MARKER);
  if (idx === -1) {
    return { slideMarkdown: content, notes: '' };
  }
  return {
    slideMarkdown: content.slice(0, idx).trim(),
    notes: content.slice(idx + NOTES_MARKER.length).trim(),
  };
}
