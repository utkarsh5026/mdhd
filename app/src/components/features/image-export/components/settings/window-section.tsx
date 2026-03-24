import { Minus } from 'lucide-react';
import React from 'react';
import { FaApple, FaLinux, FaWindows } from 'react-icons/fa';

import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

import { type CodeImageExportSettings, defaultSettings } from '../../store/code-image-export-store';
import { pickKeys, WINDOW_KEYS } from '../../store/types';
import { TITLE_POSITIONS, WINDOW_ACCENT_PRESETS } from '../constants';
import { CollapsibleSection, SelectRow, SliderRow, ToggleGroup } from './shared-controls';

export const WindowSection: React.FC<{
  settings: CodeImageExportSettings;
  updateSettings: (partial: Partial<CodeImageExportSettings>) => void;
  language: string;
}> = ({ settings, updateSettings, language }) => (
  <CollapsibleSection
    title="Window"
    onReset={() => updateSettings(pickKeys(defaultSettings, WINDOW_KEYS))}
  >
    <div className="mb-4 space-y-1.5">
      <ToggleGroup
        options={[
          { value: 'macos', label: 'macOS', icon: <FaApple size={11} /> },
          { value: 'windows', label: 'Windows', icon: <FaWindows size={11} /> },
          { value: 'none', label: 'None', icon: <Minus size={11} /> },
        ]}
        value={settings.windowStyle}
        onChange={(v) =>
          updateSettings({ windowStyle: v as CodeImageExportSettings['windowStyle'] })
        }
      />
      <ToggleGroup
        options={[
          { value: 'linux-gnome', label: 'GNOME', icon: <FaLinux size={11} /> },
          { value: 'linux-kde', label: 'KDE', icon: <FaLinux size={11} /> },
          { value: 'retro-terminal', label: 'Retro' },
        ]}
        value={settings.windowStyle}
        onChange={(v) =>
          updateSettings({ windowStyle: v as CodeImageExportSettings['windowStyle'] })
        }
      />
    </div>

    <div className="space-y-4">
      {settings.windowStyle !== 'none' && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Focused</span>
          <Switch
            checked={settings.windowFocused}
            onCheckedChange={(v) => updateSettings({ windowFocused: v })}
          />
        </div>
      )}

      <div>
        <div className="text-xs text-muted-foreground mb-1.5">Title text</div>
        <Input
          value={settings.titleText}
          onChange={(e) => updateSettings({ titleText: e.target.value })}
          placeholder={language || 'filename.ts'}
          className="h-7 text-xs"
        />
      </div>

      <div>
        <div className="text-xs text-muted-foreground mb-1.5">Title position</div>
        <ToggleGroup
          options={TITLE_POSITIONS}
          value={settings.titlePosition}
          onChange={(v) => updateSettings({ titlePosition: v as 'center' | 'left' | 'right' })}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Language icon</span>
        <Switch
          checked={settings.showTitleIcon}
          onCheckedChange={(v) => updateSettings({ showTitleIcon: v })}
        />
      </div>

      {settings.windowStyle === 'macos' && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Frosted title bar</span>
            <Switch
              checked={settings.titleBarFrosted}
              onCheckedChange={(v) => updateSettings({ titleBarFrosted: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Menu bar</span>
            <Switch
              checked={settings.showMenuBar}
              onCheckedChange={(v) => updateSettings({ showMenuBar: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Dock</span>
            <Switch
              checked={settings.showDock}
              onCheckedChange={(v) => updateSettings({ showDock: v })}
            />
          </div>
        </>
      )}

      {settings.windowStyle === 'linux-gnome' && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Top bar</span>
            <Switch
              checked={settings.showGnomeTopBar}
              onCheckedChange={(v) => updateSettings({ showGnomeTopBar: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Dash</span>
            <Switch
              checked={settings.showGnomeDash}
              onCheckedChange={(v) => updateSettings({ showGnomeDash: v })}
            />
          </div>
        </>
      )}

      {settings.windowStyle === 'linux-kde' && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Panel</span>
          <Switch
            checked={settings.showKdePanel}
            onCheckedChange={(v) => updateSettings({ showKdePanel: v })}
          />
        </div>
      )}

      {settings.windowStyle === 'windows' && (
        <>
          <div>
            <div className="text-xs text-muted-foreground mb-1.5">Accent color</div>
            <div className="flex flex-wrap gap-1.5">
              {WINDOW_ACCENT_PRESETS.map((preset) => (
                <button
                  key={preset.color}
                  className={cn(
                    'w-6 h-6 rounded cursor-pointer transition-all duration-200 border-2 shadow-sm',
                    settings.windowAccentColor === preset.color
                      ? 'border-primary ring-2 ring-primary/25 scale-110'
                      : 'border-transparent hover:scale-110 hover:shadow-md'
                  )}
                  style={{ backgroundColor: preset.color }}
                  onClick={() => updateSettings({ windowAccentColor: preset.color })}
                  title={preset.name}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Taskbar</span>
            <Switch
              checked={settings.showTaskbar}
              onCheckedChange={(v) => updateSettings({ showTaskbar: v })}
            />
          </div>
        </>
      )}

      <SliderRow
        label="Border radius"
        value={settings.borderRadius}
        onChange={(v) => updateSettings({ borderRadius: v })}
        min={0}
        max={32}
        step={2}
        unit="px"
      />

      <SelectRow
        label="Shadow"
        value={settings.shadowSize}
        onValueChange={(v) =>
          updateSettings({ shadowSize: v as 'none' | 'sm' | 'md' | 'lg' | 'xl' })
        }
        options={[
          { value: 'none', label: 'None' },
          { value: 'sm', label: 'Small' },
          { value: 'md', label: 'Medium' },
          { value: 'lg', label: 'Large' },
          { value: 'xl', label: 'Extra Large' },
        ]}
      />
    </div>
  </CollapsibleSection>
);
