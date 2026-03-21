import { Settings2 } from 'lucide-react';
import React from 'react';

import CodeMirrorDisplay from '@/components/features/markdown-render/components/renderers/codemirror-display';
import { useCodeDisplaySettingsStore } from '@/components/features/settings/store/code-display-settings';
import { useCodeThemeStore } from '@/components/features/settings/store/code-theme';
import { Switch } from '@/components/ui/switch';

import { SettingsHeader } from './settings-commons';

const sampleCode = `function greet(name: string) {
  const message = \`Hello, \${name}!\`;
  console.log(message);
  return message;
}

// Call the function with a very long argument that might need wrapping
greet("World");`;

interface SettingOption {
  title: string;
  description: string;
  settingKey: 'showLineNumbers' | 'enableCodeFolding' | 'enableWordWrap' | 'showLanguageLabel';
  setter: (value: boolean) => void;
}

const CodeDisplaySelector: React.FC = () => {
  const {
    settings,
    setShowLineNumbers,
    setEnableCodeFolding,
    setEnableWordWrap,
    setShowLanguageLabel,
  } = useCodeDisplaySettingsStore();
  const { selectedTheme } = useCodeThemeStore();

  const settingOptions: SettingOption[] = [
    {
      title: 'Line Numbers',
      description: 'Show line numbers in code blocks',
      settingKey: 'showLineNumbers',
      setter: setShowLineNumbers,
    },
    {
      title: 'Code Folding',
      description: 'Allow collapsing code sections',
      settingKey: 'enableCodeFolding',
      setter: setEnableCodeFolding,
    },
    {
      title: 'Word Wrap',
      description: 'Wrap long lines instead of scrolling',
      settingKey: 'enableWordWrap',
      setter: setEnableWordWrap,
    },
    {
      title: 'Language Label',
      description: 'Show language name and icon',
      settingKey: 'showLanguageLabel',
      setter: setShowLanguageLabel,
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
      <div className="-mx-2 text-sm">
        {settingOptions.map(({ title, description, settingKey, setter }) => {
          const checked = settings[settingKey];
          return (
            <div
              key={settingKey}
              className="flex items-center justify-between px-2 py-2.5 rounded-xl cursor-pointer"
              onClick={() => setter(!checked)}
            >
              <div>
                <div className="text-sm font-medium leading-none mb-0.5">{title}</div>
                <div className="text-xs text-muted-foreground">{description}</div>
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
        <div className="rounded-2xl overflow-hidden w-full border border-border/20">
          <CodeMirrorDisplay
            code={sampleCode}
            language="typescript"
            themeKey={selectedTheme}
            showLineNumbers={settings.showLineNumbers}
            enableCodeFolding={settings.enableCodeFolding}
            enableWordWrap={settings.enableWordWrap}
            className="overflow-hidden"
            fontSize="0.25 rem"
          />
        </div>
      </div>
    </div>
  );
};

export default CodeDisplaySelector;
