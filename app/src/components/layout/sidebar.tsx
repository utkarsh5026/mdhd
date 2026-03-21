import type { LucideIcon } from 'lucide-react';
import { FolderTree, Layers, List } from 'lucide-react';
import React, { memo, useCallback } from 'react';

import SnippetsPanel from '@/components/features/content-reading/components/snippets/snippets-panel';
import FilesPanel from '@/components/features/file-explorer/components/files-panel';
import OutlinePanel from '@/components/features/file-explorer/components/outline-panel';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { TooltipButton } from '@/components/ui/tooltip-button';
import { useLocalStorage } from '@/hooks';
import { cn } from '@/lib/utils';
import type { StoredFile } from '@/services/indexeddb';

const ACTIVE_PANEL_KEY = 'mdhd-sidebar-panel';

export type SidebarPosition = 'left' | 'right';

interface Panel {
  id: string;
  icon: LucideIcon;
  tooltip: string;
  content: React.ReactNode;
}

interface SidebarProps {
  className?: string;
  onFileSelect?: (file: StoredFile) => void;
  position: SidebarPosition;
  onPositionChange: (position: SidebarPosition) => void;
}

const DEFAULT_PANELS: Panel[] = [
  { id: 'files', icon: FolderTree, tooltip: 'Files', content: <FilesPanel /> },
  { id: 'outline', icon: List, tooltip: 'Outline', content: <OutlinePanel /> },
  { id: 'snippets', icon: Layers, tooltip: 'Snippets', content: <SnippetsPanel /> },
];

const Sidebar: React.FC<SidebarProps> = memo(
  ({ className, onFileSelect, position, onPositionChange }) => {
    const panels = onFileSelect
      ? [
          { ...DEFAULT_PANELS[0], content: <FilesPanel onFileSelect={onFileSelect} /> },
          DEFAULT_PANELS[1],
          DEFAULT_PANELS[2],
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

    const togglePosition = useCallback(() => {
      onPositionChange(position === 'left' ? 'right' : 'left');
    }, [position, onPositionChange]);

    const isPanelOpen = activePanel !== null;
    const activePanelDef = panels.find((p) => p.id === activePanel);
    const isRight = position === 'right';

    const activityBar = (
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
    );

    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className={cn('flex overflow-hidden bg-card/80', className, !isPanelOpen && 'w-10')}>
            {isRight && activePanelDef && (
              <div className="flex-1 min-w-0 min-h-0 overflow-auto">{activePanelDef.content}</div>
            )}

            {activityBar}

            {!isRight && activePanelDef && (
              <div className="flex-1 min-w-0 min-h-0 overflow-auto">{activePanelDef.content}</div>
            )}
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-48 font-cascadia-code rounded-2xl">
          <ContextMenuItem onSelect={togglePosition} className="py-2 px-3">
            Move Sidebar to {isRight ? 'Left' : 'Right'}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  }
);

Sidebar.displayName = 'Sidebar';
export default Sidebar;
