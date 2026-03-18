import React from 'react';
import { Settings2, Hash, Braces, WrapText, LucideIcon } from 'lucide-react';
import { useCodeDisplaySettingsStore } from '@/components/features/settings/store/code-display-settings';
import { useCodeThemeStore } from '@/components/features/settings/store/code-theme';
import CodeMirrorDisplay from '@/components/features/markdown-render/components/renderers/codemirror-display';
import { SettingsHeader } from './settings-commons';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const sampleCode = `function greet(name: string) {
  const message = \`Hello, \${name}!\`;
  console.log(message);
  return message;
}

// Call the function with a very long argument that might need wrapping
greet("World");`;

interface SettingOption {
  icon: LucideIcon;
  title: string;
  description: string;
  settingKey: 'showLineNumbers' | 'enableCodeFolding' | 'enableWordWrap';
  setter: (value: boolean) => void;
}

const CodeDisplaySelector: React.FC = () => {
  const { settings, setShowLineNumbers, setEnableCodeFolding, setEnableWordWrap } =
    useCodeDisplaySettingsStore();
  const { selectedTheme } = useCodeThemeStore();

  const settingOptions: SettingOption[] = [
    {
      icon: Hash,
      title: 'Line Numbers',
      description: 'Show line numbers in code blocks',
      settingKey: 'showLineNumbers',
      setter: setShowLineNumbers,
    },
    {
      icon: Braces,
      title: 'Code Folding',
      description: 'Allow collapsing code sections',
      settingKey: 'enableCodeFolding',
      setter: setEnableCodeFolding,
    },
    {
      icon: WrapText,
      title: 'Word Wrap',
      description: 'Wrap long lines instead of scrolling',
      settingKey: 'enableWordWrap',
      setter: setEnableWordWrap,
    },
  ];

  return (
    <div className="space-y-5 min-w-0 overflow-hidden">
      <SettingsHeader
        icon={<Settings2 className="h-4 w-4 text-primary" />}
        title="Code Display"
        description="Customize how code blocks appear"
      />

      {/* Toggles */}
      <div className="-mx-2">
        {settingOptions.map(({ icon: Icon, title, description, settingKey, setter }) => {
          const checked = settings[settingKey];
          return (
            <div
              key={settingKey}
              className="flex items-center justify-between px-2 py-2.5 rounded-xl hover:bg-accent/50 transition-colors cursor-pointer group"
              onClick={() => setter(!checked)}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    'h-4 w-4 transition-colors',
                    checked ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                <div>
                  <div className="text-sm font-medium leading-none mb-0.5">{title}</div>
                  <div className="text-xs text-muted-foreground">{description}</div>
                </div>
              </div>
              <Switch
                checked={checked}
                onCheckedChange={setter}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          );
        })}
      </div>

      {/* Live Preview */}
      <div className="space-y-2 w-0 min-w-full overflow-hidden">
        <div className="text-xs text-muted-foreground px-1">Live Preview</div>
        <div className="rounded-xl overflow-hidden w-full border border-border/20">
          <CodeMirrorDisplay
            code={sampleCode}
            language="typescript"
            themeKey={selectedTheme}
            showLineNumbers={settings.showLineNumbers}
            enableCodeFolding={settings.enableCodeFolding}
            enableWordWrap={settings.enableWordWrap}
            className="overflow-hidden"
          />
        </div>
      </div>
    </div>
  );
};

export default CodeDisplaySelector;
