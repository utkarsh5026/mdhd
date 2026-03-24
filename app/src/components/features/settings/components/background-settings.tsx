import { Image, ImagePlus, Palette, Trash2 } from 'lucide-react';
import React, { useCallback, useMemo, useRef } from 'react';

import { IMAGE_FIT_OPTIONS } from '@/components/features/image-export/components/constants';
import {
  SliderRow,
  ToggleGroup,
} from '@/components/features/image-export/components/settings/shared-controls';
import { useThemeStore } from '@/components/shared/theme/store/theme-store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { useReadingBackground } from '../hooks/use-reading-background';
import type { ReadingBackgroundType } from '../store/reading-settings-store';
import { SettingsHeader } from './settings-commons';

const BACKGROUND_TYPE_OPTIONS: { value: ReadingBackgroundType; label: string }[] = [
  { value: 'theme', label: 'Theme' },
  { value: 'solid', label: 'Solid' },
  { value: 'image', label: 'Image' },
];

const ThemeColorSwatch: React.FC<{
  selected: string;
  onSelect: (color: string) => void;
}> = ({ selected, onSelect }) => {
  const currentTheme = useThemeStore((s) => s.currentTheme);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const themeColors = useMemo(() => {
    const colors: { label: string; value: string }[] = [
      { label: 'Background', value: currentTheme.background },
      { label: 'Card', value: currentTheme.cardBg },
      { label: 'Primary', value: currentTheme.primary },
      { label: 'Secondary', value: currentTheme.secondary },
      { label: 'Foreground', value: currentTheme.foreground },
      { label: 'Border', value: currentTheme.border },
      { label: 'Muted', value: currentTheme.mutedForeground },
    ];
    if (currentTheme.accent) {
      colors.push({ label: 'Accent', value: currentTheme.accent });
    }
    return colors;
  }, [currentTheme]);

  const isCustom = !themeColors.some((c) => c.value === selected);

  return (
    <div className="flex flex-wrap gap-1.5">
      {themeColors.map((color) => (
        <button
          key={color.label}
          className={cn(
            'w-6 h-6 rounded cursor-pointer transition-all duration-200 border-2 shadow-sm',
            selected === color.value
              ? 'border-primary ring-2 ring-primary/25 scale-110'
              : 'border-transparent hover:scale-110 hover:shadow-md'
          )}
          style={{ backgroundColor: color.value }}
          onClick={() => onSelect(color.value)}
          title={color.label}
        />
      ))}
      <button
        className={cn(
          'w-6 h-6 rounded cursor-pointer transition-all duration-200 border-2 shadow-sm flex items-center justify-center',
          isCustom
            ? 'border-primary ring-2 ring-primary/25 scale-110'
            : 'border-transparent hover:scale-110 hover:shadow-md'
        )}
        style={{ backgroundColor: isCustom ? selected : undefined }}
        onClick={() => colorInputRef.current?.click()}
        title="Custom color"
      >
        {!isCustom && <Palette className="w-3 h-3 text-muted-foreground" />}
      </button>
      <input
        ref={colorInputRef}
        type="color"
        className="sr-only"
        value={selected}
        onChange={(e) => onSelect(e.target.value)}
      />
    </div>
  );
};

const BackgroundSettings: React.FC = () => {
  const { background, backgroundImageDataUrl, updateBackground, uploadImage, removeImage } =
    useReadingBackground();
  const currentTheme = useThemeStore((s) => s.currentTheme);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadImage(file);
      e.target.value = '';
    },
    [uploadImage]
  );

  return (
    <div className="space-y-5">
      <SettingsHeader
        icon={<Image className="h-4 w-4 text-primary" />}
        title="Background"
        description="Customize reading background"
      />

      <div className="space-y-4">
        <ToggleGroup
          options={BACKGROUND_TYPE_OPTIONS}
          value={background.backgroundType}
          onChange={(v) => {
            const type = v as ReadingBackgroundType;
            const patch: Parameters<typeof updateBackground>[0] = { backgroundType: type };
            if (type === 'solid' && !background.backgroundColor) {
              patch.backgroundColor = currentTheme.background;
            }
            updateBackground(patch);
          }}
        />

        {background.backgroundType === 'solid' && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Color</div>
            <ThemeColorSwatch
              selected={background.backgroundColor}
              onSelect={(color) => updateBackground({ backgroundColor: color })}
            />
          </div>
        )}

        {background.backgroundType === 'image' && (
          <div className="space-y-4">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            {backgroundImageDataUrl ? (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden border border-border/50">
                  <img
                    src={backgroundImageDataUrl}
                    alt="Background preview"
                    className="w-full h-20 object-cover"
                  />
                  <button
                    className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
                    onClick={removeImage}
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
                    value={background.backgroundImageFit}
                    onChange={(v) =>
                      updateBackground({
                        backgroundImageFit: v as 'cover' | 'contain' | 'fill' | 'tile',
                      })
                    }
                  />
                </div>

                <SliderRow
                  label="Blur"
                  value={background.backgroundImageBlur}
                  onChange={(v) => updateBackground({ backgroundImageBlur: v })}
                  min={0}
                  max={20}
                  step={1}
                  unit="px"
                />

                <SliderRow
                  label="Opacity"
                  value={background.backgroundImageOpacity}
                  onChange={(v) => updateBackground({ backgroundImageOpacity: v })}
                  min={10}
                  max={100}
                  step={5}
                  unit="%"
                />

                <SliderRow
                  label="Color overlay"
                  value={background.backgroundImageOverlayOpacity}
                  onChange={(v) => updateBackground({ backgroundImageOverlayOpacity: v })}
                  min={0}
                  max={80}
                  step={5}
                  unit="%"
                />

                {background.backgroundImageOverlayOpacity > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">Overlay color</div>
                    <ThemeColorSwatch
                      selected={background.backgroundImageOverlay}
                      onSelect={(color) => updateBackground({ backgroundImageOverlay: color })}
                    />
                  </div>
                )}
              </div>
            ) : (
              <button
                className={cn(
                  'w-full gap-1.5 text-xs h-20 flex flex-col items-center justify-center cursor-pointer',
                  'rounded-lg border-2 border-dashed border-border/50 bg-background/50',
                  'text-muted-foreground hover:border-primary/40 hover:text-foreground/70',
                  'hover:bg-muted/30 transition-all duration-200'
                )}
                onClick={() => imageInputRef.current?.click()}
              >
                <ImagePlus className="w-5 h-5" />
                <span>Upload Background Image</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BackgroundSettings;
