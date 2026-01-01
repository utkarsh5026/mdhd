import React from 'react';
import { Settings2, Hash, Braces, WrapText } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useCodeDisplaySettingsStore } from '@/components/features/settings/store/code-display-settings';
import { useCodeThemeStore } from '@/components/features/settings/store/code-theme';
import CodeMirrorDisplay from '@/components/features/markdown-render/components/renderers/codemirror-display';

const sampleCode = `function greet(name: string) {
  const message = \`Hello, \${name}!\`;
  console.log(message);
  return message;
}

// Call the function with a very long argument that might need wrapping
greet("World");`;

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

const CodeDisplaySelector: React.FC = () => {
  const { settings, setShowLineNumbers, setEnableCodeFolding, setEnableWordWrap } =
    useCodeDisplaySettingsStore();
  const { selectedTheme } = useCodeThemeStore();

  return (
    <div className="space-y-6 min-w-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border/20">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Settings2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Code Display Options</h3>
            <p className="text-sm text-muted-foreground">Customize how code blocks appear</p>
          </div>
        </div>
      </div>

      {/* Settings Toggles */}
      <div className="space-y-3">
        <SettingToggle
          icon={<Hash className="h-4 w-4" />}
          title="Line Numbers"
          description="Show line numbers in code blocks"
          checked={settings.showLineNumbers}
          onCheckedChange={setShowLineNumbers}
        />

        <SettingToggle
          icon={<Braces className="h-4 w-4" />}
          title="Code Folding"
          description="Allow collapsing code sections"
          checked={settings.enableCodeFolding}
          onCheckedChange={setEnableCodeFolding}
        />

        <SettingToggle
          icon={<WrapText className="h-4 w-4" />}
          title="Word Wrap"
          description="Wrap long lines instead of scrolling"
          checked={settings.enableWordWrap}
          onCheckedChange={setEnableWordWrap}
        />
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
