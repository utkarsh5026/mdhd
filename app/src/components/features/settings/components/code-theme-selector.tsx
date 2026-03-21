import { Check, Code } from 'lucide-react';
import React from 'react';

import { type ThemeKey, useCodeThemeStore } from '@/components/features/settings/store/code-theme';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

import { SettingsHeader } from './settings-commons';

const CodeThemeSelector: React.FC = () => {
  const { selectedTheme, setTheme, getThemesByCategory } = useCodeThemeStore();

  const themeCategories = getThemesByCategory();

  return (
    <div className="space-y-6">
      <SettingsHeader
        icon={<Code className="h-4 w-4 text-primary" />}
        title="Code Syntax Theme"
        description="Choose how code blocks are highlighted"
      />

      <ScrollArea className="max-h-full pr-2">
        <div className="space-y-4">
          {Object.entries(themeCategories).map(([categoryName, themes]) => (
            <div key={categoryName} className="space-y-1">
              <div className="text-xs text-muted-foreground px-1 mb-1.5">
                {categoryName === 'Dark Themes' ? '🌙 ' : '☀️ '}
                {categoryName}
              </div>
              {Object.entries(themes).map(([themeKey, theme]) => {
                const isSelected = selectedTheme === themeKey;
                return (
                  <div
                    key={themeKey}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors',
                      isSelected
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground'
                    )}
                    onClick={() => setTheme(themeKey as ThemeKey)}
                  >
                    <span className="text-sm truncate">{theme.name}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CodeThemeSelector;
