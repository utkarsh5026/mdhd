import React from 'react';

import {
  defaultPhotoSettings,
  type PhotoImageExportSettings,
} from '../../store/photo-image-export-store';
import { FRAME_KEYS, pickKeys } from '../../store/types';
import { BORDER_STYLES } from '../constants';
import { CollapsibleSection, ColorSwatchGrid, SliderRow, ToggleGroup } from './shared-controls';

export const FrameSection: React.FC<{
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
