import React from 'react';
import { Settings2, Hash, Braces, WrapText, LucideIcon } from 'lucide-react';
import { useCodeDisplaySettingsStore } from '@/components/features/settings/store/code-display-settings';
import { useCodeThemeStore } from '@/components/features/settings/store/code-theme';
import CodeMirrorDisplay from '@/components/features/markdown-render/components/renderers/codemirror-display';
import { SettingsHeader, SettingToggle } from './settings-commons';

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
    <div className="space-y-6 min-w-0 overflow-hidden">
      <SettingsHeader
        icon={<Settings2 className="h-4 w-4 text-primary" />}
        title="Code Display Options"
        description="Customize how code blocks appear"
      />

      {/* Settings Toggles */}
      <div className="space-y-3">
        {settingOptions.map(({ icon: Icon, title, description, settingKey, setter }) => (
          <SettingToggle
            key={settingKey}
            icon={<Icon className="h-4 w-4" />}
            title={title}
            description={description}
            checked={settings[settingKey]}
            onCheckedChange={setter}
          />
        ))}
      </div>

      {/* Live Preview */}
      <div className="space-y-3 w-0 min-w-full overflow-hidden">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Live Preview
        </div>
        <div className="border-8 border-border/30 rounded-2xl overflow-hidden w-full">
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
