import { Check, Monitor } from 'lucide-react';
import React, { memo, useCallback, useMemo } from 'react';

import { useReadingSettings } from '@/components/features/settings/store/reading-settings-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { FontFamily } from '@/lib/font';
import {
  APP_FONT_CSS_MAP,
  APP_FONT_OPTIONS,
  appFontCategories,
  AppFontFamily,
  AppFontOption,
} from '@/lib/font';
import { isFontLoaded, loadFont } from '@/lib/font-loader';
import { cn } from '@/lib/utils';

import { SettingsHeader } from './settings-commons';

const sampleText = 'The quick brown fox jumps over the lazy dog.';

const AppFontSelector: React.FC = () => {
  const { settings, setAppFontFamily } = useReadingSettings();
  const { appFontFamily } = settings;

  const handleSelectFont = useCallback(
    (font: AppFontFamily) => {
      setAppFontFamily(font);
    },
    [setAppFontFamily]
  );

  const currentFontLabel = useMemo(
    () => APP_FONT_OPTIONS.find((f) => f.value === appFontFamily)?.label ?? 'Cascadia Code',
    [appFontFamily]
  );

  const previewStyle = useMemo(
    () => ({ fontFamily: APP_FONT_CSS_MAP[appFontFamily] }),
    [appFontFamily]
  );

  return (
    <div className="space-y-4 flex flex-col max-h-full">
      <SettingsHeader
        icon={<Monitor className="h-4 w-4 text-primary" />}
        title="App Font"
        description="Font for the app interface"
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
              {appFontCategories[category].map((font) => (
                <AppFontRow
                  key={font.value}
                  font={font}
                  isSelected={appFontFamily === font.value}
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

interface AppFontRowProps {
  font: AppFontOption;
  isSelected: boolean;
  onSelect: (font: AppFontFamily) => void;
}

const AppFontRow = memo<AppFontRowProps>(({ font, isSelected, onSelect }) => {
  const fontStyle = useMemo(() => ({ fontFamily: APP_FONT_CSS_MAP[font.value] }), [font.value]);

  const handleClick = useCallback(() => {
    onSelect(font.value);
  }, [onSelect, font.value]);

  const handleMouseEnter = useCallback(() => {
    if (font.value !== 'geist' && !isFontLoaded(font.value as FontFamily)) {
      loadFont(font.value as FontFamily).catch((error) => {
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

AppFontRow.displayName = 'AppFontRow';

export default AppFontSelector;
