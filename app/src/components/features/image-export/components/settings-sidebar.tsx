import { Bookmark, ImagePlus, Save, Trash2 } from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react';

import { codeThemes, type ThemeKey } from '@/components/features/settings/store/code-theme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

import type { CodeImageExportSettings, SavedPreset } from '../store/code-image-export-store';
import {
  ASPECT_RATIOS,
  FONT_FAMILIES,
  GRADIENT_PRESETS,
  HIGHLIGHT_COLOR_PRESETS,
  IMAGE_FIT_OPTIONS,
  WATERMARK_POSITIONS,
  WINDOW_STYLES,
} from './constants';
import {
  ColorSwatchGrid,
  SectionLabel,
  SelectRow,
  SliderRow,
  ToggleGroup,
} from './shared-controls';

const PresetsSection: React.FC<{
  presets: SavedPreset[];
  onLoad: (name: string) => void;
  onDelete: (name: string) => void;
  onSave: (name: string) => void;
}> = ({ presets, onLoad, onDelete, onSave }) => {
  const [presetName, setPresetName] = useState('');

  const handleSave = useCallback(() => {
    const name = presetName.trim();
    if (!name) return;
    onSave(name);
    setPresetName('');
  }, [presetName, onSave]);

  return (
    <div className="rounded-2xl bg-muted/20 p-4">
      <SectionLabel>Presets</SectionLabel>
      <div className="space-y-2">
        {presets.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <div
                key={p.name}
                className="flex items-center gap-0.5 rounded-lg bg-background/80 border border-border/40 pr-0.5 transition-colors hover:border-border/70"
              >
                <button
                  className="text-xs px-2.5 py-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-1.5"
                  onClick={() => onLoad(p.name)}
                  title={`Load "${p.name}"`}
                >
                  <Bookmark className="w-3 h-3 shrink-0" />
                  {p.name}
                </button>
                <button
                  className="p-1 rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  onClick={() => onDelete(p.name)}
                  title={`Delete "${p.name}"`}
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-1.5">
          <Input
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Preset name..."
            className="h-7 text-xs flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2.5 gap-1 text-xs cursor-pointer"
            onClick={handleSave}
            disabled={!presetName.trim()}
          >
            <Save className="w-3 h-3" />
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

const BackgroundSection: React.FC<{
  settings: CodeImageExportSettings;
  updateSettings: (partial: Partial<CodeImageExportSettings>) => void;
}> = ({ settings, updateSettings }) => {
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        updateSettings({
          backgroundType: 'image',
          backgroundImage: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    },
    [updateSettings]
  );

  return (
    <div className="rounded-2xl bg-muted/20 p-4">
      <SectionLabel>Background</SectionLabel>

      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-muted-foreground">Transparent</span>
        <Switch
          checked={settings.transparentBackground}
          onCheckedChange={(v) => updateSettings({ transparentBackground: v })}
        />
      </div>

      {!settings.transparentBackground && (
        <>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {GRADIENT_PRESETS.map((preset) => (
              <button
                key={preset.name}
                className={cn(
                  'w-6 h-6 rounded cursor-pointer transition-all duration-200 border-2 shadow-sm',
                  settings.backgroundColor === preset.from &&
                    settings.backgroundColorEnd === preset.to
                    ? 'border-primary ring-2 ring-primary/25 scale-110'
                    : 'border-transparent hover:scale-110 hover:shadow-md'
                )}
                style={{
                  background: `linear-gradient(${preset.angle}deg, ${preset.from}, ${preset.to})`,
                }}
                onClick={() =>
                  updateSettings({
                    backgroundType: 'gradient',
                    backgroundColor: preset.from,
                    backgroundColorEnd: preset.to,
                    gradientAngle: preset.angle,
                  })
                }
                title={preset.name}
              />
            ))}
          </div>

          <div className="mb-4">
            <ToggleGroup
              options={[
                { value: 'gradient', label: 'Gradient' },
                { value: 'solid', label: 'Solid' },
                { value: 'image', label: 'Image' },
              ]}
              value={settings.backgroundType}
              onChange={(v) =>
                updateSettings({
                  backgroundType: v as 'gradient' | 'solid' | 'image',
                })
              }
            />
          </div>

          {settings.backgroundType !== 'image' && (
            <>
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  {settings.backgroundType === 'gradient' ? 'Start color' : 'Color'}
                </div>
                <ColorSwatchGrid
                  selected={settings.backgroundColor}
                  onSelect={(color) => updateSettings({ backgroundColor: color })}
                />
              </div>

              {settings.backgroundType === 'gradient' && (
                <>
                  <div className="space-y-2 mt-4">
                    <div className="text-xs text-muted-foreground">End color</div>
                    <ColorSwatchGrid
                      selected={settings.backgroundColorEnd}
                      onSelect={(color) => updateSettings({ backgroundColorEnd: color })}
                    />
                  </div>

                  <div className="mt-3">
                    <SliderRow
                      label="Angle"
                      value={settings.gradientAngle}
                      onChange={(v) => updateSettings({ gradientAngle: v })}
                      min={0}
                      max={360}
                      step={15}
                      unit="°"
                    />
                  </div>
                </>
              )}
            </>
          )}

          {settings.backgroundType === 'image' && (
            <div className="space-y-4">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />

              {settings.backgroundImage ? (
                <div className="space-y-4">
                  <div className="relative rounded-lg overflow-hidden border border-border/50">
                    <img
                      src={settings.backgroundImage}
                      alt="Background preview"
                      className="w-full h-20 object-cover"
                    />
                    <button
                      className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
                      onClick={() => updateSettings({ backgroundImage: '' })}
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 text-xs cursor-pointer"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <ImagePlus className="w-3.5 h-3.5" />
                    Replace Image
                  </Button>

                  <div>
                    <div className="text-xs text-muted-foreground mb-1.5">Fit</div>
                    <ToggleGroup
                      options={IMAGE_FIT_OPTIONS}
                      value={settings.backgroundImageFit}
                      onChange={(v) =>
                        updateSettings({
                          backgroundImageFit: v as 'cover' | 'contain' | 'fill' | 'tile',
                        })
                      }
                    />
                  </div>

                  <SliderRow
                    label="Image opacity"
                    value={settings.backgroundImageOpacity}
                    onChange={(v) => updateSettings({ backgroundImageOpacity: v })}
                    min={10}
                    max={100}
                    step={5}
                    unit="%"
                  />

                  <SliderRow
                    label="Color overlay"
                    value={settings.backgroundImageOverlayOpacity}
                    onChange={(v) => updateSettings({ backgroundImageOverlayOpacity: v })}
                    min={0}
                    max={80}
                    step={5}
                    unit="%"
                  />

                  {settings.backgroundImageOverlayOpacity > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">Overlay color</div>
                      <ColorSwatchGrid
                        selected={settings.backgroundImageOverlay}
                        onSelect={(color) => updateSettings({ backgroundImageOverlay: color })}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <button
                  className="w-full gap-1.5 text-xs h-20 flex flex-col items-center justify-center cursor-pointer rounded-lg border-2 border-dashed border-border/50 bg-background/50 text-muted-foreground hover:border-primary/40 hover:text-foreground/70 hover:bg-muted/30 transition-all duration-200"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <ImagePlus className="w-5 h-5" />
                  <span>Upload Background Image</span>
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const WindowSection: React.FC<{
  settings: CodeImageExportSettings;
  updateSettings: (partial: Partial<CodeImageExportSettings>) => void;
  language: string;
}> = ({ settings, updateSettings, language }) => (
  <div className="rounded-2xl bg-muted/20 p-4">
    <SectionLabel>Window</SectionLabel>

    <div className="mb-4">
      <ToggleGroup
        options={WINDOW_STYLES}
        value={settings.windowStyle}
        onChange={(v) => updateSettings({ windowStyle: v as 'macos' | 'windows' | 'none' })}
      />
    </div>

    <div className="space-y-4">
      <div>
        <div className="text-xs text-muted-foreground mb-1.5">Title text</div>
        <Input
          value={settings.titleText}
          onChange={(e) => updateSettings({ titleText: e.target.value })}
          placeholder={language || 'filename.ts'}
          className="h-7 text-xs"
        />
      </div>

      <SliderRow
        label="Border radius"
        value={settings.borderRadius}
        onChange={(v) => updateSettings({ borderRadius: v })}
        min={0}
        max={32}
        step={2}
        unit="px"
      />

      <SelectRow
        label="Shadow"
        value={settings.shadowSize}
        onValueChange={(v) =>
          updateSettings({ shadowSize: v as 'none' | 'sm' | 'md' | 'lg' | 'xl' })
        }
        options={[
          { value: 'none', label: 'None' },
          { value: 'sm', label: 'Small' },
          { value: 'md', label: 'Medium' },
          { value: 'lg', label: 'Large' },
          { value: 'xl', label: 'Extra Large' },
        ]}
      />
    </div>
  </div>
);

const CodeSection: React.FC<{
  settings: CodeImageExportSettings;
  updateSettings: (partial: Partial<CodeImageExportSettings>) => void;
}> = ({ settings, updateSettings }) => (
  <div className="rounded-2xl bg-muted/20 p-4">
    <SectionLabel>Code</SectionLabel>

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
  </div>
);

const LineHighlightSection: React.FC<{
  settings: CodeImageExportSettings;
  updateSettings: (partial: Partial<CodeImageExportSettings>) => void;
}> = ({ settings, updateSettings }) => (
  <div className="rounded-2xl bg-muted/20 p-4">
    <SectionLabel>Line Highlight</SectionLabel>

    <div className="space-y-4">
      <div>
        <div className="text-xs text-muted-foreground mb-1.5">Lines (e.g. 1,3-5,8)</div>
        <Input
          value={settings.highlightedLines}
          onChange={(e) => updateSettings({ highlightedLines: e.target.value })}
          placeholder="1,3-5,8"
          className="h-7 text-xs font-mono"
        />
      </div>

      <div>
        <div className="text-xs text-muted-foreground mb-1.5">Highlight color</div>
        <div className="flex gap-0.5 p-0.5 rounded-lg bg-muted/40">
          {HIGHLIGHT_COLOR_PRESETS.map((preset) => (
            <button
              key={preset.label}
              className={cn(
                'flex-1 text-xs py-1.5 rounded-md transition-all duration-200 cursor-pointer font-medium',
                settings.highlightColor === preset.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground/80'
              )}
              onClick={() => updateSettings({ highlightColor: preset.value })}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Dim other lines</span>
        <Switch
          checked={settings.dimUnhighlighted}
          onCheckedChange={(v) => updateSettings({ dimUnhighlighted: v })}
        />
      </div>

      {settings.dimUnhighlighted && (
        <SliderRow
          label="Dim opacity"
          value={settings.dimOpacity}
          onChange={(v) => updateSettings({ dimOpacity: v })}
          min={10}
          max={80}
          step={5}
          unit="%"
        />
      )}
    </div>
  </div>
);

const LayoutSection: React.FC<{
  settings: CodeImageExportSettings;
  updateSettings: (partial: Partial<CodeImageExportSettings>) => void;
}> = ({ settings, updateSettings }) => (
  <div className="rounded-2xl bg-muted/20 p-4">
    <SectionLabel>Layout</SectionLabel>

    <div className="space-y-4">
      <SliderRow
        label="Padding"
        value={settings.padding}
        onChange={(v) => updateSettings({ padding: v })}
        min={0}
        max={128}
        step={8}
        unit="px"
      />

      <SliderRow
        label="Custom width"
        value={settings.customWidth}
        onChange={(v) => updateSettings({ customWidth: v })}
        min={0}
        max={1200}
        step={20}
        unit={settings.customWidth > 0 ? 'px' : ''}
      />
      {settings.customWidth === 0 && (
        <div className="text-[10px] text-muted-foreground/50 -mt-1.5 italic">auto width</div>
      )}

      <div>
        <div className="text-xs text-muted-foreground mb-1.5">Aspect ratio</div>
        <ToggleGroup
          options={ASPECT_RATIOS}
          value={settings.aspectRatio}
          onChange={(v) =>
            updateSettings({
              aspectRatio: v as 'auto' | '16:9' | '4:3' | '1:1' | '9:16',
            })
          }
        />
      </div>
    </div>
  </div>
);

const WatermarkSection: React.FC<{
  settings: CodeImageExportSettings;
  updateSettings: (partial: Partial<CodeImageExportSettings>) => void;
}> = ({ settings, updateSettings }) => (
  <div className="rounded-2xl bg-muted/20 p-4">
    <SectionLabel>Watermark</SectionLabel>

    <div className="space-y-4">
      <div>
        <div className="text-xs text-muted-foreground mb-1.5">Text</div>
        <Input
          value={settings.watermarkText}
          onChange={(e) => updateSettings({ watermarkText: e.target.value })}
          placeholder="@username"
          className="h-7 text-xs"
        />
      </div>

      {settings.watermarkText && (
        <>
          <SelectRow
            label="Position"
            value={settings.watermarkPosition}
            onValueChange={(v) =>
              updateSettings({
                watermarkPosition: v as 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left',
              })
            }
            options={WATERMARK_POSITIONS}
          />

          <SliderRow
            label="Opacity"
            value={settings.watermarkOpacity}
            onChange={(v) => updateSettings({ watermarkOpacity: v })}
            min={10}
            max={100}
            step={5}
            unit="%"
          />
        </>
      )}
    </div>
  </div>
);

const ExportScaleSection: React.FC<{
  settings: CodeImageExportSettings;
  updateSettings: (partial: Partial<CodeImageExportSettings>) => void;
}> = ({ settings, updateSettings }) => (
  <div className="rounded-2xl bg-muted/20 p-4">
    <SectionLabel>Export</SectionLabel>

    <div className="space-y-4">
      <SliderRow
        label="Scale"
        value={settings.exportScale}
        onChange={(v) => updateSettings({ exportScale: v })}
        min={1}
        max={4}
        step={1}
        unit="x"
      />
    </div>
  </div>
);

interface SettingsSidebarProps {
  settings: CodeImageExportSettings;
  updateSettings: (partial: Partial<CodeImageExportSettings>) => void;
  presets: SavedPreset[];
  savePreset: (name: string) => void;
  loadPreset: (name: string) => void;
  deletePreset: (name: string) => void;
  language: string;
}

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  settings,
  updateSettings,
  presets,
  savePreset,
  loadPreset,
  deletePreset,
  language,
}) => (
  <ScrollArea className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-border/30 bg-background/80">
    <div className="p-4 space-y-4">
      <PresetsSection
        presets={presets}
        onLoad={loadPreset}
        onDelete={deletePreset}
        onSave={savePreset}
      />
      <BackgroundSection settings={settings} updateSettings={updateSettings} />
      <WindowSection settings={settings} updateSettings={updateSettings} language={language} />
      <CodeSection settings={settings} updateSettings={updateSettings} />
      <LineHighlightSection settings={settings} updateSettings={updateSettings} />
      <LayoutSection settings={settings} updateSettings={updateSettings} />
      <WatermarkSection settings={settings} updateSettings={updateSettings} />
      <ExportScaleSection settings={settings} updateSettings={updateSettings} />
      <div className="h-4" />
    </div>
  </ScrollArea>
);

export default SettingsSidebar;
