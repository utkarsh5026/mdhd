export type LetterSpacing = 'tighter' | 'tight' | 'normal' | 'wide' | 'wider' | 'widest';
export type WordSpacing = 'tight' | 'normal' | 'wide' | 'wider';
export type ParagraphSpacing = 'compact' | 'normal' | 'relaxed' | 'spacious';
export type TextAlignment = 'left' | 'justify';
export type BodyFontWeight = 'light' | 'normal' | 'medium';
export type TextIndent = 'none' | 'small' | 'medium' | 'large';

export const LETTER_SPACING_CLASSES: Record<LetterSpacing, string> = {
  tighter: 'tracking-tighter',
  tight: 'tracking-tight',
  normal: 'tracking-normal',
  wide: 'tracking-wide',
  wider: 'tracking-wider',
  widest: 'tracking-widest',
};

export const WORD_SPACING_CLASSES: Record<WordSpacing, string> = {
  tight: '[word-spacing:-0.05em]',
  normal: '[word-spacing:0em]',
  wide: '[word-spacing:0.1em]',
  wider: '[word-spacing:0.2em]',
};

export const PARAGRAPH_SPACING_CLASSES: Record<ParagraphSpacing, string> = {
  compact: 'my-1.5 sm:my-2.5 lg:my-3',
  normal: 'my-3 sm:my-5 lg:my-6',
  relaxed: 'my-5 sm:my-7 lg:my-9',
  spacious: 'my-7 sm:my-10 lg:my-12',
};

export const TEXT_ALIGNMENT_CLASSES: Record<TextAlignment, string> = {
  left: 'text-left',
  justify: 'text-justify',
};

export const BODY_FONT_WEIGHT_CLASSES: Record<BodyFontWeight, string> = {
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
};

export const TEXT_INDENT_CLASSES: Record<TextIndent, string> = {
  none: '',
  small: 'indent-4',
  medium: 'indent-8',
  large: 'indent-12',
};
