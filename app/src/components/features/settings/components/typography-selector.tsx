import React from "react";
import { useReadingSettings } from "@/components/features/settings/context/ReadingContext";
import { Slider } from "@/components/ui/slider";
import { Type, AlignLeft, MoveHorizontal } from "lucide-react";
import { fontFamilyMap } from "@/components/features/settings/context/ReadingContext";

const sampleText =
  "The quick brown fox jumps over the lazy dog. Reading should be comfortable and distraction-free.";

const TypographySelector: React.FC = () => {
  const { settings, setFontSize, setLineHeight, setContentWidth } =
    useReadingSettings();
  const fontSize = settings.fontSize ?? 18;
  const lineHeight = settings.lineHeight ?? 1.7;
  const contentWidth = settings.contentWidth ?? 700;
  const fontFamily = settings.fontFamily ?? "roboto-slab";

  return (
    <div className="space-y-6">
      {/* Live Preview */}
      <div
        className="p-6 border rounded-2xl bg-background/50 backdrop-blur-3xl shadow-sm shadow-primary/10"
        style={{
          fontFamily: fontFamilyMap[fontFamily],
          fontSize: `${fontSize}px`,
          lineHeight: lineHeight,
          maxWidth: `${contentWidth}px`,
        }}
      >
        <p className="text-card-foreground">{sampleText}</p>
        <p className="text-xs text-muted-foreground mt-3 font-cascadia-code">
          Preview with current settings
        </p>
      </div>

      {/* Font Size */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Type className="h-4 w-4" />
            <h3 className="font-medium text-sm">Font Size</h3>
          </div>
          <span className="text-sm text-muted-foreground font-mono">
            {fontSize}px
          </span>
        </div>
        <Slider
          value={[fontSize]}
          onValueChange={(value) => setFontSize(value[0])}
          min={14}
          max={28}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Small (14px)</span>
          <span>Large (28px)</span>
        </div>
      </div>

      {/* Line Height */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlignLeft className="h-4 w-4" />
            <h3 className="font-medium text-sm">Line Height</h3>
          </div>
          <span className="text-sm text-muted-foreground font-mono">
            {lineHeight.toFixed(1)}
          </span>
        </div>
        <Slider
          value={[lineHeight * 10]}
          onValueChange={(value) => setLineHeight(value[0] / 10)}
          min={14}
          max={22}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Compact (1.4)</span>
          <span>Spacious (2.2)</span>
        </div>
      </div>

      {/* Content Width */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MoveHorizontal className="h-4 w-4" />
            <h3 className="font-medium text-sm">Content Width</h3>
          </div>
          <span className="text-sm text-muted-foreground font-mono">
            {contentWidth}px
          </span>
        </div>
        <Slider
          value={[contentWidth]}
          onValueChange={(value) => setContentWidth(value[0])}
          min={500}
          max={900}
          step={50}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Narrow (500px)</span>
          <span>Wide (900px)</span>
        </div>
      </div>
    </div>
  );
};

export default TypographySelector;
