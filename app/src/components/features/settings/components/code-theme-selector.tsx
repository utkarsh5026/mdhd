import React, { memo, useRef, useState, useEffect } from 'react';
import { useCodeThemeStore, type ThemeKey } from '@/components/features/settings/store/code-theme';
import { useCodeDisplaySettingsStore } from '@/components/features/settings/store/code-display-settings';
import { Check, Code } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import CodeMirrorDisplay from '@/components/features/markdown-render/components/renderers/codemirror-display';
import { SettingsHeader, ExpandableCategory } from './settings-commons';

const sampleCode = `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)`;

interface CodePreviewProps {
  theme: { name: string };
  themeKey: string;
  isSelected: boolean;
  onClick: () => void;
  showLineNumbers: boolean;
  enableCodeFolding: boolean;
  enableWordWrap: boolean;
}

const CodePreview = memo<CodePreviewProps>(
  ({
    theme,
    themeKey,
    isSelected,
    onClick,
    showLineNumbers,
    enableCodeFolding,
    enableWordWrap,
  }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [hasBeenVisible, setHasBeenVisible] = useState(false);

    useEffect(() => {
      const currentRef = containerRef.current;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setHasBeenVisible(true);
            }
          });
        },
        {
          rootMargin: '50px', // Start loading slightly before coming into view
          threshold: 0.1,
        }
      );

      if (currentRef) {
        observer.observe(currentRef);
      }

      return () => {
        if (currentRef) {
          observer.unobserve(currentRef);
        }
      };
    }, []);

    return (
      <div
        ref={containerRef}
        className={cn(
          'rounded-xl overflow-hidden cursor-pointer transition-all duration-150',
          isSelected ? 'ring-1 ring-primary/50 shadow-sm' : 'opacity-80 hover:opacity-100'
        )}
        onClick={onClick}
      >
        <div className="relative max-h-28 overflow-hidden [&_.cm-scroller]:overflow-hidden!">
          {hasBeenVisible ? (
            <CodeMirrorDisplay
              code={sampleCode}
              language="python"
              themeKey={themeKey as ThemeKey}
              showLineNumbers={showLineNumbers}
              enableCodeFolding={enableCodeFolding}
              enableWordWrap={enableWordWrap}
              className="text-[11px]"
            />
          ) : (
            <div className="h-24 flex items-center justify-center bg-muted/20 animate-pulse">
              <span className="text-xs text-muted-foreground">Loading…</span>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-linear-to-t from-black/20 to-transparent pointer-events-none" />
        </div>

        <div className="flex items-center justify-between px-2.5 py-1.5 bg-muted/20">
          <span className="text-xs text-muted-foreground truncate">{theme.name}</span>
          {isSelected && <Check className="h-3 w-3 text-primary shrink-0" />}
        </div>
      </div>
    );
  }
);

CodePreview.displayName = 'CodePreview';

// Category metadata for code themes
const CODE_CATEGORY_ICONS: Record<string, string> = {
  'Dark Themes': '🌙',
  'Light Themes': '☀️',
};

const CODE_CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'Dark Themes': 'Perfect for night coding sessions',
  'Light Themes': 'Clean and bright for daytime work',
};

const CodeThemeSelector: React.FC = () => {
  const { selectedTheme, setTheme, getCurrentThemeName, getThemesByCategory } = useCodeThemeStore();
  const { settings: displaySettings } = useCodeDisplaySettingsStore();

  const themeCategories = getThemesByCategory();

  return (
    <div className="space-y-6">
      <SettingsHeader
        icon={<Code className="h-4 w-4 text-primary" />}
        title="Code Syntax Theme"
        description="Choose how code blocks are highlighted"
        rightContent={
          <span className="text-xs text-muted-foreground">{getCurrentThemeName()}</span>
        }
      />

      <ScrollArea className="max-h-full pr-2">
        <div className="space-y-4">
          {Object.entries(themeCategories).map(([categoryName, themes]) => {
            const themeEntries = Object.entries(themes);
            const hasActiveTheme = Object.keys(themes).includes(selectedTheme);

            return (
              <ExpandableCategory
                key={categoryName}
                icon={CODE_CATEGORY_ICONS[categoryName] ?? '🎨'}
                title={categoryName}
                description={CODE_CATEGORY_DESCRIPTIONS[categoryName] ?? ''}
                itemCount={themeEntries.length}
                defaultExpanded={hasActiveTheme}
                contentClassName="p-1 grid gap-4 md:grid-cols-1 lg:grid-cols-2"
              >
                {themeEntries.map(([themeKey, theme]) => (
                  <CodePreview
                    key={themeKey}
                    theme={theme}
                    themeKey={themeKey}
                    isSelected={selectedTheme === themeKey}
                    onClick={() => setTheme(themeKey as ThemeKey)}
                    showLineNumbers={displaySettings.showLineNumbers}
                    enableCodeFolding={displaySettings.enableCodeFolding}
                    enableWordWrap={displaySettings.enableWordWrap}
                  />
                ))}
              </ExpandableCategory>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CodeThemeSelector;
