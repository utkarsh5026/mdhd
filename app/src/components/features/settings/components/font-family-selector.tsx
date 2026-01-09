import React, { memo, useCallback, useMemo } from 'react';
import { useReadingSettings } from '@/components/features/settings/store/reading-settings-store';
import {
  FontFamily,
  FONT_CSS_MAP,
  FontOption,
  fontOptions,
  fontCategories,
  getFontCss,
} from '@/lib/font';
import { Type } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SettingsHeader, SelectableOption } from './settings-commons';

const sampleText =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

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
    <div className="space-y-3 flex flex-col gap-4 max-h-full">
      <SettingsHeader
        icon={<Type className="h-4 w-4 text-primary" />}
        title="Font Family"
        description="Select your preferred reading font"
        rightContent={<span className="text-xs text-muted-foreground">{currentFontLabel}</span>}
        className="pb-0 border-b-0"
      />

      <div className="sticky top-0 z-10 p-6 border rounded-2xl mb-2 bg-background/50 backdrop-blur-3xl shadow-sm shadow-primary/10">
        <p className="text-sm text-card-foreground" style={previewStyle}>
          {sampleText}
        </p>
        <p className="text-xs text-muted-foreground mt-1">Sample text preview</p>
      </div>

      <ScrollArea className="h-80 scrollbar-hide flex-1">
        {(['sans-serif', 'serif'] as const).map((category, index) => (
          <div key={category} className={index === 0 ? 'mb-4' : undefined}>
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2 px-1">
              {category === 'sans-serif' ? 'Sans-serif' : 'Serif'}
            </h4>
            <div className="flex flex-col gap-4">
              {fontCategories[category].map((font) => (
                <FontFamilySelectItem
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

const FontFamilySelectItem = memo<FontFamilyItemProps>(({ font, isSelected, onSelect }) => {
  const fontStyle = FONT_CSS_MAP[font.value];

  const handleClick = useCallback(() => {
    onSelect(font.value);
  }, [onSelect, font.value]);

  return (
    <SelectableOption
      title={font.label}
      description={font.description}
      isSelected={isSelected}
      onClick={handleClick}
      style={fontStyle}
    />
  );
});

FontFamilySelectItem.displayName = 'FontFamilySelectItem';

export default FontFamilySelector;
