import { useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { EditorView, lineNumbers, keymap } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { foldGutter, foldKeymap, indentOnInput } from '@codemirror/language';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { cn } from '@/lib/utils';
import {
  getCodeMirrorTheme,
  getThemeBackground,
} from '@/components/features/settings/store/codemirror-themes';
import { useCodeThemeStore } from '@/components/features/settings/store/code-theme';

interface MarkdownCodeMirrorEditorProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
}

const themeCompartment = new Compartment();

const MarkdownCodeMirrorEditor: React.FC<MarkdownCodeMirrorEditorProps> = memo(
  ({ content, onChange, className = '' }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<EditorView | null>(null);
    const prevThemeKey = useRef<string | null>(null);
    const isInternalUpdate = useRef(false);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const selectedTheme = useCodeThemeStore((state) => state.selectedTheme);

    const debouncedOnChange = useCallback(
      (newContent: string) => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
          onChange(newContent);
        }, 300);
      },
      [onChange]
    );

    const baseTheme = useMemo(
      () =>
        EditorView.theme({
          '&': {
            height: '100%',
            width: '100%',
            maxWidth: '100%',
            overflow: 'hidden',
            fontSize: '1rem',
            lineHeight: '1.75',
          },
          '.cm-scroller': {
            overflow: 'auto',
            fontFamily: '"Source Code Pro", "Fira Code", "Cascadia Code", monospace',
          },
          '.cm-content': {
            padding: '1.5rem 2rem',
            minHeight: '100%',
            caretColor: 'var(--primary)',
          },
          '.cm-gutters': {
            paddingLeft: '0.5rem',
            paddingRight: '0.25rem',
            borderRight: '1px solid var(--border)',
          },
          '.cm-lineNumbers .cm-gutterElement': {
            padding: '0 0.75rem 0 0.5rem',
            minWidth: '3rem',
            color: 'var(--muted-foreground)',
          },
          '.cm-foldGutter .cm-gutterElement': {
            padding: '0 0.5rem',
            fontSize: '1rem',
            lineHeight: '1.75',
            width: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
          '&.cm-focused': {
            outline: 'none',
          },
          '.cm-line': {
            padding: '0 0.5rem',
          },
          '.cm-activeLine': {
            backgroundColor: 'var(--accent)',
          },
          '.cm-activeLineGutter': {
            backgroundColor: 'var(--accent)',
          },
          '.cm-selectionBackground': {
            backgroundColor: 'var(--primary) !important',
            opacity: '0.3',
          },
          '&.cm-focused .cm-selectionBackground': {
            backgroundColor: 'var(--primary) !important',
            opacity: '0.3',
          },
          '.cm-cursor': {
            borderLeftColor: 'var(--primary)',
            borderLeftWidth: '2px',
          },
        }),
      []
    );

    const extensions = useMemo(() => {
      return [
        history(),
        indentOnInput(),
        markdown(),
        lineNumbers(),
        foldGutter({
          openText: '\u2304',
          closedText: '\u203A',
        }),
        EditorView.lineWrapping,
        keymap.of([...defaultKeymap, ...historyKeymap, ...foldKeymap]),
        baseTheme,
        themeCompartment.of(getCodeMirrorTheme(selectedTheme)),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !isInternalUpdate.current) {
            const newContent = update.state.doc.toString();
            debouncedOnChange(newContent);
          }
        }),
      ];
    }, [baseTheme, selectedTheme, debouncedOnChange]);

    // Initialize editor
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      if (editorRef.current) {
        editorRef.current.destroy();
      }

      const state = EditorState.create({
        doc: content,
        extensions,
      });

      const view = new EditorView({
        state,
        parent: container,
      });

      editorRef.current = view;
      prevThemeKey.current = selectedTheme;

      // Focus the editor
      view.focus();

      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        view.destroy();
        editorRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update content when it changes externally
    useEffect(() => {
      if (editorRef.current) {
        const currentContent = editorRef.current.state.doc.toString();
        if (currentContent !== content) {
          isInternalUpdate.current = true;
          const transaction = editorRef.current.state.update({
            changes: {
              from: 0,
              to: currentContent.length,
              insert: content,
            },
          });
          editorRef.current.dispatch(transaction);
          isInternalUpdate.current = false;
        }
      }
    }, [content]);

    // Update theme when it changes
    useEffect(() => {
      if (editorRef.current && prevThemeKey.current !== selectedTheme) {
        editorRef.current.dispatch({
          effects: themeCompartment.reconfigure(getCodeMirrorTheme(selectedTheme)),
        });
        prevThemeKey.current = selectedTheme;
      }
    }, [selectedTheme]);

    const backgroundColor = getThemeBackground(selectedTheme);

    return (
      <div
        ref={containerRef}
        className={cn('h-full w-full', className)}
        style={{ backgroundColor }}
      />
    );
  }
);

MarkdownCodeMirrorEditor.displayName = 'MarkdownCodeMirrorEditor';

export default MarkdownCodeMirrorEditor;
