import React from 'react';

import { Input } from '@/components/ui/input';

import {
  defaultPhotoSettings,
  type PhotoImageExportSettings,
} from '../../store/photo-image-export-store';
import { CAPTION_KEYS, pickKeys } from '../../store/types';
import {
  CAPTION_ALIGNMENTS,
  CAPTION_FONT_FAMILIES,
  CAPTION_FONT_WEIGHTS,
  CAPTION_POSITIONS,
} from '../constants';
import {
  CollapsibleSection,
  ColorSwatchGrid,
  SelectRow,
  SliderRow,
  ToggleGroup,
} from './shared-controls';

export const CaptionSection: React.FC<{
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
