import React from 'react';
import { BookOpen, Focus, Layers, ScrollText, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useIsZenMode,
  useZenModeActions,
  useReadingMode,
  useReadingModeActions,
} from '@/components/features/content-reading/store/use-reading-store';
import { SettingsHeader } from './settings-header';
import { SettingToggle } from './setting-toggle';

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
      <SettingsHeader
        icon={<BookOpen className="h-4 w-4 text-primary" />}
        title="Reading Mode"
        description="Control how you read content"
      />

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
