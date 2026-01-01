import { useEffect, useRef, useMemo, forwardRef } from 'react';
import { EditorView, lineNumbers, keymap } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { foldGutter, foldKeymap, indentOnInput } from '@codemirror/language';
import { defaultKeymap } from '@codemirror/commands';
import { loadLanguage } from '../../utils/language-loader';
import {
  getCodeMirrorTheme,
  getThemeBackground,
} from '@/components/features/settings/store/codemirror-themes';
import type { ThemeKey } from '@/components/features/settings/store/code-theme';

interface CodeMirrorDisplayProps {
  code: string;
  language: string;
  themeKey: ThemeKey;
  isDialog?: boolean;
  className?: string;
  showLineNumbers?: boolean;
  enableCodeFolding?: boolean;
  enableWordWrap?: boolean;
}

const languageCompartment = new Compartment();
const themeCompartment = new Compartment();

const CodeMirrorDisplay = forwardRef<HTMLDivElement, CodeMirrorDisplayProps>(
  (
    {
      code,
      language,
      themeKey,
      isDialog = false,
      className = '',
      showLineNumbers = true,
      enableCodeFolding = true,
      enableWordWrap = false,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<EditorView | null>(null);
    const prevThemeKey = useRef<ThemeKey | null>(null);
    const prevLanguage = useRef<string | null>(null);

    const baseTheme = useMemo(
      () =>
        EditorView.theme({
          '&': {
            height: '100%',
            width: '100%',
            maxWidth: '100%',
            overflow: 'hidden',
            fontSize: isDialog ? '1rem' : '0.875rem',
            lineHeight: isDialog ? '1.8' : '1.6',
          },
          '.cm-scroller': {
            overflow: 'auto',
            fontFamily: '"Source Code Pro", "Fira Code", monospace',
          },
          '.cm-content': {
            padding: isDialog ? '1.5rem' : '1rem',
            minHeight: 'auto',
          },
          '.cm-gutters': {
            paddingLeft: '0.5rem',
            paddingRight: '0.25rem',
          },
          '.cm-lineNumbers .cm-gutterElement': {
            padding: '0 0.75rem 0 0.5rem',
            minWidth: '2.5rem',
          },
          '.cm-foldGutter .cm-gutterElement': {
            padding: '0 0.5rem',
            fontSize: isDialog ? '1.1rem' : '0.95rem',
            lineHeight: isDialog ? '1.8' : '1.6',
            width: isDialog ? '1.5rem' : '1.25rem',
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
        }),
      [isDialog]
    );

    const extensions = useMemo(() => {
      const exts = [
        EditorState.readOnly.of(true),
        EditorView.editable.of(false),
        indentOnInput(),
        keymap.of([...defaultKeymap, ...foldKeymap]),
        baseTheme,
        themeCompartment.of(getCodeMirrorTheme(themeKey)),
        languageCompartment.of([]),
      ];

      if (showLineNumbers) {
        exts.push(lineNumbers());
      }

      if (enableCodeFolding) {
        exts.push(
          foldGutter({
            openText: '⌄',
            closedText: '›',
          })
        );
      }

      if (enableWordWrap) {
        exts.push(EditorView.lineWrapping);
      }

      return exts;
    }, [baseTheme, themeKey, showLineNumbers, enableCodeFolding, enableWordWrap]);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      if (editorRef.current) {
        editorRef.current.destroy();
      }

      const state = EditorState.create({
        doc: code,
        extensions,
      });

      const view = new EditorView({
        state,
        parent: container,
      });

      editorRef.current = view;
      prevThemeKey.current = themeKey;
      prevLanguage.current = language;

      loadLanguage(language).then((langSupport) => {
        if (langSupport && editorRef.current) {
          editorRef.current.dispatch({
            effects: languageCompartment.reconfigure(langSupport),
          });
        }
      });

      return () => {
        view.destroy();
        editorRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [code, extensions]);

    // Update theme when it changes
    useEffect(() => {
      if (editorRef.current && prevThemeKey.current !== themeKey) {
        editorRef.current.dispatch({
          effects: themeCompartment.reconfigure(getCodeMirrorTheme(themeKey)),
        });
        prevThemeKey.current = themeKey;
      }
    }, [themeKey]);

    // Update language when it changes
    useEffect(() => {
      if (editorRef.current && prevLanguage.current !== language) {
        loadLanguage(language).then((langSupport) => {
          if (langSupport && editorRef.current) {
            editorRef.current.dispatch({
              effects: languageCompartment.reconfigure(langSupport),
            });
          }
        });
        prevLanguage.current = language;
      }
    }, [language]);

    const backgroundColor = getThemeBackground(themeKey);

    return (
      <div
        ref={(node) => {
          containerRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        className={`code-capture-container ${className}`}
        style={{ backgroundColor, width: '100%', minWidth: 0, overflow: 'hidden' }}
      />
    );
  }
);

CodeMirrorDisplay.displayName = 'CodeMirrorDisplay';

export default CodeMirrorDisplay;
