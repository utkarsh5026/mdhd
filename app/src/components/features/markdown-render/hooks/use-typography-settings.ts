import { useShallow } from 'zustand/react/shallow';

import type {
  BodyFontWeight,
  LetterSpacing,
  ParagraphSpacing,
  TextAlignment,
  TextIndent,
  WordSpacing,
} from '@/components/features/settings/store/reading-settings-store';
import { useReadingSettingsStore } from '@/components/features/settings/store/reading-settings-store';

import type { TextSizeScale } from '../utils/text-size-classes';

/** Bundles letter/word/paragraph spacing — the three spacing axes. */
export const useSpacing = (): {
  letterSpacing: LetterSpacing;
  wordSpacing: WordSpacing;
  paragraphSpacing: ParagraphSpacing;
} =>
  useReadingSettingsStore(
    useShallow((s) => ({
      letterSpacing: s.settings.letterSpacing,
      wordSpacing: s.settings.wordSpacing,
      paragraphSpacing: s.settings.paragraphSpacing,
    }))
  );

/** Returns the active text size scale from reading settings. */
export const useTextSizeScale = (): TextSizeScale =>
  useReadingSettingsStore((s) => s.settings.textSizeScale);

/** Returns the active body font weight from reading settings. */
export const useBodyFontWeight = (): BodyFontWeight =>
  useReadingSettingsStore((s) => s.settings.bodyFontWeight);

/** Bundles text indent, alignment, and size scale — the three text-layout axes. */
export const useTextLayout = (): {
  textIndent: TextIndent;
  textAlignment: TextAlignment;
  textSizeScale: TextSizeScale;
} =>
  useReadingSettingsStore(
    useShallow((s) => ({
      textIndent: s.settings.textIndent,
      textAlignment: s.settings.textAlignment,
      textSizeScale: s.settings.textSizeScale,
    }))
  );

/**
 * Returns whether bionic reading mode is enabled.
 *
 * When `true`, the markdown renderer bolds the first few characters of each word to
 * guide the reader's eye and speed up reading.
 */
export const useBionicReading = (): boolean =>
  useReadingSettingsStore((s) => s.settings.bionicReading);

/**
 * Returns whether sentence-focus-on-hover is enabled.
 *
 * When `true`, hovering over a paragraph highlights the sentence under the cursor,
 * dimming surrounding text to reduce visual noise.
 */
export const useSentenceFocusOnHover = (): boolean =>
  useReadingSettingsStore((s) => s.settings.sentenceFocusOnHover);
