import React from 'react';
import { BookOpen, Focus, Layers, ScrollText, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  useIsZenMode,
  useZenModeActions,
  useReadingMode,
  useReadingModeActions,
} from '@/components/features/content-reading/store/use-reading-store';

interface SettingToggleProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

const SettingToggle: React.FC<SettingToggleProps> = ({
  icon,
  title,
  description,
  checked,
  onCheckedChange,
}) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 cursor-pointer group',
        checked
          ? 'border-primary/30 bg-primary/5'
          : 'border-border/30 bg-card/30 hover:border-border/50 hover:bg-card/50'
      )}
      onClick={() => onCheckedChange(!checked)}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'p-2 rounded-full transition-colors duration-200',
            checked ? 'bg-primary/20 text-primary' : 'bg-muted/50 text-muted-foreground'
          )}
        >
          {icon}
        </div>
        <div>
          <div className="font-medium text-sm">{title}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

interface ReadingModeOptionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}

const ReadingModeOption: React.FC<ReadingModeOptionProps> = ({
  icon,
  title,
  description,
  isSelected,
  onClick,
}) => {
  return (
    <button
      className={cn(
        'w-full text-left p-4 rounded-2xl border transition-all duration-200',
        isSelected
          ? 'border-primary/30 bg-primary/5'
          : 'border-border/30 bg-card/30 hover:border-border/50 hover:bg-card/50'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'p-2 rounded-full transition-colors duration-200 shrink-0',
            isSelected ? 'bg-primary/20 text-primary' : 'bg-muted/50 text-muted-foreground'
          )}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{title}</span>
            {isSelected && (
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary shrink-0">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
    </button>
  );
};

const READING_MODE_OPTIONS = [
  {
    mode: 'card' as const,
    icon: Layers,
    title: 'Card Mode',
    description: 'Navigate section by section with swipe gestures. Best for focused reading.',
  },
  {
    mode: 'scroll' as const,
    icon: ScrollText,
    title: 'Scroll Mode',
    description: 'Continuous scrolling through all content. Best for quick scanning.',
  },
] as const;

const ReadingModeSelector: React.FC = () => {
  const isZenMode = useIsZenMode();
  const { toggleZenMode } = useZenModeActions();
  const readingMode = useReadingMode();
  const { toggleReadingMode } = useReadingModeActions();

  const handleModeSelect = (mode: 'card' | 'scroll') => {
    if (readingMode !== mode) {
      toggleReadingMode();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border/20">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Reading Mode</h3>
            <p className="text-sm text-muted-foreground">Control how you read content</p>
          </div>
        </div>
      </div>

      {/* Zen Mode Toggle */}
      <div className="space-y-3">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Focus Mode
        </div>
        <SettingToggle
          icon={<Focus className="h-4 w-4" />}
          title="Zen Mode"
          description="Hide all UI controls for distraction-free reading"
          checked={isZenMode}
          onCheckedChange={() => toggleZenMode()}
        />
      </div>

      {/* Reading Mode Selection */}
      <div className="space-y-3">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Navigation Style
        </div>
        <div className="space-y-2">
          {READING_MODE_OPTIONS.map(({ mode, icon: Icon, title, description }) => (
            <ReadingModeOption
              key={mode}
              icon={<Icon className="h-4 w-4" />}
              title={title}
              description={description}
              isSelected={readingMode === mode}
              onClick={() => handleModeSelect(mode)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReadingModeSelector;
