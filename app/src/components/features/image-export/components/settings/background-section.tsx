import { ImagePlus, Trash2 } from 'lucide-react';
import React, { useCallback, useRef } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

import type { SharedExportSettings } from '../../store/types';
import { BACKGROUND_PATTERNS, GRADIENT_PRESETS, IMAGE_FIT_OPTIONS } from '../constants';
import {
  CollapsibleSection,
  ColorSwatchGrid,
  SelectRow,
  SliderRow,
  ToggleGroup,
} from './shared-controls';

export const BackgroundSection: React.FC<{
  settings: SharedExportSettings;
  updateSettings: (partial: Partial<SharedExportSettings>) => void;
  onReset?: () => void;
}> = ({ settings, updateSettings, onReset }) => {
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        e.target.value = '';
        return;
      }
      if (file.size > 5_000_000) {
        toast.error('Image must be under 5MB');
        e.target.value = '';
        return;
      }
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
    <CollapsibleSection title="Background" onReset={onReset}>
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

      {/* Pattern overlay — works on top of any background type */}
      {!settings.transparentBackground && (
        <div className="mt-4 pt-4 border-t border-border/30 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Pattern overlay</span>
            <Switch
              checked={settings.backgroundPatternEnabled}
              onCheckedChange={(v) => updateSettings({ backgroundPatternEnabled: v })}
            />
          </div>

          {settings.backgroundPatternEnabled && (
            <>
              <SelectRow
                label="Pattern"
                value={settings.backgroundPattern}
                onValueChange={(v) =>
                  updateSettings({
                    backgroundPattern: v as SharedExportSettings['backgroundPattern'],
                  })
                }
                options={BACKGROUND_PATTERNS}
              />

              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">Pattern color</div>
                <ColorSwatchGrid
                  selected={settings.backgroundPatternColor}
                  onSelect={(color) => updateSettings({ backgroundPatternColor: color })}
                />
              </div>

              <SliderRow
                label="Opacity"
                value={settings.backgroundPatternOpacity}
                onChange={(v) => updateSettings({ backgroundPatternOpacity: v })}
                min={5}
                max={100}
                step={5}
                unit="%"
              />

              <SliderRow
                label="Scale"
                value={settings.backgroundPatternScale}
                onChange={(v) => updateSettings({ backgroundPatternScale: v })}
                min={0.5}
                max={3}
                step={0.25}
                unit="x"
              />
            </>
          )}
        </div>
      )}
    </CollapsibleSection>
  );
};
