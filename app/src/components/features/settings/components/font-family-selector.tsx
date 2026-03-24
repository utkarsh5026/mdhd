import { Check, Type } from 'lucide-react';
import React, { memo, useCallback, useMemo } from 'react';

import { useReadingSettings } from '@/components/features/settings/store/reading-settings-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FONT_CSS_MAP,
  fontCategories,
  FontFamily,
  FontOption,
  fontOptions,
  getFontCss,
} from '@/lib/font';
import { isFontLoaded, loadFont } from '@/lib/font-loader';
import { cn } from '@/lib/utils';

import { SettingsHeader } from './settings-commons';

const sampleText = 'The quick brown fox jumps over the lazy dog.';

const FontFamilySelector: React.FC = () => {
  const { settings, setFontFamily } = useReadingSettings();
  const { fontFamily } = settings;

  const handleSelectFont = useCallback(
    (font: FontFamily) => {
      setFontFamily(font);
    },
    [setFontFamily]
  );

  const currentFontLabel = useMemo(
    () => fontOptions.find((f) => f.value === fontFamily)?.label ?? 'System UI',
    [fontFamily]
  );

  const previewStyle = useMemo(() => getFontCss(fontFamily), [fontFamily]);

  return (
    <div className="space-y-4 flex flex-col max-h-full">
      <SettingsHeader
        icon={<Type className="h-4 w-4 text-primary" />}
        title="Font Family"
        description="Select your preferred reading font"
        rightContent={<span className="text-xs text-muted-foreground">{currentFontLabel}</span>}
        className="pb-0 border-b-0"
      />

      {/* Preview */}
      <div className="px-3 py-3 rounded-xl bg-muted/30">
        <p className="text-sm text-foreground/80 leading-relaxed" style={previewStyle}>
          {sampleText}
        </p>
      </div>

      <ScrollArea className="h-80 flex-1">
        {(['sans-serif', 'serif', 'monospace'] as const).map((category, index) => (
          <div key={category} className={index === 0 ? 'mb-4' : 'mt-4'}>
            <div className="text-xs text-muted-foreground px-2 mb-1">
              {category === 'sans-serif'
                ? 'Sans-serif'
                : category === 'serif'
                  ? 'Serif'
                  : 'Monospace'}
            </div>
            <div className="-mx-2">
              {fontCategories[category].map((font) => (
                <FontRow
                  key={font.value}
                  font={font}
                  isSelected={fontFamily === font.value}
                  onSelect={handleSelectFont}
                />
              ))}
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
};

interface FontFamilyItemProps {
  font: FontOption;
  isSelected: boolean;
  onSelect: (font: FontFamily) => void;
}

const FontRow = memo<FontFamilyItemProps>(({ font, isSelected, onSelect }) => {
  const fontStyle = FONT_CSS_MAP[font.value];

  const handleClick = useCallback(() => {
    onSelect(font.value);
  }, [onSelect, font.value]);

  const handleMouseEnter = useCallback(() => {
    if (!isFontLoaded(font.value)) {
      loadFont(font.value).catch((error) => {
        console.error('Failed to preload font on hover:', font.value, error);
      });
    }
  }, [font.value]);

  return (
    <button
      className={cn(
        'w-full text-left px-3 py-2.5 rounded-xl transition-colors hover:bg-accent/50',
        isSelected && 'bg-primary/5'
      )}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium leading-none mb-0.5 truncate" style={fontStyle}>
            {font.label}
          </div>
          <div className="text-xs text-muted-foreground truncate">{font.description}</div>
        </div>
        {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
      </div>
    </button>
  );
});

FontRow.displayName = 'FontRow';

export default FontFamilySelector;
