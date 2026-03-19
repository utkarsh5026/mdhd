import { foldGutter, foldKeymap } from '@codemirror/language';
import { Compartment, EditorState, RangeSet } from '@codemirror/state';
import { Decoration, EditorView, keymap, lineNumbers } from '@codemirror/view';
import { forwardRef, useEffect, useMemo, useRef } from 'react';

import type { ThemeKey } from '@/components/features/settings/store/code-theme';
import {
  getCodeMirrorTheme,
  getThemeBackground,
} from '@/components/features/settings/store/codemirror-themes';

import { loadLanguage } from '../../utils/language-loader';

interface CodeMirrorDisplayProps {
  code: string;
  language: string;
  themeKey: ThemeKey;
  isDialog?: boolean;
  className?: string;
  showLineNumbers?: boolean;
  enableCodeFolding?: boolean;
  enableWordWrap?: boolean;
  fontSize?: string;
  fontFamily?: string;
  fontLigatures?: boolean;
  lineHeightValue?: number;
  letterSpacing?: number;
  highlightedLines?: number[];
  highlightColor?: string;
  dimUnhighlighted?: boolean;
  dimOpacity?: number;
}

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
      fontSize,
      fontFamily,
      fontLigatures,
      lineHeightValue,
      letterSpacing,
      highlightedLines,
      highlightColor = 'rgba(255,255,100,0.15)',
      dimUnhighlighted = false,
      dimOpacity = 40,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<EditorView | null>(null);
    const prevThemeKey = useRef<ThemeKey | null>(null);
    const prevLanguage = useRef<string | null>(null);

    // Per-instance compartments so multiple editors don't corrupt each other
    const languageCompartment = useRef(new Compartment()).current;
    const themeCompartment = useRef(new Compartment()).current;

    const resolvedFontSize = isDialog ? '1rem' : (fontSize ?? '0.875rem');
    const resolvedFontFamily = fontFamily
      ? `"${fontFamily}", monospace`
      : '"Source Code Pro", "Fira Code", monospace';
    const resolvedLineHeight = lineHeightValue ? String(lineHeightValue) : isDialog ? '1.8' : '1.6';

    const baseTheme = useMemo(
      () =>
        EditorView.theme({
          '&': {
            height: '100%',
            width: '100%',
            maxWidth: '100%',
            overflow: 'hidden',
            fontSize: resolvedFontSize,
            lineHeight: resolvedLineHeight,
          },
          '.cm-scroller': {
            overflow: 'auto',
            fontFamily: resolvedFontFamily,
            fontFeatureSettings: fontLigatures === false ? '"liga" 0' : '"liga" 1',
            ...(letterSpacing ? { letterSpacing: `${letterSpacing}px` } : {}),
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
      [
        isDialog,
        resolvedFontSize,
        resolvedFontFamily,
        resolvedLineHeight,
        fontLigatures,
        letterSpacing,
      ]
    );

    const highlightExt = useMemo(() => {
      if (!highlightedLines || highlightedLines.length === 0) return [];
      const lineSet = new Set(highlightedLines);
      const highlightDeco = Decoration.line({
        attributes: { style: `background-color: ${highlightColor}` },
      });
      const dimDeco = Decoration.line({
        attributes: { style: `opacity: ${dimOpacity / 100}` },
      });
      return [
        EditorView.decorations.compute([], (state) => {
          const decos: import('@codemirror/state').Range<Decoration>[] = [];
          for (let i = 1; i <= state.doc.lines; i++) {
            const line = state.doc.line(i);
            if (lineSet.has(i)) {
              decos.push(highlightDeco.range(line.from));
            } else if (dimUnhighlighted) {
              decos.push(dimDeco.range(line.from));
            }
          }
          return RangeSet.of(decos);
        }),
      ];
    }, [highlightedLines, highlightColor, dimUnhighlighted, dimOpacity]);

    const extensions = useMemo(() => {
      const exts = [
        EditorState.readOnly.of(true),
        EditorView.editable.of(false),
        keymap.of(foldKeymap),
        baseTheme,
        themeCompartment.of(getCodeMirrorTheme(themeKey)),
        languageCompartment.of([]),
        ...highlightExt,
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
    }, [
      baseTheme,
      themeKey,
      showLineNumbers,
      enableCodeFolding,
      enableWordWrap,
      themeCompartment,
      languageCompartment,
      highlightExt,
    ]);

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

      // Capture view instance to avoid race condition — if the component
      // re-renders and destroys this view before the promise resolves,
      // we check against the captured reference, not editorRef.current.
      loadLanguage(language).then((langSupport) => {
        if (langSupport && editorRef.current === view) {
          view.dispatch({
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
    }, [themeKey, themeCompartment]);

    // Update language when it changes
    useEffect(() => {
      if (editorRef.current && prevLanguage.current !== language) {
        const currentView = editorRef.current;
        loadLanguage(language).then((langSupport) => {
          if (langSupport && editorRef.current === currentView) {
            currentView.dispatch({
              effects: languageCompartment.reconfigure(langSupport),
            });
          }
        });
        prevLanguage.current = language;
      }
    }, [language, languageCompartment]);

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
