import type { StoreApi } from 'zustand';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { tryCatch } from '@/utils/functions/error';

const STORAGE_KEY = 'markdown-style';

/** Color treatment applied to all heading elements. */
export type HeadingColorStyle = 'none' | 'solid' | 'gradient';
/** Visual style applied to blockquote elements. */
export type BlockquoteStyle = 'border' | 'card' | 'minimal';
/** Bullet marker style for unordered lists. */
export type UnorderedListMarker = 'disc' | 'dash' | 'arrow' | 'none';
/** Counter style for ordered lists. */
export type OrderedListMarker = 'decimal' | 'roman' | 'alpha';
/** Visual container style applied to fenced code block (pre) wrappers. */
export type CodeBlockContainerStyle = 'rounded' | 'sharp' | 'bordered';
/** Color/background treatment for inline code spans. */
export type InlineCodeStyle = 'primary' | 'muted' | 'bordered' | 'ghost';
/** Border radius for inline code spans. */
export type InlineCodeShape = 'rounded' | 'pill' | 'sharp';

export interface MarkdownStyleSettings {
  headingColorStyle: HeadingColorStyle;
  blockquoteStyle: BlockquoteStyle;
  unorderedListMarker: UnorderedListMarker;
  orderedListMarker: OrderedListMarker;
  codeBlockContainerStyle: CodeBlockContainerStyle;
  inlineCodeStyle: InlineCodeStyle;
  inlineCodeShape: InlineCodeShape;
}

interface MarkdownStyleState {
  settings: MarkdownStyleSettings;
  setHeadingColorStyle: (style: HeadingColorStyle) => void;
  setBlockquoteStyle: (style: BlockquoteStyle) => void;
  setUnorderedListMarker: (marker: UnorderedListMarker) => void;
  setOrderedListMarker: (marker: OrderedListMarker) => void;
  setCodeBlockContainerStyle: (style: CodeBlockContainerStyle) => void;
  setInlineCodeStyle: (style: InlineCodeStyle) => void;
  setInlineCodeShape: (shape: InlineCodeShape) => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: MarkdownStyleSettings = {
  headingColorStyle: 'solid',
  blockquoteStyle: 'border',
  unorderedListMarker: 'disc',
  orderedListMarker: 'decimal',
  codeBlockContainerStyle: 'rounded',
  inlineCodeStyle: 'primary',
  inlineCodeShape: 'rounded',
};

const loadInitialSettings = (): MarkdownStyleSettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return DEFAULT_SETTINGS;
  const parsed = tryCatch(() => JSON.parse(saved) as Partial<MarkdownStyleSettings>, null);
  if (!parsed) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...parsed };
};

const patchSettings = (
  set: StoreApi<MarkdownStyleState>['setState'],
  update: Partial<MarkdownStyleSettings>
) =>
  set((state) => {
    const newSettings = { ...state.settings, ...update };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    return { settings: newSettings };
  });

export const useMarkdownStyleStore = create<MarkdownStyleState>((set) => ({
  settings: loadInitialSettings(),

  setHeadingColorStyle: (style) => patchSettings(set, { headingColorStyle: style }),
  setBlockquoteStyle: (style) => patchSettings(set, { blockquoteStyle: style }),
  setUnorderedListMarker: (marker) => patchSettings(set, { unorderedListMarker: marker }),
  setOrderedListMarker: (marker) => patchSettings(set, { orderedListMarker: marker }),
  setCodeBlockContainerStyle: (style) => patchSettings(set, { codeBlockContainerStyle: style }),
  setInlineCodeStyle: (style) => patchSettings(set, { inlineCodeStyle: style }),
  setInlineCodeShape: (shape) => patchSettings(set, { inlineCodeShape: shape }),

  resetSettings: () =>
    set(() => {
      localStorage.removeItem(STORAGE_KEY);
      return { settings: DEFAULT_SETTINGS };
    }),
}));

export const useMarkdownStyleSettings = () =>
  useMarkdownStyleStore(
    useShallow((s) => ({
      settings: s.settings,
      setHeadingColorStyle: s.setHeadingColorStyle,
      setBlockquoteStyle: s.setBlockquoteStyle,
      setUnorderedListMarker: s.setUnorderedListMarker,
      setOrderedListMarker: s.setOrderedListMarker,
      setCodeBlockContainerStyle: s.setCodeBlockContainerStyle,
      setInlineCodeStyle: s.setInlineCodeStyle,
      setInlineCodeShape: s.setInlineCodeShape,
      resetSettings: s.resetSettings,
    }))
  );
