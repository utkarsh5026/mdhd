import React, { useMemo } from "react";
import { useReadingSettings } from "../context/ReadingContext";
import { Check, Paintbrush, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks";
import type { ThemeOption } from "@/theme/themes";

interface ColorOptionProps {
  option: { value: string | null; label: string; color: string };
  isSelected: boolean;
  onClick: () => void;
  currentTheme: ThemeOption;
}

const ColorOption: React.FC<ColorOptionProps> = ({
  option,
  isSelected,
  onClick,
  currentTheme,
}) => {
  return (
    <button
      className={cn(
        "relative overflow-hidden rounded-2xl border transition-all",
        "h-20 shadow-sm focus:outline-none focus:ring-1",
        isSelected
          ? "ring-2 ring-primary border-primary/70"
          : "border-border/30 hover:border-border/60"
      )}
      style={{ background: option.color }}
      onClick={onClick}
      title={option.label}
    >
      {/* Color swatch preview effect */}
      <div className="absolute inset-0">
        <div
          className="absolute bottom-0 left-0 right-0 h-7 flex items-center justify-center"
          style={{
            background: "rgba(0, 0, 0, 0.3)",
            backdropFilter: "blur(4px)",
          }}
        >
          <span className="text-xs text-white font-medium">{option.label}</span>
        </div>

        {option.value === currentTheme.background && (
          <div className="absolute top-1 left-1 h-5 w-5 rounded-full flex items-center justify-center bg-white/10">
            <RefreshCw className="h-3 w-3 text-white" />
          </div>
        )}
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-1 right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center shadow-md">
          <Check className="h-3 w-3 text-background" />
        </div>
      )}
    </button>
  );
};

const BackgroundSelector: React.FC = () => {
  const { settings, setCustomBackground } = useReadingSettings();
  const { customBackground } = settings;
  const { currentTheme } = useTheme();

  const backgroundOptions = useMemo(
    () => [
      {
        value: currentTheme.background,
        label: "Theme Default",
        color: currentTheme.background,
      },
      { value: "#121212", label: "Dark", color: "#121212" },
      { value: "#0a0a0a", label: "Black", color: "#0a0a0a" },
      { value: "#171923", label: "Dark Slate", color: "#171923" },
      { value: "#1e293b", label: "Navy", color: "#1e293b" },
      { value: "#111827", label: "Deep Blue", color: "#111827" },
      { value: "#1a1429", label: "Deep Purple", color: "#1a1429" },
      { value: "#12201d", label: "Forest", color: "#12201d" },
      { value: "#180f0c", label: "Coffee", color: "#180f0c" },
      { value: "#170f0f", label: "Deep Red", color: "#170f0f" },
      { value: "#0f0b2a", label: "Night Sky", color: "#0f0b2a" },
      { value: "#14181f", label: "Midnight", color: "#14181f" },
    ],
    []
  );

  return (
    <div className="p-4">
      <div className="flex items-center justify-between flex-col gap-4">
        <div className="flex items-center justify-start space-x-2  w-full">
          <Paintbrush className="h-4 w-4" />
          <h3 className="font-medium text-sm">Background</h3>
        </div>

        <div className="grid grid-cols-3 gap-2 w-full">
          {backgroundOptions.map((option) => (
            <ColorOption
              key={option.label}
              option={option}
              isSelected={customBackground === option.value}
              onClick={() => setCustomBackground(option.value)}
              currentTheme={currentTheme}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BackgroundSelector;
