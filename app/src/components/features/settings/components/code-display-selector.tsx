import { Settings2, Type } from 'lucide-react';
import React from 'react';

import CodeMirrorDisplay from '@/components/features/markdown-render/components/renderers/codemirror-display';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { loadFont } from '@/lib/font-loader';

import {
  CODE_FONT_OPTIONS,
  CODE_LETTER_SPACING_RANGE,
  CODE_LINE_HEIGHT_RANGE,
  type CodeDisplaySettings,
  type CodeFontOption,
  getCodeFontOption,
  useCodeDisplaySettingsStore,
} from '../store/code-display-settings';
import { useCodeThemeStore } from '../store/code-theme';
import { SelectableOption, SettingsHeader } from './settings-commons';

const sampleCode = `function greet(name: string) {
  const message = \`Hello, \${name}!\`;
  if (name !== '' && name.length >= 2) {
    console.log(message);
  }
  return message;
}

// Call the function with a very long argument that might need wrapping
greet("World");`;

interface ToggleSetting {
  title: string;
  description: string;
  settingKey: 'showLineNumbers' | 'enableCodeFolding' | 'enableWordWrap' | 'showLanguageLabel';
}

const TOGGLE_SETTINGS: ToggleSetting[] = [
  {
    title: 'Line Numbers',
    description: 'Show line numbers in code blocks',
    settingKey: 'showLineNumbers',
  },
  {
    title: 'Code Folding',
    description: 'Allow collapsing code sections',
    settingKey: 'enableCodeFolding',
  },
  {
    title: 'Word Wrap',
    description: 'Wrap long lines instead of scrolling',
    settingKey: 'enableWordWrap',
  },
  {
    title: 'Language Label',
    description: 'Show language name and icon',
    settingKey: 'showLanguageLabel',
  },
];

interface SliderRowProps {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  current: number;
  onChange: (value: number) => void;
}

/** A labelled slider with its current value shown on the right. */
const SliderRow: React.FC<SliderRowProps> = ({
  label,
  value,
  min,
  max,
  step,
  current,
  onChange,
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between px-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium tabular-nums">{value}</span>
    </div>
    <Slider
      min={min}
      max={max}
      step={step}
      value={[current]}
      onValueChange={([next]) => onChange(next)}
    />
  </div>
);

const CodeDisplaySelector: React.FC = () => {
  const settings = useCodeDisplaySettingsStore((s) => s.settings);
  const update = useCodeDisplaySettingsStore((s) => s.updateCodeDisplaySettings);
  const { selectedTheme } = useCodeThemeStore();

  const selectedFont = getCodeFontOption(settings.fontFamily);

  /**
   * Starts the webfont download on hover so the face is usually ready by the
   * time it is clicked, and the preview does not flash a fallback.
   */
  const preloadFont = (font: CodeFontOption) => {
    if (font.slug) loadFont(font.slug).catch(() => {});
  };

  const setToggle = (key: ToggleSetting['settingKey'], value: boolean) =>
    update({ [key]: value } as Partial<CodeDisplaySettings>);

  return (
    <div className="space-y-6 min-w-0 overflow-hidden">
      <SettingsHeader
        icon={<Settings2 className="h-4 w-4 text-primary" />}
        title="Code Display"
        description="Customize how code blocks appear"
      />

      {/* Font family */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <Type className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Code Font</span>
        </div>

        {CODE_FONT_OPTIONS.map((font) => (
          <SelectableOption
            key={font.value}
            title={font.label}
            description={font.description}
            isSelected={font.value === settings.fontFamily}
            onClick={() => update({ fontFamily: font.value })}
            onMouseEnter={() => preloadFont(font)}
          >
            <div
              className="mt-2 text-sm text-muted-foreground truncate"
              style={{
                fontFamily: /[,"]/.test(font.value) ? font.value : `"${font.value}", monospace`,
                fontFeatureSettings: settings.fontLigatures ? '"liga" 1' : '"liga" 0',
              }}
            >
              const sum = (a, b) =&gt; a !== b;
            </div>
          </SelectableOption>
        ))}
      </div>

      {/* Typography */}
      <div className="space-y-4">
        <SliderRow
          label="Line Height"
          value={settings.lineHeight.toFixed(1)}
          min={CODE_LINE_HEIGHT_RANGE.min}
          max={CODE_LINE_HEIGHT_RANGE.max}
          step={CODE_LINE_HEIGHT_RANGE.step}
          current={settings.lineHeight}
          onChange={(lineHeight) => update({ lineHeight })}
        />

        <SliderRow
          label="Letter Spacing"
          value={`${settings.letterSpacing.toFixed(1)}px`}
          min={CODE_LETTER_SPACING_RANGE.min}
          max={CODE_LETTER_SPACING_RANGE.max}
          step={CODE_LETTER_SPACING_RANGE.step}
          current={settings.letterSpacing}
          onChange={(letterSpacing) => update({ letterSpacing })}
        />
      </div>

      {/* Toggles */}
      <div className="-mx-2 text-sm">
        <div
          className="flex items-center justify-between px-2 py-2.5 rounded-xl cursor-pointer"
          onClick={() => update({ fontLigatures: !settings.fontLigatures })}
        >
          <div>
            <div className="text-sm font-medium leading-none mb-0.5">Ligatures</div>
            <div className="text-xs text-muted-foreground">
              {selectedFont.hasLigatures
                ? 'Join =>, !==, and -> into single glyphs'
                : `${selectedFont.label} has no ligatures`}
            </div>
          </div>
          <Switch
            checked={settings.fontLigatures}
            disabled={!selectedFont.hasLigatures}
            onCheckedChange={(checked) => update({ fontLigatures: checked })}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {TOGGLE_SETTINGS.map(({ title, description, settingKey }) => {
          const checked = settings[settingKey];
          return (
            <div
              key={settingKey}
              className="flex items-center justify-between px-2 py-2.5 rounded-xl cursor-pointer"
              onClick={() => setToggle(settingKey, !checked)}
            >
              <div>
                <div className="text-sm font-medium leading-none mb-0.5">{title}</div>
                <div className="text-xs text-muted-foreground">{description}</div>
              </div>
              <Switch
                checked={checked}
                onCheckedChange={(value) => setToggle(settingKey, value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          );
        })}
      </div>

      {/* Live Preview */}
      <div className="space-y-2 w-0 min-w-full overflow-hidden">
        <div className="text-xs text-muted-foreground px-1">Live Preview</div>
        <div className="rounded-2xl overflow-hidden w-full border border-border/20">
          <CodeMirrorDisplay
            code={sampleCode}
            language="typescript"
            themeKey={selectedTheme}
            showLineNumbers={settings.showLineNumbers}
            enableCodeFolding={settings.enableCodeFolding}
            enableWordWrap={settings.enableWordWrap}
            fontFamily={settings.fontFamily}
            fontLigatures={settings.fontLigatures}
            lineHeightValue={settings.lineHeight}
            letterSpacing={settings.letterSpacing}
            className="overflow-hidden"
            fontSize="0.8rem"
          />
        </div>
      </div>
    </div>
  );
};

export default CodeDisplaySelector;
