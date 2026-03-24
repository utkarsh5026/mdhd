import React from 'react';

import { codeThemes, type ThemeKey } from '@/components/features/settings/store/code-theme';
import { Switch } from '@/components/ui/switch';

import { type CodeImageExportSettings, defaultSettings } from '../../store/code-image-export-store';
import { CODE_KEYS, pickKeys } from '../../store/types';
import { FONT_FAMILIES } from '../constants';
import { CollapsibleSection, SelectRow, SliderRow } from './shared-controls';

export const CodeSection: React.FC<{
  settings: CodeImageExportSettings;
  updateSettings: (partial: Partial<CodeImageExportSettings>) => void;
}> = ({ settings, updateSettings }) => (
  <CollapsibleSection
    title="Code"
    onReset={() => updateSettings(pickKeys(defaultSettings, CODE_KEYS))}
  >
    <div className="space-y-4">
      <SelectRow
        label="Theme"
        value={settings.themeKey}
        onValueChange={(v) => updateSettings({ themeKey: v as ThemeKey })}
        options={[]}
        groups={Object.entries(codeThemes).map(([category, themes]) => ({
          label: category,
          options: Object.entries(themes).map(([key, theme]) => ({
            value: key,
            label: theme.name,
          })),
        }))}
      />

      <SelectRow
        label="Font family"
        value={settings.fontFamily}
        onValueChange={(v) => updateSettings({ fontFamily: v })}
        options={FONT_FAMILIES.map((f) => ({ value: f, label: f }))}
        renderItem={(opt) => (
          <span style={{ fontFamily: `"${opt.value}", monospace` }}>{opt.label}</span>
        )}
      />

      <SliderRow
        label="Font size"
        value={settings.fontSize}
        onChange={(v) => updateSettings({ fontSize: v })}
        min={12}
        max={24}
        step={1}
        unit="px"
      />

      <SliderRow
        label="Line height"
        value={settings.lineHeight}
        onChange={(v) => updateSettings({ lineHeight: v })}
        min={1}
        max={2.5}
        step={0.1}
      />

      <SliderRow
        label="Letter spacing"
        value={settings.letterSpacing}
        onChange={(v) => updateSettings({ letterSpacing: v })}
        min={-1}
        max={3}
        step={0.25}
        unit="px"
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Ligatures</span>
        <Switch
          checked={settings.fontLigatures}
          onCheckedChange={(v) => updateSettings({ fontLigatures: v })}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Line numbers</span>
        <Switch
          checked={settings.showLineNumbers}
          onCheckedChange={(v) => updateSettings({ showLineNumbers: v })}
        />
      </div>
    </div>
  </CollapsibleSection>
);
