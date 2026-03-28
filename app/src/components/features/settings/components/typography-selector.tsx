import { ALargeSmall } from 'lucide-react';
import React from 'react';

import type {
  BodyFontWeight,
  LetterSpacing,
  ParagraphSpacing,
  TextAlignment,
  TextIndent,
  WordSpacing,
} from '@/components/features/markdown-render/utils/typography-classes';
import type { SelectOption } from '@/components/shared/labeled-select';
import { LabeledSelect } from '@/components/shared/labeled-select';

import { useReadingSettingsStore } from '../store/reading-settings-store';
import { SettingsHeader } from './settings-commons';

const LETTER_SPACING: SelectOption<LetterSpacing>[] = [
  { value: 'tighter', label: 'Tighter' },
  { value: 'tight', label: 'Tight' },
  { value: 'normal', label: 'Normal' },
  { value: 'wide', label: 'Wide' },
  { value: 'wider', label: 'Wider' },
  { value: 'widest', label: 'Widest' },
];

const WORD_SPACING: SelectOption<WordSpacing>[] = [
  { value: 'tight', label: 'Tight' },
  { value: 'normal', label: 'Normal' },
  { value: 'wide', label: 'Wide' },
  { value: 'wider', label: 'Wider' },
];

const PARAGRAPH_SPACING: SelectOption<ParagraphSpacing>[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'normal', label: 'Normal' },
  { value: 'relaxed', label: 'Relaxed' },
  { value: 'spacious', label: 'Spacious' },
];

const ALIGNMENT: SelectOption<TextAlignment>[] = [
  { value: 'left', label: 'Left' },
  { value: 'justify', label: 'Justify' },
];

const FONT_WEIGHT: SelectOption<BodyFontWeight>[] = [
  { value: 'light', label: 'Light' },
  { value: 'normal', label: 'Normal' },
  { value: 'medium', label: 'Medium' },
];

const TEXT_INDENT: SelectOption<TextIndent>[] = [
  { value: 'none', label: 'None' },
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

const TypographySelector: React.FC = () => {
  const letterSpacing = useReadingSettingsStore((s) => s.settings.letterSpacing);
  const setLetterSpacing = useReadingSettingsStore((s) => s.setLetterSpacing);
  const wordSpacing = useReadingSettingsStore((s) => s.settings.wordSpacing);
  const setWordSpacing = useReadingSettingsStore((s) => s.setWordSpacing);
  const paragraphSpacing = useReadingSettingsStore((s) => s.settings.paragraphSpacing);
  const setParagraphSpacing = useReadingSettingsStore((s) => s.setParagraphSpacing);
  const textAlignment = useReadingSettingsStore((s) => s.settings.textAlignment);
  const setTextAlignment = useReadingSettingsStore((s) => s.setTextAlignment);
  const bodyFontWeight = useReadingSettingsStore((s) => s.settings.bodyFontWeight);
  const setBodyFontWeight = useReadingSettingsStore((s) => s.setBodyFontWeight);
  const textIndent = useReadingSettingsStore((s) => s.settings.textIndent);
  const setTextIndent = useReadingSettingsStore((s) => s.setTextIndent);

  return (
    <div className="space-y-4">
      <SettingsHeader
        icon={<ALargeSmall className="h-4 w-4 text-primary" />}
        title="Typography"
        description="Fine-tune text appearance"
      />

      <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">
          Spacing
        </p>
        <div className="space-y-2.5">
          <LabeledSelect
            label="Letters"
            options={LETTER_SPACING}
            value={letterSpacing}
            onChange={setLetterSpacing}
          />
          <LabeledSelect
            label="Words"
            options={WORD_SPACING}
            value={wordSpacing}
            onChange={setWordSpacing}
          />
          <LabeledSelect
            label="Paragraphs"
            options={PARAGRAPH_SPACING}
            value={paragraphSpacing}
            onChange={setParagraphSpacing}
          />
        </div>
      </div>

      <div className="border-t border-border/10 pt-3 space-y-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">
          Text
        </p>
        <div className="space-y-2.5">
          <LabeledSelect
            label="Alignment"
            options={ALIGNMENT}
            value={textAlignment}
            onChange={setTextAlignment}
          />
          <LabeledSelect
            label="Weight"
            options={FONT_WEIGHT}
            value={bodyFontWeight}
            onChange={setBodyFontWeight}
          />
          <LabeledSelect
            label="Indent"
            options={TEXT_INDENT}
            value={textIndent}
            onChange={setTextIndent}
          />
        </div>
      </div>
    </div>
  );
};

export default TypographySelector;
