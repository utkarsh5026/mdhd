import type { LucideIcon } from 'lucide-react';
import { FolderTree, List } from 'lucide-react';
import React, { memo, useCallback } from 'react';

import FilesPanel from '@/components/features/file-explorer/components/files-panel';
import OutlinePanel from '@/components/features/file-explorer/components/outline-panel';
import { Button } from '@/components/ui/button';
import { TooltipButton } from '@/components/ui/tooltip-button';
import { useLocalStorage } from '@/hooks';
import { cn } from '@/lib/utils';
import type { StoredFile } from '@/services/indexeddb';

const ACTIVE_PANEL_KEY = 'mdhd-sidebar-panel';

interface Panel {
  id: string;
  icon: LucideIcon;
  tooltip: string;
  content: React.ReactNode;
}

interface SidebarProps {
  className?: string;
  onFileSelect?: (file: StoredFile) => void;
}

const DEFAULT_PANELS: Panel[] = [
  { id: 'files', icon: FolderTree, tooltip: 'Files', content: <FilesPanel /> },
  { id: 'outline', icon: List, tooltip: 'Outline', content: <OutlinePanel /> },
];

const Sidebar: React.FC<SidebarProps> = memo(({ className, onFileSelect }) => {
  const panels = onFileSelect
    ? [
        { ...DEFAULT_PANELS[0], content: <FilesPanel onFileSelect={onFileSelect} /> },
        DEFAULT_PANELS[1],
      ]
    : DEFAULT_PANELS;

  const { storedValue: activePanel, setValue: setActivePanel } = useLocalStorage<string | null>(
    ACTIVE_PANEL_KEY,
    panels[0]?.id ?? null
  );

  const togglePanel = useCallback(
    (panelId: string) => {
      setActivePanel(activePanel === panelId ? null : panelId);
    },
    [activePanel, setActivePanel]
  );

  const isPanelOpen = activePanel !== null;
  const activePanelDef = panels.find((p) => p.id === activePanel);

  return (
    <div className={cn('flex overflow-hidden bg-card/80', className, !isPanelOpen && 'w-10')}>
      {/* Activity bar */}
      <div className="flex flex-col items-center w-10 shrink-0 py-2 gap-1">
        {panels.map((panel) => {
          const Icon = panel.icon;
          return (
            <TooltipButton
              key={panel.id}
              button={
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn('h-7 w-7', activePanel === panel.id && 'bg-muted')}
                  onClick={() => togglePanel(panel.id)}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              }
              tooltipText={panel.tooltip}
            />
          );
        })}
      </div>

      {/* Active panel content */}
      {activePanelDef && activePanelDef.content}
    </div>
  );
});

Sidebar.displayName = 'Sidebar';
export default Sidebar;
