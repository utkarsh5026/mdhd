import React from 'react';

import { Switch } from '@/components/ui/switch';

import type { SharedExportSettings } from '../../store/types';
import { CollapsibleSection, SliderRow } from './shared-controls';

export const PerspectiveSection: React.FC<{
  settings: SharedExportSettings;
  updateSettings: (partial: Partial<SharedExportSettings>) => void;
  onReset?: () => void;
}> = ({ settings, updateSettings, onReset }) => (
  <CollapsibleSection title="3D Transform" defaultOpen={false} onReset={onReset}>
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Enable</span>
        <Switch
          checked={settings.perspectiveEnabled}
          onCheckedChange={(v) => updateSettings({ perspectiveEnabled: v })}
        />
      </div>

      {settings.perspectiveEnabled && (
        <>
          <SliderRow
            label="Perspective"
            value={settings.perspective}
            onChange={(v) => updateSettings({ perspective: v })}
            min={200}
            max={2000}
            step={50}
            unit="px"
          />

          <SliderRow
            label="Rotate X"
            value={settings.rotateX}
            onChange={(v) => updateSettings({ rotateX: v })}
            min={-45}
            max={45}
            step={1}
            unit="°"
          />

          <SliderRow
            label="Rotate Y"
            value={settings.rotateY}
            onChange={(v) => updateSettings({ rotateY: v })}
            min={-45}
            max={45}
            step={1}
            unit="°"
          />
        </>
      )}
    </div>
  </CollapsibleSection>
);
