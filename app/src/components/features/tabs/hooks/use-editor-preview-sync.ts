import { EditorView } from '@codemirror/view';
import { useCallback, useRef } from 'react';

import { findSectionByLine } from '@/services/section/queries';
import type { MarkdownSection } from '@/services/section/types';

const SYNC_LOCK_TIMEOUT = 150;

interface UseEditorPreviewSyncOptions {
  sections: MarkdownSection[];
  currentIndex: number;
  readingMode: 'card' | 'scroll';
  changeSection: (index: number) => void;
  viewMode: 'preview' | 'edit' | 'dual';
}

export function useEditorPreviewSync({
  sections,
  currentIndex,
  readingMode,
  changeSection,
  viewMode,
}: UseEditorPreviewSyncOptions) {
  const editorViewRef = useRef<EditorView | null>(null);
  const syncLock = useRef<'editor' | 'preview' | null>(null);
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const acquireLock = useCallback((direction: 'editor' | 'preview') => {
    if (lockTimer.current) clearTimeout(lockTimer.current);
    syncLock.current = direction;
    lockTimer.current = setTimeout(() => {
      syncLock.current = null;
    }, SYNC_LOCK_TIMEOUT);
  }, []);

  const handleCursorActivity = useCallback(
    (line: number) => {
      if (viewMode !== 'dual' || syncLock.current === 'preview' || sections.length === 0) return;

      acquireLock('editor');
      const sectionIndex = findSectionByLine(line, sections);

      if (readingMode === 'scroll') {
        const section = sections[sectionIndex];
        if (section) {
          const el = document.getElementById(`section-${section.id}`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        if (sectionIndex !== currentIndex) {
          changeSection(sectionIndex);
        }
      }
    },
    [viewMode, sections, readingMode, currentIndex, changeSection, acquireLock]
  );

  const handleEditorScroll = useCallback(
    (firstVisibleLine: number) => {
      if (viewMode !== 'dual' || syncLock.current === 'preview' || sections.length === 0) return;

      acquireLock('editor');
      const sectionIndex = findSectionByLine(firstVisibleLine, sections);

      if (readingMode === 'scroll') {
        const section = sections[sectionIndex];
        if (section) {
          const el = document.getElementById(`section-${section.id}`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        if (sectionIndex !== currentIndex) {
          changeSection(sectionIndex);
        }
      }
    },
    [viewMode, sections, readingMode, currentIndex, changeSection, acquireLock]
  );

  const handlePreviewSectionClick = useCallback(
    (sectionIndex: number) => {
      if (viewMode !== 'dual' || sections.length === 0) return;

      const editor = editorViewRef.current;
      if (!editor) return;

      acquireLock('preview');
      const section = sections[sectionIndex];
      if (!section) return;

      const lineNumber = section.startLine + 1; // CodeMirror is 1-based
      const totalLines = editor.state.doc.lines;
      if (lineNumber > totalLines) return;

      const pos = editor.state.doc.line(lineNumber).from;
      editor.dispatch({
        selection: { anchor: pos },
        effects: EditorView.scrollIntoView(pos, { y: 'start' }),
      });
      editor.focus();
    },
    [viewMode, sections, acquireLock]
  );

  const scrollEditorToSection = useCallback(
    (sectionIndex: number) => {
      const editor = editorViewRef.current;
      if (!editor || sections.length === 0) return;

      const section = sections[sectionIndex];
      if (!section) return;

      acquireLock('preview');
      const lineNumber = section.startLine + 1;
      const totalLines = editor.state.doc.lines;
      if (lineNumber > totalLines) return;

      const pos = editor.state.doc.line(lineNumber).from;
      editor.dispatch({
        effects: EditorView.scrollIntoView(pos, { y: 'start' }),
      });
    },
    [sections, acquireLock]
  );

  return {
    editorViewRef,
    handleCursorActivity,
    handleEditorScroll,
    handlePreviewSectionClick,
    scrollEditorToSection,
  };
}
