import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { Extension } from '@codemirror/state';
import type { ThemeKey } from './code-theme';

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
};

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
        fontFamily: '"Source Code Pro", "Fira Code", monospace',
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

function isThemeDark(backgroundColor: string): boolean {
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

const themeExtensionCache = new Map<string, Extension>();

export function getCodeMirrorTheme(themeKey: ThemeKey): Extension {
  if (themeExtensionCache.has(themeKey)) {
    return themeExtensionCache.get(themeKey)!;
  }

  const colors = themeColors[themeKey] || themeColors.vscDarkPlus;
  const extension = createTheme(colors);
  themeExtensionCache.set(themeKey, extension);
  return extension;
}

export function getThemeBackground(themeKey: ThemeKey): string {
  return themeColors[themeKey]?.background || themeColors.vscDarkPlus.background;
}

export function isThemeKeyDark(themeKey: ThemeKey): boolean {
  const colors = themeColors[themeKey] || themeColors.vscDarkPlus;
  return isThemeDark(colors.background);
}
