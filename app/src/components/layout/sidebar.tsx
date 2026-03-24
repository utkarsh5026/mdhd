import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeftRight,
  Files,
  Layers,
  Palette,
  Search,
  Settings,
  TableOfContents,
  X,
} from 'lucide-react';
import React, { memo, useCallback, useEffect } from 'react';
import { FaGithub } from 'react-icons/fa';
import { useSwipeable } from 'react-swipeable';

import SearchPanel from '@/components/features/content-reading/components/search/search-panel';
import SnippetsPanel from '@/components/features/content-reading/components/snippets/snippets-panel';
import FilesPanel from '@/components/features/file-explorer/components/files-panel';
import OutlinePanel from '@/components/features/file-explorer/components/outline-panel';
import { MarkdownStylePanel } from '@/components/features/markdown-style';
import { SettingsPanel } from '@/components/features/settings';
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
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const DEFAULT_PANELS: Panel[] = [
  { id: 'files', icon: Files, tooltip: 'Files', content: <FilesPanel /> },
  { id: 'outline', icon: TableOfContents, tooltip: 'Outline', content: <OutlinePanel /> },
  { id: 'snippets', icon: Layers, tooltip: 'Snippets', content: <SnippetsPanel /> },
  { id: 'search', icon: Search, tooltip: 'Search', content: <SearchPanel /> },
  { id: 'style', icon: Palette, tooltip: 'Style', content: <MarkdownStylePanel /> },
  { id: 'settings', icon: Settings, tooltip: 'Settings', content: <SettingsPanel /> },
];

const Sidebar: React.FC<SidebarProps> = memo(
  ({
    className,
    onFileSelect,
    position,
    onPositionChange,
    isMobileOpen = false,
    onMobileClose,
  }) => {
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

    // When mobile sidebar opens, ensure a panel is visible
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
      window.addEventListener('mdhd:activate-panel', handleActivatePanel);
      return () => window.removeEventListener('mdhd:activate-panel', handleActivatePanel);
    }, [setActivePanel]);

    const isPanelOpen = activePanel !== null;
    const activePanelDef = panels.find((p) => p.id === activePanel);
    const isRight = position === 'right';

    const swipeHandlers = useSwipeable({
      onSwipedLeft: () => {
        if (isMobileOpen && !isRight) onMobileClose?.();
      },
      onSwipedRight: () => {
        if (isMobileOpen && isRight) onMobileClose?.();
      },
      delta: 50,
      trackTouch: true,
      trackMouse: false,
    });

    const activityBar = (
      <div className="flex flex-col items-center w-12 sm:w-10 shrink-0 py-2 gap-1">
        {panels.map((panel) => {
          const Icon = panel.icon;
          return (
            <TooltipButton
              key={panel.id}
              button={
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn('h-9 w-9 sm:h-7 sm:w-7', activePanel === panel.id && 'bg-muted')}
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
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={onMobileClose}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={togglePosition}
            aria-label={`Move sidebar to ${isRight ? 'left' : 'right'}`}
          >
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
          <TooltipButton
            button={
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 sm:h-7 sm:w-7"
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
      <>
        {/* Mobile backdrop */}
        <div
          className={cn(
            'fixed inset-0 z-50 bg-background/50 backdrop-blur-sm md:hidden transition-opacity duration-300',
            isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          )}
          onClick={onMobileClose}
        />

        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              {...swipeHandlers}
              className={cn(
                'flex overflow-hidden bg-card/80 transition-transform duration-300 ease-in-out',
                // Mobile: fixed overlay, slides in/out
                'fixed inset-0 z-50 md:hidden',
                isRight ? 'right-0' : 'left-0',
                isMobileOpen ? 'translate-x-0' : isRight ? 'translate-x-full' : '-translate-x-full',
                // Desktop: static in flow, restore className width/border
                'md:relative md:inset-auto md:z-auto md:translate-x-0 md:flex',
                !isPanelOpen ? 'md:w-10' : 'md:w-80',
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
      </>
    );
  }
);

Sidebar.displayName = 'Sidebar';
export default Sidebar;
