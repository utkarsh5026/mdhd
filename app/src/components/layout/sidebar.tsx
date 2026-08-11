import type { LucideIcon } from 'lucide-react';
import { Bookmark, Files, Layers, Palette, Search, Settings, TableOfContents } from 'lucide-react';
import React, { memo, useCallback, useEffect } from 'react';
import { FaGithub } from 'react-icons/fa';

import SearchPanel from '@/components/features/content-reading/components/search/search-panel';
import SnippetsPanel from '@/components/features/content-reading/components/snippets/snippets-panel';
import BookmarksPanel from '@/components/features/file-explorer/components/bookmarks-panel';
import FilesPanel from '@/components/features/file-explorer/components/files-panel';
import OutlinePanel from '@/components/features/file-explorer/components/outline-panel';
import { MarkdownStylePanel } from '@/components/features/markdown-style';
import { SettingsPanel } from '@/components/features/settings';
import { WhatsNewTrigger } from '@/components/features/whats-new';
import { BottomSheet, BottomSheetContent } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { TooltipButton } from '@/components/ui/tooltip-button';
import { useLocalStorage, useMobile } from '@/hooks';
import { cn } from '@/lib/utils';
import type { StoredFile } from '@/services/indexeddb';

import SyncIndicator from './sync-indicator';

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
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const DEFAULT_PANELS: Panel[] = [
  { id: 'files', icon: Files, tooltip: 'Files', content: <FilesPanel /> },
  { id: 'outline', icon: TableOfContents, tooltip: 'Outline', content: <OutlinePanel /> },
  { id: 'bookmarks', icon: Bookmark, tooltip: 'Bookmarks', content: <BookmarksPanel /> },
  { id: 'snippets', icon: Layers, tooltip: 'Snippets', content: <SnippetsPanel /> },
  { id: 'search', icon: Search, tooltip: 'Search', content: <SearchPanel /> },
  { id: 'style', icon: Palette, tooltip: 'Style', content: <MarkdownStylePanel /> },
  { id: 'settings', icon: Settings, tooltip: 'Settings', content: <SettingsPanel /> },
];

interface MobileSidebarSheetProps {
  panels: Panel[];
  activePanel: string | null;
  togglePanel: (panelId: string) => void;
  open: boolean;
  onClose?: () => void;
}

const MobileSidebarSheet: React.FC<MobileSidebarSheetProps> = memo(
  ({ panels, activePanel, togglePanel, open, onClose }) => {
    const activePanelDef = panels.find((p) => p.id === activePanel);

    return (
      <BottomSheet
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) onClose?.();
        }}
      >
        <BottomSheetContent className="overflow-y-hidden flex flex-col">
          <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border/40 overflow-x-auto shrink-0">
            {panels.map((panel) => {
              const Icon = panel.icon;
              return (
                <Button
                  key={panel.id}
                  variant="ghost"
                  size="icon"
                  className={cn('h-9 w-9 shrink-0', activePanel === panel.id && 'bg-muted')}
                  onClick={() => togglePanel(panel.id)}
                  aria-label={panel.tooltip}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              );
            })}
            <div className="ml-auto flex shrink-0 items-center gap-1">
              <WhatsNewTrigger />
              <SyncIndicator />
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">{activePanelDef?.content}</div>
        </BottomSheetContent>
      </BottomSheet>
    );
  }
);
MobileSidebarSheet.displayName = 'MobileSidebarSheet';

const Sidebar: React.FC<SidebarProps> = memo(
  ({
    className,
    onFileSelect,
    position,
    onPositionChange,
    isMobileOpen = false,
    onMobileClose,
  }) => {
    const { isMobile } = useMobile();

    const panels = onFileSelect
      ? [
          { ...DEFAULT_PANELS[0], content: <FilesPanel onFileSelect={onFileSelect} /> },
          ...DEFAULT_PANELS.slice(1),
        ]
      : DEFAULT_PANELS;

    const { storedValue: activePanel, setValue: setActivePanel } = useLocalStorage<string | null>(
      ACTIVE_PANEL_KEY,
      panels[0]?.id ?? null
    );

    useEffect(() => {
      if (isMobileOpen && activePanel === null) {
        setActivePanel('files');
      }
    }, [isMobileOpen, activePanel, setActivePanel]);

    const togglePanel = useCallback(
      (panelId: string) => {
        setActivePanel(activePanel === panelId ? null : panelId);
      },
      [activePanel, setActivePanel]
    );

    const togglePosition = useCallback(() => {
      onPositionChange(position === 'left' ? 'right' : 'left');
    }, [position, onPositionChange]);

    useEffect(() => {
      const handleActivatePanel = (e: Event) => {
        const panelId = (e as CustomEvent<string>).detail;
        setActivePanel(panelId);
      };
      globalThis.addEventListener('mdhd:activate-panel', handleActivatePanel);
      return () => globalThis.removeEventListener('mdhd:activate-panel', handleActivatePanel);
    }, [setActivePanel]);

    if (isMobile) {
      return (
        <MobileSidebarSheet
          panels={panels}
          activePanel={activePanel}
          togglePanel={togglePanel}
          open={isMobileOpen}
          onClose={onMobileClose}
        />
      );
    }

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

        <div className="mt-auto flex flex-col items-center gap-1">
          <WhatsNewTrigger />
          <SyncIndicator />
          <TooltipButton
            button={
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => window.open('https://github.com/utkarsh5026/mdhd', '_blank')}
              >
                <FaGithub className="h-4 w-4" />
              </Button>
            }
            tooltipText="GitHub"
          />
        </div>
      </div>
    );

    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              'flex overflow-hidden bg-card/80',
              isPanelOpen ? 'w-80' : 'w-10',
              className
            )}
          >
            {isRight && activePanelDef && (
              <div className="flex-1 min-w-0 min-h-0 overflow-auto">{activePanelDef.content}</div>
            )}

            {activityBar}

            {!isRight && activePanelDef && (
              <div className="flex-1 min-w-0 min-h-0 overflow-auto">{activePanelDef.content}</div>
            )}
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-48 rounded-2xl">
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
