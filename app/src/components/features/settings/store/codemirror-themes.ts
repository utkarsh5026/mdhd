import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { tags } from '@lezer/highlight';

import type { ThemeKey } from './code-theme';

/**
 * Full color palette used to style a CodeMirror editor instance.
 *
 * Covers both the editor chrome (background, gutter, selection, caret) and
 * syntax token categories (keywords, strings, comments, etc.).
 */
interface ThemeColors {
  background: string;
  foreground: string;
  caret: string;
  selection: string;
  lineHighlight: string;
  gutterBackground: string;
  gutterForeground: string;
  keyword: string;
  string: string;
  number: string;
  comment: string;
  function: string;
  variable: string;
  operator: string;
  class: string;
  type: string;
  property: string;
  punctuation: string;
  boolean: string;
  constant: string;
  tag: string;
  attribute: string;
}

const themeColors: Record<string, ThemeColors> = {
  // Dark Themes
  vscDarkPlus: {
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    caret: '#aeafad',
    selection: '#264f78',
    lineHighlight: '#2a2d2e',
    gutterBackground: '#1e1e1e',
    gutterForeground: '#858585',
    keyword: '#569cd6',
    string: '#ce9178',
    number: '#b5cea8',
    comment: '#6a9955',
    function: '#dcdcaa',
    variable: '#9cdcfe',
    operator: '#d4d4d4',
    class: '#4ec9b0',
    type: '#4ec9b0',
    property: '#9cdcfe',
    punctuation: '#d4d4d4',
    boolean: '#569cd6',
    constant: '#4fc1ff',
    tag: '#569cd6',
    attribute: '#9cdcfe',
  },
  oneDark: {
    background: '#282c34',
    foreground: '#abb2bf',
    caret: '#528bff',
    selection: '#3e4451',
    lineHighlight: '#2c313c',
    gutterBackground: '#282c34',
    gutterForeground: '#636d83',
    keyword: '#c678dd',
    string: '#98c379',
    number: '#d19a66',
    comment: '#5c6370',
    function: '#61afef',
    variable: '#e06c75',
    operator: '#56b6c2',
    class: '#e5c07b',
    type: '#e5c07b',
    property: '#e06c75',
    punctuation: '#abb2bf',
    boolean: '#d19a66',
    constant: '#d19a66',
    tag: '#e06c75',
    attribute: '#d19a66',
  },
  atomDark: {
    background: '#1d1f21',
    foreground: '#c5c8c6',
    caret: '#c5c8c6',
    selection: '#373b41',
    lineHighlight: '#282a2e',
    gutterBackground: '#1d1f21',
    gutterForeground: '#767d84',
    keyword: '#b294bb',
    string: '#b5bd68',
    number: '#de935f',
    comment: '#969896',
    function: '#81a2be',
    variable: '#cc6666',
    operator: '#8abeb7',
    class: '#f0c674',
    type: '#f0c674',
    property: '#cc6666',
    punctuation: '#c5c8c6',
    boolean: '#de935f',
    constant: '#de935f',
    tag: '#cc6666',
    attribute: '#de935f',
  },
  dracula: {
    background: '#282a36',
    foreground: '#f8f8f2',
    caret: '#f8f8f2',
    selection: '#44475a',
    lineHighlight: '#44475a',
    gutterBackground: '#282a36',
    gutterForeground: '#6272a4',
    keyword: '#ff79c6',
    string: '#f1fa8c',
    number: '#bd93f9',
    comment: '#6272a4',
    function: '#50fa7b',
    variable: '#f8f8f2',
    operator: '#ff79c6',
    class: '#8be9fd',
    type: '#8be9fd',
    property: '#66d9ef',
    punctuation: '#f8f8f2',
    boolean: '#bd93f9',
    constant: '#bd93f9',
    tag: '#ff79c6',
    attribute: '#50fa7b',
  },

  githubDark: {
    background: '#0d1117',
    foreground: '#c9d1d9',
    caret: '#58a6ff',
    selection: '#264f78',
    lineHighlight: '#161b22',
    gutterBackground: '#0d1117',
    gutterForeground: '#6e7681',
    keyword: '#ff7b72',
    string: '#a5d6ff',
    number: '#79c0ff',
    comment: '#8b949e',
    function: '#d2a8ff',
    variable: '#ffa657',
    operator: '#ff7b72',
    class: '#7ee787',
    type: '#7ee787',
    property: '#79c0ff',
    punctuation: '#c9d1d9',
    boolean: '#79c0ff',
    constant: '#79c0ff',
    tag: '#7ee787',
    attribute: '#79c0ff',
  },
  nord: {
    background: '#2e3440',
    foreground: '#d8dee9',
    caret: '#d8dee9',
    selection: '#434c5e',
    lineHighlight: '#3b4252',
    gutterBackground: '#2e3440',
    gutterForeground: '#4c566a',
    keyword: '#81a1c1',
    string: '#a3be8c',
    number: '#b48ead',
    comment: '#616e88',
    function: '#88c0d0',
    variable: '#d8dee9',
    operator: '#81a1c1',
    class: '#8fbcbb',
    type: '#8fbcbb',
    property: '#d8dee9',
    punctuation: '#eceff4',
    boolean: '#81a1c1',
    constant: '#b48ead',
    tag: '#81a1c1',
    attribute: '#8fbcbb',
  },
  monokai: {
    background: '#272822',
    foreground: '#f8f8f2',
    caret: '#f8f8f0',
    selection: '#49483e',
    lineHighlight: '#3e3d32',
    gutterBackground: '#272822',
    gutterForeground: '#90908a',
    keyword: '#f92672',
    string: '#e6db74',
    number: '#ae81ff',
    comment: '#75715e',
    function: '#a6e22e',
    variable: '#f8f8f2',
    operator: '#f92672',
    class: '#a6e22e',
    type: '#66d9ef',
    property: '#66d9ef',
    punctuation: '#f8f8f2',
    boolean: '#ae81ff',
    constant: '#ae81ff',
    tag: '#f92672',
    attribute: '#a6e22e',
  },
  tokyoNight: {
    background: '#1a1b26',
    foreground: '#a9b1d6',
    caret: '#c0caf5',
    selection: '#33467c',
    lineHighlight: '#24283b',
    gutterBackground: '#1a1b26',
    gutterForeground: '#3b4261',
    keyword: '#bb9af7',
    string: '#9ece6a',
    number: '#ff9e64',
    comment: '#565f89',
    function: '#7aa2f7',
    variable: '#c0caf5',
    operator: '#89ddff',
    class: '#2ac3de',
    type: '#2ac3de',
    property: '#73daca',
    punctuation: '#a9b1d6',
    boolean: '#ff9e64',
    constant: '#ff9e64',
    tag: '#f7768e',
    attribute: '#bb9af7',
  },
  gruvboxDark: {
    background: '#282828',
    foreground: '#ebdbb2',
    caret: '#ebdbb2',
    selection: '#504945',
    lineHighlight: '#3c3836',
    gutterBackground: '#282828',
    gutterForeground: '#7c6f64',
    keyword: '#fb4934',
    string: '#b8bb26',
    number: '#d3869b',
    comment: '#928374',
    function: '#fabd2f',
    variable: '#83a598',
    operator: '#fe8019',
    class: '#fabd2f',
    type: '#fabd2f',
    property: '#83a598',
    punctuation: '#ebdbb2',
    boolean: '#d3869b',
    constant: '#d3869b',
    tag: '#8ec07c',
    attribute: '#fabd2f',
  },
  solarizedDark: {
    background: '#002b36',
    foreground: '#839496',
    caret: '#839496',
    selection: '#073642',
    lineHighlight: '#073642',
    gutterBackground: '#002b36',
    gutterForeground: '#586e75',
    keyword: '#859900',
    string: '#2aa198',
    number: '#d33682',
    comment: '#586e75',
    function: '#268bd2',
    variable: '#268bd2',
    operator: '#859900',
    class: '#b58900',
    type: '#b58900',
    property: '#268bd2',
    punctuation: '#839496',
    boolean: '#d33682',
    constant: '#cb4b16',
    tag: '#268bd2',
    attribute: '#b58900',
  },
  catppuccinMocha: {
    background: '#1e1e2e',
    foreground: '#cdd6f4',
    caret: '#f5e0dc',
    selection: '#414356',
    lineHighlight: '#313244',
    gutterBackground: '#1e1e2e',
    gutterForeground: '#6c7086',
    keyword: '#cba6f7',
    string: '#a6e3a1',
    number: '#fab387',
    comment: '#6c7086',
    function: '#89b4fa',
    variable: '#cdd6f4',
    operator: '#89dceb',
    class: '#f9e2af',
    type: '#f9e2af',
    property: '#89b4fa',
    punctuation: '#bac2de',
    boolean: '#fab387',
    constant: '#fab387',
    tag: '#f38ba8',
    attribute: '#f9e2af',
  },

  // Light Themes
  vs: {
    background: '#ffffff',
    foreground: '#000000',
    caret: '#000000',
    selection: '#add6ff',
    lineHighlight: '#f0f0f0',
    gutterBackground: '#ffffff',
    gutterForeground: '#237893',
    keyword: '#0000ff',
    string: '#a31515',
    number: '#098658',
    comment: '#008000',
    function: '#795e26',
    variable: '#001080',
    operator: '#000000',
    class: '#267f99',
    type: '#267f99',
    property: '#001080',
    punctuation: '#000000',
    boolean: '#0000ff',
    constant: '#0070c1',
    tag: '#800000',
    attribute: '#ff0000',
  },
  oneLight: {
    background: '#fafafa',
    foreground: '#383a42',
    caret: '#526fff',
    selection: '#e5e5e6',
    lineHighlight: '#f0f0f0',
    gutterBackground: '#fafafa',
    gutterForeground: '#9d9d9f',
    keyword: '#a626a4',
    string: '#50a14f',
    number: '#986801',
    comment: '#a0a1a7',
    function: '#4078f2',
    variable: '#e45649',
    operator: '#0184bc',
    class: '#c18401',
    type: '#c18401',
    property: '#e45649',
    punctuation: '#383a42',
    boolean: '#986801',
    constant: '#986801',
    tag: '#e45649',
    attribute: '#986801',
  },
  ghcolors: {
    background: '#ffffff',
    foreground: '#393a34',
    caret: '#393a34',
    selection: '#c8c8fa',
    lineHighlight: '#f6f8fa',
    gutterBackground: '#ffffff',
    gutterForeground: '#999988',
    keyword: '#d73a49',
    string: '#032f62',
    number: '#005cc5',
    comment: '#6a737d',
    function: '#6f42c1',
    variable: '#e36209',
    operator: '#d73a49',
    class: '#6f42c1',
    type: '#6f42c1',
    property: '#005cc5',
    punctuation: '#393a34',
    boolean: '#005cc5',
    constant: '#005cc5',
    tag: '#22863a',
    attribute: '#6f42c1',
  },
  prism: {
    background: '#f5f2f0',
    foreground: '#000000',
    caret: '#000000',
    selection: '#b3d4fc',
    lineHighlight: '#eeeeee',
    gutterBackground: '#f5f2f0',
    gutterForeground: '#999988',
    keyword: '#0077aa',
    string: '#669900',
    number: '#990055',
    comment: '#999988',
    function: '#dd4a68',
    variable: '#ee9900',
    operator: '#9a6e3a',
    class: '#dd4a68',
    type: '#dd4a68',
    property: '#ee9900',
    punctuation: '#999999',
    boolean: '#990055',
    constant: '#990055',
    tag: '#990055',
    attribute: '#669900',
  },
  solarizedLight: {
    background: '#fdf6e3',
    foreground: '#657b83',
    caret: '#657b83',
    selection: '#eee8d5',
    lineHighlight: '#eee8d5',
    gutterBackground: '#fdf6e3',
    gutterForeground: '#93a1a1',
    keyword: '#859900',
    string: '#2aa198',
    number: '#d33682',
    comment: '#93a1a1',
    function: '#268bd2',
    variable: '#268bd2',
    operator: '#859900',
    class: '#b58900',
    type: '#b58900',
    property: '#268bd2',
    punctuation: '#657b83',
    boolean: '#d33682',
    constant: '#cb4b16',
    tag: '#268bd2',
    attribute: '#b58900',
  },
  gruvboxLight: {
    background: '#fbf1c7',
    foreground: '#3c3836',
    caret: '#3c3836',
    selection: '#ebdbb2',
    lineHighlight: '#ebdbb2',
    gutterBackground: '#fbf1c7',
    gutterForeground: '#a89984',
    keyword: '#9d0006',
    string: '#79740e',
    number: '#8f3f71',
    comment: '#928374',
    function: '#b57614',
    variable: '#076678',
    operator: '#af3a03',
    class: '#b57614',
    type: '#b57614',
    property: '#076678',
    punctuation: '#3c3836',
    boolean: '#8f3f71',
    constant: '#8f3f71',
    tag: '#427b58',
    attribute: '#b57614',
  },
  catppuccinLatte: {
    background: '#eff1f5',
    foreground: '#4c4f69',
    caret: '#dc8a78',
    selection: '#ccd0da',
    lineHighlight: '#e6e9ef',
    gutterBackground: '#eff1f5',
    gutterForeground: '#9ca0b0',
    keyword: '#8839ef',
    string: '#40a02b',
    number: '#fe640b',
    comment: '#9ca0b0',
    function: '#1e66f5',
    variable: '#4c4f69',
    operator: '#04a5e5',
    class: '#df8e1d',
    type: '#df8e1d',
    property: '#1e66f5',
    punctuation: '#5c5f77',
    boolean: '#fe640b',
    constant: '#fe640b',
    tag: '#d20f39',
    attribute: '#df8e1d',
  },
};

/**
 * Builds a CodeMirror `Extension` from a `ThemeColors` palette.
 *
 * Combines an `EditorView.theme` (chrome styling) with a `HighlightStyle`
 * (syntax token colouring). The `dark` flag is derived automatically from
 * the background luminance so CodeMirror picks the correct base styles.
 *
 * @param colors - The palette to apply.
 * @returns A CodeMirror `Extension` array containing the editor theme and syntax highlighting.
 */
function createTheme(colors: ThemeColors): Extension {
  const isDark = isThemeDark(colors.background);

  const editorTheme = EditorView.theme(
    {
      '&': {
        color: colors.foreground,
        backgroundColor: colors.background,
      },
      '.cm-content': {
        caretColor: colors.caret,
      },
      '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: colors.caret,
      },
      '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
        {
          backgroundColor: colors.selection,
        },
      '.cm-activeLine': {
        backgroundColor: colors.lineHighlight,
      },
      '.cm-selectionMatch': {
        backgroundColor: colors.selection,
      },
      '&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket': {
        backgroundColor: colors.selection,
      },
      '.cm-gutters': {
        backgroundColor: colors.gutterBackground,
        color: colors.gutterForeground,
        border: 'none',
      },
      '.cm-activeLineGutter': {
        backgroundColor: colors.lineHighlight,
      },
      '.cm-foldPlaceholder': {
        backgroundColor: colors.selection,
        color: colors.foreground,
        border: 'none',
      },
    },
    { dark: isDark }
  );

  const highlightStyle = HighlightStyle.define([
    { tag: tags.keyword, color: colors.keyword },
    { tag: tags.operator, color: colors.operator },
    { tag: tags.special(tags.variableName), color: colors.variable },
    { tag: tags.typeName, color: colors.type },
    { tag: tags.className, color: colors.class },
    { tag: tags.definition(tags.typeName), color: colors.type },
    { tag: tags.tagName, color: colors.tag },
    { tag: tags.attributeName, color: colors.attribute },
    { tag: tags.string, color: colors.string },
    { tag: tags.regexp, color: colors.string },
    { tag: tags.escape, color: colors.string },
    { tag: tags.special(tags.string), color: colors.string },
    { tag: tags.number, color: colors.number },
    { tag: tags.bool, color: colors.boolean },
    { tag: tags.null, color: colors.constant },
    { tag: tags.atom, color: colors.constant },
    { tag: tags.comment, color: colors.comment, fontStyle: 'italic' },
    { tag: tags.lineComment, color: colors.comment, fontStyle: 'italic' },
    { tag: tags.blockComment, color: colors.comment, fontStyle: 'italic' },
    { tag: tags.docComment, color: colors.comment, fontStyle: 'italic' },
    { tag: tags.variableName, color: colors.variable },
    { tag: tags.function(tags.variableName), color: colors.function },
    { tag: tags.definition(tags.variableName), color: colors.variable },
    { tag: tags.definition(tags.function(tags.variableName)), color: colors.function },
    { tag: tags.propertyName, color: colors.property },
    { tag: tags.function(tags.propertyName), color: colors.function },
    { tag: tags.definition(tags.propertyName), color: colors.property },
    { tag: tags.self, color: colors.keyword },
    { tag: tags.controlKeyword, color: colors.keyword },
    { tag: tags.moduleKeyword, color: colors.keyword },
    { tag: tags.operatorKeyword, color: colors.operator },
    { tag: tags.punctuation, color: colors.punctuation },
    { tag: tags.bracket, color: colors.punctuation },
    { tag: tags.angleBracket, color: colors.punctuation },
    { tag: tags.squareBracket, color: colors.punctuation },
    { tag: tags.paren, color: colors.punctuation },
    { tag: tags.brace, color: colors.punctuation },
    { tag: tags.separator, color: colors.punctuation },
    { tag: tags.invalid, color: '#ff0000' },
    { tag: tags.meta, color: colors.comment },
    { tag: tags.labelName, color: colors.variable },
    { tag: tags.namespace, color: colors.type },
    { tag: tags.macroName, color: colors.function },
  ]);

  return [editorTheme, syntaxHighlighting(highlightStyle)];
}

/**
 * Returns `true` if a hex background color is perceptually dark.
 *
 * Uses the ITU-R BT.601 luminance formula (weighted RGB coefficients).
 * A luminance below 0.5 is considered dark.
 *
 * @param backgroundColor - A 6-digit hex color string (e.g. `'#1e1e1e'`).
 * @returns `true` when the color is dark, `false` when light.
 */
function isThemeDark(backgroundColor: string): boolean {
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

const themeExtensionCache = new Map<string, Extension>();

/**
 * Returns the CodeMirror `Extension` for the given theme key.
 *
 * Results are memoized in `themeExtensionCache` so the extension object is
 * stable across re-renders. Falls back to `vscDarkPlus` for unknown keys.
 *
 * @param themeKey - A valid `ThemeKey` identifying the desired theme.
 * @returns A cached CodeMirror `Extension` combining editor chrome and syntax highlighting.
 */
export function getCodeMirrorTheme(themeKey: ThemeKey): Extension {
  if (themeExtensionCache.has(themeKey)) {
    return themeExtensionCache.get(themeKey)!;
  }

  const colors = themeColors[themeKey] || themeColors.vscDarkPlus;
  const extension = createTheme(colors);
  themeExtensionCache.set(themeKey, extension);
  return extension;
}

/**
 * Returns the background hex color for the given theme key.
 *
 * Falls back to the `vscDarkPlus` background if the key is not found.
 *
 * @param themeKey - A valid `ThemeKey` identifying the desired theme.
 * @returns A hex color string (e.g. `'#1e1e1e'`).
 */
export function getThemeBackground(themeKey: ThemeKey): string {
  return themeColors[themeKey]?.background || themeColors.vscDarkPlus.background;
}

/**
 * Returns `true` if the given theme key resolves to a dark theme.
 *
 * Falls back to `vscDarkPlus` for unknown keys.
 *
 * @param themeKey - A valid `ThemeKey` identifying the desired theme.
 * @returns `true` when the theme's background is perceptually dark.
 */
export function isThemeKeyDark(themeKey: ThemeKey): boolean {
  const colors = themeColors[themeKey] || themeColors.vscDarkPlus;
  return isThemeDark(colors.background);
}
