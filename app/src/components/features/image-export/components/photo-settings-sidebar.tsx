import React from 'react';

import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

import type { PhotoImageExportSettings } from '../store/photo-image-export-store';
import { defaultPhotoSettings } from '../store/photo-image-export-store';
import type { SavedPreset, SharedExportSettings } from '../store/types';
import {
  BACKGROUND_KEYS,
  CAPTION_KEYS,
  EXPORT_KEYS,
  FILTER_KEYS,
  FRAME_KEYS,
  LAYOUT_KEYS,
  pickKeys,
  WATERMARK_KEYS,
} from '../store/types';
import {
  BORDER_STYLES,
  CAPTION_ALIGNMENTS,
  CAPTION_FONT_FAMILIES,
  CAPTION_FONT_WEIGHTS,
  CAPTION_POSITIONS,
  FILTER_PRESETS,
  TINT_COLOR_PRESETS,
} from './constants';
import {
  BackgroundSection,
  ExportScaleSection,
  LayoutSection,
  PresetsSection,
  WatermarkSection,
} from './settings-sidebar';
import {
  CollapsibleSection,
  ColorSwatchGrid,
  SelectRow,
  SliderRow,
  ToggleGroup,
} from './shared-controls';

const FiltersSection: React.FC<{
  settings: PhotoImageExportSettings;
  updateSettings: (partial: Partial<PhotoImageExportSettings>) => void;
}> = ({ settings, updateSettings }) => (
  <CollapsibleSection
    title="Filters"
    onReset={() => updateSettings(pickKeys(defaultPhotoSettings, FILTER_KEYS))}
  >
    <div className="space-y-4">
      {/* Filter presets */}
      <div className="flex flex-wrap gap-1.5">
        {FILTER_PRESETS.map((preset) => (
          <button
            key={preset.name}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-background/80 border border-border/40 text-muted-foreground hover:text-foreground hover:border-border/70 transition-colors cursor-pointer"
            onClick={() => updateSettings({ ...preset.values })}
            title={preset.name}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <SliderRow
        label="Brightness"
        value={settings.brightness}
        onChange={(v) => updateSettings({ brightness: v })}
        min={0}
        max={200}
        step={5}
        unit="%"
      />

      <SliderRow
        label="Contrast"
        value={settings.contrast}
        onChange={(v) => updateSettings({ contrast: v })}
        min={0}
        max={200}
        step={5}
        unit="%"
      />

      <SliderRow
        label="Saturation"
        value={settings.saturation}
        onChange={(v) => updateSettings({ saturation: v })}
        min={0}
        max={200}
        step={5}
        unit="%"
      />

      <SliderRow
        label="Blur"
        value={settings.blur}
        onChange={(v) => updateSettings({ blur: v })}
        min={0}
        max={20}
        step={0.5}
        unit="px"
      />

      <SliderRow
        label="Grayscale"
        value={settings.grayscale}
        onChange={(v) => updateSettings({ grayscale: v })}
        min={0}
        max={100}
        step={5}
        unit="%"
      />

      <SliderRow
        label="Sepia"
        value={settings.sepia}
        onChange={(v) => updateSettings({ sepia: v })}
        min={0}
        max={100}
        step={5}
        unit="%"
      />

      <SliderRow
        label="Hue Rotate"
        value={settings.hueRotate}
        onChange={(v) => updateSettings({ hueRotate: v })}
        min={0}
        max={360}
        step={15}
        unit="°"
      />

      <SliderRow
        label="Invert"
        value={settings.invert}
        onChange={(v) => updateSettings({ invert: v })}
        min={0}
        max={100}
        step={5}
        unit="%"
      />

      <SliderRow
        label="Vignette"
        value={settings.vignette}
        onChange={(v) => updateSettings({ vignette: v })}
        min={0}
        max={100}
        step={5}
        unit="%"
      />

      <SliderRow
        label="Sharpen"
        value={settings.sharpen}
        onChange={(v) => updateSettings({ sharpen: v })}
        min={0}
        max={100}
        step={5}
        unit="%"
      />

      <SliderRow
        label="Noise / Grain"
        value={settings.noise}
        onChange={(v) => updateSettings({ noise: v })}
        min={0}
        max={100}
        step={5}
        unit="%"
      />

      <div>
        <div className="text-xs text-muted-foreground mb-1.5">Color tint</div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {TINT_COLOR_PRESETS.map((preset) => (
            <button
              key={preset.label}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-background/80 border border-border/40 text-muted-foreground hover:text-foreground hover:border-border/70 transition-colors cursor-pointer"
              onClick={() =>
                updateSettings({
                  tintColor: preset.value,
                  tintOpacity: Math.max(settings.tintOpacity, 15),
                })
              }
              title={preset.label}
            >
              <span
                className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
                style={{ backgroundColor: preset.value }}
              />
              {preset.label}
            </button>
          ))}
        </div>
        <SliderRow
          label="Tint opacity"
          value={settings.tintOpacity}
          onChange={(v) => updateSettings({ tintOpacity: v })}
          min={0}
          max={60}
          step={5}
          unit="%"
        />
      </div>
    </div>
  </CollapsibleSection>
);

const FrameSection: React.FC<{
  settings: PhotoImageExportSettings;
  updateSettings: (partial: Partial<PhotoImageExportSettings>) => void;
}> = ({ settings, updateSettings }) => (
  <CollapsibleSection
    title="Frame"
    onReset={() => updateSettings(pickKeys(defaultPhotoSettings, FRAME_KEYS))}
  >
    <div className="space-y-4">
      <SliderRow
        label="Border width"
        value={settings.frameBorderWidth}
        onChange={(v) => updateSettings({ frameBorderWidth: v })}
        min={0}
        max={20}
        step={1}
        unit="px"
      />

      {settings.frameBorderWidth > 0 && (
        <>
          <div>
            <div className="text-xs text-muted-foreground mb-1.5">Border style</div>
            <ToggleGroup
              options={BORDER_STYLES}
              value={settings.frameBorderStyle}
              onChange={(v) =>
                updateSettings({
                  frameBorderStyle: v as 'solid' | 'double' | 'groove' | 'ridge',
                })
              }
            />
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1.5">Border color</div>
            <ColorSwatchGrid
              selected={settings.frameBorderColor}
              onSelect={(color) => updateSettings({ frameBorderColor: color })}
            />
          </div>
        </>
      )}

      <SliderRow
        label="Border radius"
        value={settings.innerBorderRadius}
        onChange={(v) => updateSettings({ innerBorderRadius: v })}
        min={0}
        max={32}
        step={2}
        unit="px"
      />

      <div>
        <div className="text-xs text-muted-foreground mb-1.5">Shadow</div>
        <ToggleGroup
          options={[
            { value: 'none', label: 'None' },
            { value: 'sm', label: 'S' },
            { value: 'md', label: 'M' },
            { value: 'lg', label: 'L' },
            { value: 'xl', label: 'XL' },
          ]}
          value={settings.shadowSize}
          onChange={(v) =>
            updateSettings({
              shadowSize: v as 'none' | 'sm' | 'md' | 'lg' | 'xl',
            })
          }
        />
      </div>
    </div>
  </CollapsibleSection>
);

const CaptionSection: React.FC<{
  settings: PhotoImageExportSettings;
  updateSettings: (partial: Partial<PhotoImageExportSettings>) => void;
  alt: string;
}> = ({ settings, updateSettings, alt }) => (
  <CollapsibleSection
    title="Caption"
    onReset={() => updateSettings(pickKeys(defaultPhotoSettings, CAPTION_KEYS))}
  >
    <div className="space-y-4">
      <div>
        <div className="text-xs text-muted-foreground mb-1.5">Text</div>
        <Input
          value={settings.captionText}
          onChange={(e) => updateSettings({ captionText: e.target.value })}
          placeholder={alt || 'Image caption...'}
          className="h-7 text-xs"
        />
      </div>

      <div>
        <div className="text-xs text-muted-foreground mb-1.5">Description</div>
        <Input
          value={settings.captionDescription}
          onChange={(e) => updateSettings({ captionDescription: e.target.value })}
          placeholder="Optional secondary text..."
          className="h-7 text-xs"
        />
      </div>

      <div>
        <div className="text-xs text-muted-foreground mb-1.5">Position</div>
        <ToggleGroup
          options={CAPTION_POSITIONS}
          value={settings.captionPosition}
          onChange={(v) =>
            updateSettings({
              captionPosition: v as 'below' | 'overlay-bottom' | 'overlay-top',
            })
          }
        />
      </div>

      <SelectRow
        label="Font family"
        value={settings.captionFontFamily}
        onValueChange={(v) => updateSettings({ captionFontFamily: v })}
        options={CAPTION_FONT_FAMILIES.map((f) => ({ value: f, label: f.split(',')[0] }))}
        renderItem={(opt) => <span style={{ fontFamily: opt.value }}>{opt.label}</span>}
      />

      <SliderRow
        label="Font size"
        value={settings.captionFontSize}
        onChange={(v) => updateSettings({ captionFontSize: v })}
        min={10}
        max={24}
        step={1}
        unit="px"
      />

      <div>
        <div className="text-xs text-muted-foreground mb-1.5">Font weight</div>
        <ToggleGroup
          options={CAPTION_FONT_WEIGHTS}
          value={settings.captionFontWeight}
          onChange={(v) => updateSettings({ captionFontWeight: v as 'light' | 'normal' | 'bold' })}
        />
      </div>

      <div>
        <div className="text-xs text-muted-foreground mb-1.5">Alignment</div>
        <ToggleGroup
          options={CAPTION_ALIGNMENTS}
          value={settings.captionAlignment}
          onChange={(v) => updateSettings({ captionAlignment: v as 'left' | 'center' | 'right' })}
        />
      </div>

      <SliderRow
        label="Max width"
        value={settings.captionMaxWidth}
        onChange={(v) => updateSettings({ captionMaxWidth: v })}
        min={0}
        max={600}
        step={20}
        unit={settings.captionMaxWidth > 0 ? 'px' : ''}
      />
      {settings.captionMaxWidth === 0 && (
        <div className="text-[10px] text-muted-foreground/50 -mt-1.5 italic">auto width</div>
      )}

      <div>
        <div className="text-xs text-muted-foreground mb-1.5">Text color</div>
        <ColorSwatchGrid
          selected={settings.captionColor}
          onSelect={(color) => updateSettings({ captionColor: color })}
        />
      </div>

      {settings.captionPosition !== 'below' && (
        <div>
          <div className="text-xs text-muted-foreground mb-1.5">Background</div>
          <ColorSwatchGrid
            selected={settings.captionBackground}
            onSelect={(color) => updateSettings({ captionBackground: color })}
          />
        </div>
      )}
    </div>
  </CollapsibleSection>
);

interface PhotoSettingsSidebarProps {
  settings: PhotoImageExportSettings;
  updateSettings: (partial: Partial<PhotoImageExportSettings>) => void;
  presets: SavedPreset<PhotoImageExportSettings>[];
  savePreset: (name: string) => void;
  loadPreset: (name: string) => void;
  deletePreset: (name: string) => void;
  alt: string;
}

const PhotoSettingsSidebar: React.FC<PhotoSettingsSidebarProps> = ({
  settings,
  updateSettings,
  presets,
  savePreset,
  loadPreset,
  deletePreset,
  alt,
}) => (
  <ScrollArea className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-border/30 bg-background/80">
    <div className="p-4 space-y-4">
      <PresetsSection
        presets={presets}
        onLoad={loadPreset}
        onDelete={deletePreset}
        onSave={savePreset}
      />
      <BackgroundSection
        settings={settings}
        updateSettings={updateSettings as (p: Partial<SharedExportSettings>) => void}
        onReset={() => updateSettings(pickKeys(defaultPhotoSettings, BACKGROUND_KEYS))}
      />
      <FiltersSection settings={settings} updateSettings={updateSettings} />
      <FrameSection settings={settings} updateSettings={updateSettings} />
      <CaptionSection settings={settings} updateSettings={updateSettings} alt={alt} />
      <LayoutSection
        settings={settings}
        updateSettings={updateSettings as (p: Partial<SharedExportSettings>) => void}
        onReset={() => updateSettings(pickKeys(defaultPhotoSettings, LAYOUT_KEYS))}
      />
      <WatermarkSection
        settings={settings}
        updateSettings={updateSettings as (p: Partial<SharedExportSettings>) => void}
        onReset={() => updateSettings(pickKeys(defaultPhotoSettings, WATERMARK_KEYS))}
      />
      <ExportScaleSection
        settings={settings}
        updateSettings={updateSettings as (p: Partial<SharedExportSettings>) => void}
        onReset={() => updateSettings(pickKeys(defaultPhotoSettings, EXPORT_KEYS))}
      />
      <div className="h-4" />
    </div>
  </ScrollArea>
);

export default PhotoSettingsSidebar;
