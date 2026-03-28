import React, { useMemo } from 'react';

import {
  codeThemes,
  type ThemeKey,
  useCodeThemeStore,
} from '@/components/features/settings/store/code-theme';
import { LabeledGroupSelect, type SelectOptionGroup } from '@/components/shared/labeled-select';

const groups: SelectOptionGroup<ThemeKey>[] = Object.entries(codeThemes).map(
  ([categoryName, themes]) => ({
    label: categoryName,
    options: Object.entries(themes).map(([key, theme]) => ({
      value: key as ThemeKey,
      label: theme.name,
    })),
  })
);

const CodeThemeSelector: React.FC = () => {
  const { selectedTheme, setTheme, getCurrentThemeName } = useCodeThemeStore();

  const displayValue = useMemo(() => getCurrentThemeName(), [getCurrentThemeName]);

  return (
    <LabeledGroupSelect<ThemeKey>
      label="Code Theme"
      groups={groups}
      value={selectedTheme}
      onChange={setTheme}
      displayValue={displayValue}
    />
  );
};

export default CodeThemeSelector;
