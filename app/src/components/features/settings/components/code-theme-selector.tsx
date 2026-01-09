import React, { memo, useRef, useState, useEffect } from 'react';
import { useCodeThemeStore, type ThemeKey } from '@/components/features/settings/store/code-theme';
import { useCodeDisplaySettingsStore } from '@/components/features/settings/store/code-display-settings';
import { Code } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
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
          'border rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer group p-2',
          isSelected ? 'border-primary/50 bg-primary/5 shadow-md' : 'border-none rounded-2xl'
        )}
        onClick={onClick}
      >
        {/* Theme Header */}
        <div className="px-4 py-3 border-b border-border/20 bg-card/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm">{theme.name}</div>
          </div>
        </div>

        <div className="relative max-h-30 overflow-hidden [&_.cm-scroller]:overflow-hidden!">
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
              <span className="text-xs text-muted-foreground">Loading preview...</span>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 h-4 bg-linear-to-t from-card/80 to-transparent pointer-events-none" />
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
        description="Choose how code blocks are highlighted and styled"
        rightContent={
          <div className="text-right">
            <div className="text-xs text-muted-foreground mb-1">Currently Active</div>
            <Badge variant="outline" className="text-xs px-3 py-1 bg-primary/10 border-none">
              {getCurrentThemeName()}
            </Badge>
          </div>
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
