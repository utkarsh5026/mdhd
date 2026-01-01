import React, { memo, useCallback, useMemo } from "react";
import { useReadingSettings } from "@/components/features/settings/context/ReadingContext";
import type { FontFamily } from "@/components/features/settings/store/reading-settings-store";
import { Check, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FontOption {
  value: FontFamily;
  label: string;
  description: string;
  category: "serif" | "sans-serif";
}

const sampleText =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

const fontOptions: FontOption[] = [
  {
    value: "cascadia-code",
    label: "Cascadia Code",
    description: "A monospaced font with a modern look",
    category: "sans-serif",
  },
  {
    value: "system-ui",
    label: "System UI",
    description: "Your device's default font",
    category: "sans-serif",
  },
  {
    value: "inter",
    label: "Inter",
    description: "Clean & modern sans-serif",
    category: "sans-serif",
  },
  {
    value: "open-sans",
    label: "Open Sans",
    description: "Friendly and accessible",
    category: "sans-serif",
  },
  {
    value: "georgia",
    label: "Georgia",
    description: "Classic serif with elegance",
    category: "serif",
  },
  {
    value: "merriweather",
    label: "Merriweather",
    description: "Readable serif for long text",
    category: "serif",
  },
  {
    value: "roboto-slab",
    label: "Roboto Slab",
    description: "Modern slab serif",
    category: "serif",
  },
  {
    value: "source-serif-pro",
    label: "Source Serif Pro",
    description: "Balanced serif design",
    category: "serif",
  },
  {
    value: "libre-baskerville",
    label: "Libre Baskerville",
    description: "Old-style serif",
    category: "serif",
  },
  {
    value: "lora",
    label: "Lora",
    description: "Contemporary serif",
    category: "serif",
  },
  {
    value: "pt-serif",
    label: "PT Serif",
    description: "Transitional serif",
    category: "serif",
  },
  {
    value: "atkinson-hyperlegible",
    label: "Atkinson Hyperlegible",
    description: "Designed for maximum readability and accessibility",
    category: "sans-serif",
  },
  {
    value: "source-sans-pro",
    label: "Source Sans Pro",
    description: "Adobe's font optimized for UI and long reading",
    category: "sans-serif",
  },
  {
    value: "nunito-sans",
    label: "Nunito Sans",
    description: "Rounded, friendly font excellent for long text",
    category: "sans-serif",
  },
  {
    value: "ibm-plex-sans",
    label: "IBM Plex Sans",
    description: "Corporate-grade font designed for extended reading",
    category: "sans-serif",
  },
  {
    value: "crimson-text",
    label: "Crimson Text",
    description: "Inspired by old-style book typography",
    category: "serif",
  },
  {
    value: "spectral",
    label: "Spectral",
    description: "Google's font optimized for screen reading",
    category: "serif",
  },
  {
    value: "eb-garamond",
    label: "EB Garamond",
    description: "Classic Garamond revival, perfect for books",
    category: "serif",
  },
  {
    value: "bitter",
    label: "Bitter",
    description: "Slab serif with excellent readability",
    category: "serif",
  },
  {
    value: "vollkorn",
    label: "Vollkorn",
    description: "Designed specifically for bread text reading",
    category: "serif",
  },
  {
    value: "literata",
    label: "Literata",
    description: "Google Play Books' reading font",
    category: "serif",
  },
];


const fontCategories = {
  "sans-serif": fontOptions.filter((font) => font.category === "sans-serif"),
  serif: fontOptions.filter((font) => font.category === "serif"),
};


const FONT_CSS_MAP: Record<FontFamily, React.CSSProperties> = {
  "cascadia-code": { fontFamily: '"Cascadia Code", monospace' },
  "system-ui": {
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  inter: { fontFamily: '"Inter", sans-serif' },
  georgia: { fontFamily: "Georgia, serif" },
  merriweather: { fontFamily: '"Merriweather", serif' },
  "roboto-slab": { fontFamily: '"Roboto Slab", serif' },
  "source-serif-pro": { fontFamily: '"Source Serif Pro", serif' },
  "libre-baskerville": { fontFamily: '"Libre Baskerville", serif' },
  lora: { fontFamily: '"Lora", serif' },
  "pt-serif": { fontFamily: '"PT Serif", serif' },
  "open-sans": { fontFamily: '"Open Sans", sans-serif' },
  "atkinson-hyperlegible": { fontFamily: '"Atkinson Hyperlegible", sans-serif' },
  "source-sans-pro": { fontFamily: '"Source Sans Pro", sans-serif' },
  "nunito-sans": { fontFamily: '"Nunito Sans", sans-serif' },
  "ibm-plex-sans": { fontFamily: '"IBM Plex Sans", sans-serif' },
  "crimson-text": { fontFamily: '"Crimson Text", serif' },
  spectral: { fontFamily: '"Spectral", serif' },
  "eb-garamond": { fontFamily: '"EB Garamond", serif' },
  bitter: { fontFamily: '"Bitter", serif' },
  vollkorn: { fontFamily: '"Vollkorn", serif' },
  literata: { fontFamily: '"Literata", serif' },
};

const getFontCss = (font: FontFamily): React.CSSProperties => {
  return FONT_CSS_MAP[font] ?? { fontFamily: "inherit" };
};

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
    () => fontOptions.find((f) => f.value === fontFamily)?.label ?? "System UI",
    [fontFamily]
  );


  const previewStyle = useMemo(() => getFontCss(fontFamily), [fontFamily]);

  return (
    <div className="space-y-3 flex flex-col gap-4 max-h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Type className="h-4 w-4" />
          <h3 className="font-medium text-sm">Font Family</h3>
        </div>
        <span className="text-xs text-muted-foreground">{currentFontLabel}</span>
      </div>

      <div className="sticky top-0 z-10 p-6 border rounded-2xl mb-2 bg-background/50 backdrop-blur-3xl shadow-sm shadow-primary/10">
        <p className="text-sm text-card-foreground" style={previewStyle}>
          {sampleText}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Sample text preview
        </p>
      </div>

      <ScrollArea className="h-80 scrollbar-hide flex-1">
        {(["sans-serif", "serif"] as const).map((category, index) => (
          <div key={category} className={index === 0 ? "mb-4" : undefined}>
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2 px-1">
              {category === "sans-serif" ? "Sans-serif" : "Serif"}
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

const FontFamilySelectItem = memo<FontFamilyItemProps>(
  ({ font, isSelected, onSelect }) => {
    const fontStyle = FONT_CSS_MAP[font.value];

    const handleClick = useCallback(() => {
      onSelect(font.value);
    }, [onSelect, font.value]);

    return (
      <button
        className={cn(
          "w-full text-left p-3 rounded-2xl border transition-all",
          isSelected
            ? "border-primary bg-primary/5"
            : "border-border/20 hover:border-border/60 hover:bg-secondary/10 cursor-pointer"
        )}
        onClick={handleClick}
        style={fontStyle}
      >
        <div className="flex justify-between items-center mb-1">
          <span className="font-medium text-sm">{font.label}</span>
          {isSelected && <Check className="h-4 w-4 text-primary" />}
        </div>
        <p className="text-xs text-muted-foreground mb-2">{font.description}</p>
      </button>
    );
  }
);

FontFamilySelectItem.displayName = "FontFamilySelectItem";

export default FontFamilySelector;
