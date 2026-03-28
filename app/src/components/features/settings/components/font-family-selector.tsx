import React, { useCallback, useMemo } from 'react';

import { useReadingSettings } from '@/components/features/settings/store/reading-settings-store';
import { LabeledGroupSelect, type SelectOptionGroup } from '@/components/shared/labeled-select';
import { fontCategories, FontFamily, fontOptions } from '@/lib/font';
import { isFontLoaded, loadFont } from '@/lib/font-loader';

const categoryLabels = {
  'sans-serif': 'Sans-serif',
  serif: 'Serif',
  monospace: 'Monospace',
} as const;

const groups: SelectOptionGroup<FontFamily>[] = (['sans-serif', 'serif', 'monospace'] as const).map(
  (cat) => ({
    label: categoryLabels[cat],
    options: fontCategories[cat].map((f) => ({ value: f.value, label: f.label })),
  })
);

const FontFamilySelector: React.FC = () => {
  const { settings, setFontFamily } = useReadingSettings();
  const { fontFamily } = settings;

  const currentLabel = useMemo(
    () => fontOptions.find((f) => f.value === fontFamily)?.label ?? 'System UI',
    [fontFamily]
  );

  const handleHover = useCallback((value: FontFamily) => {
    if (!isFontLoaded(value)) {
      loadFont(value).catch(() => {});
    }
  }, []);

  return (
    <LabeledGroupSelect<FontFamily>
      label="Font Family"
      groups={groups}
      value={fontFamily}
      onChange={setFontFamily}
      displayValue={currentLabel}
      contentClassName="min-w-56 max-w-64"
      onItemHover={handleHover}
    />
  );
};

export default FontFamilySelector;
