import {
  Bookmark,
  BookmarkCheck,
  ClipboardCopy,
  ClipboardList,
  FileText,
  Maximize,
  MoreHorizontal,
  Pause,
  Share2,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';
import { memo, useCallback, useState } from 'react';

import { useTTSContext } from '@/components/features/content-reading/context/tts-context';
import {
  useBookmarkActions,
  useIsCurrentSectionBookmarked,
  useReadingContent,
  useReadingCurrentSection,
} from '@/components/features/content-reading/hooks';
import { useTabClose } from '@/components/features/tabs/hooks/use-tab-close';
import { useActiveTabId, useTabs } from '@/components/features/tabs/store';
import Icon from '@/components/ui/icon';
import {
  ListPopover,
  ListPopoverContent,
  ListPopoverGroup,
  ListPopoverGroupLabel,
  ListPopoverItem,
  ListPopoverTrigger,
} from '@/components/ui/list-popover';
import { cn } from '@/lib/utils';

interface HeaderActionsMenuProps {
  onFullscreen: () => void;
  onPdfExport: () => void;
  onShare: () => void;
}

const HeaderActionsMenu: React.FC<HeaderActionsMenuProps> = memo(
  ({ onFullscreen, onPdfExport, onShare }) => {
    const isBookmarked = useIsCurrentSectionBookmarked();
    const { toggleBookmark, isUnsavedTab } = useBookmarkActions();
    const tts = useTTSContext();
    const isNarrating = tts.ttsStatus === 'playing' || tts.ttsStatus === 'paused';
    const currentSection = useReadingCurrentSection();
    const { markdown } = useReadingContent();

    const tabs = useTabs();
    const activeTabId = useActiveTabId();
    const { closeTab, closeAllTabs } = useTabClose();

    const [copiedSection, setCopiedSection] = useState(false);
    const [copiedAll, setCopiedAll] = useState(false);

    const copySection = useCallback(() => {
      if (!currentSection) return;
      navigator.clipboard.writeText(currentSection.content).then(() => {
        setCopiedSection(true);
        setTimeout(() => setCopiedSection(false), 2000);
      });
    }, [currentSection]);

    const copyAll = useCallback(() => {
      navigator.clipboard.writeText(markdown).then(() => {
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2000);
      });
    }, [markdown]);

    return (
      <ListPopover>
        <ListPopoverTrigger asChild>
          <button
            aria-label="More actions"
            className={cn(
              'p-1.5 rounded-md transition-colors',
              'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            )}
          >
            <Icon icon={MoreHorizontal} size="md" />
          </button>
        </ListPopoverTrigger>
        <ListPopoverContent align="end" title="Actions">
          <ListPopoverGroup>
            <ListPopoverItem icon={<Icon icon={Maximize} size="sm" />} onClick={onFullscreen}>
              Enter Fullscreen
            </ListPopoverItem>
            {tts.isSupported && (
              <ListPopoverItem
                icon={
                  isNarrating ? (
                    <Icon icon={Pause} size="sm" className="text-primary" />
                  ) : (
                    <Icon icon={Volume2} size="sm" />
                  )
                }
                isActive={isNarrating}
                onClick={tts.togglePlayPause}
              >
                {tts.ttsStatus === 'playing'
                  ? 'Pause Narration'
                  : tts.ttsStatus === 'paused'
                    ? 'Resume Narration'
                    : 'Narrate'}
              </ListPopoverItem>
            )}
          </ListPopoverGroup>
          <ListPopoverGroup className="border-t border-border/40 mt-1 pt-1">
            <ListPopoverItem
              icon={
                <Icon
                  icon={ClipboardCopy}
                  size="sm"
                  className={copiedSection ? 'text-green-500' : ''}
                />
              }
              onClick={copySection}
              isActive={copiedSection}
            >
              {copiedSection ? 'Copied!' : 'Copy Section'}
            </ListPopoverItem>
            <ListPopoverItem
              icon={
                <Icon
                  icon={ClipboardList}
                  size="sm"
                  className={copiedAll ? 'text-green-500' : ''}
                />
              }
              onClick={copyAll}
              isActive={copiedAll}
            >
              {copiedAll ? 'Copied!' : 'Copy All Markdown'}
            </ListPopoverItem>
          </ListPopoverGroup>
          <ListPopoverGroup className="border-t border-border/40 mt-1 pt-1">
            <ListPopoverItem icon={<Icon icon={FileText} size="sm" />} onClick={onPdfExport}>
              Export PDF
            </ListPopoverItem>
            <ListPopoverItem icon={<Icon icon={Share2} size="sm" />} onClick={onShare}>
              Share Document
            </ListPopoverItem>
          </ListPopoverGroup>
          <ListPopoverGroup className="border-t border-border/40 mt-1 pt-1">
            <ListPopoverItem
              icon={
                isBookmarked ? (
                  <Icon icon={BookmarkCheck} size="sm" className="text-amber-400" />
                ) : (
                  <Icon icon={Bookmark} size="sm" />
                )
              }
              isActive={isBookmarked}
              onClick={toggleBookmark}
              suffix={
                isUnsavedTab ? (
                  <span className="text-[9px] px-1 rounded bg-muted/50 text-muted-foreground/50 leading-4">
                    local
                  </span>
                ) : undefined
              }
            >
              {isBookmarked ? 'Remove Bookmark' : 'Bookmark Section'}
            </ListPopoverItem>
          </ListPopoverGroup>
          <ListPopoverGroup className="border-t border-border/40 mt-1 pt-1 sm:hidden">
            <ListPopoverGroupLabel>Tabs</ListPopoverGroupLabel>
            <ListPopoverItem
              icon={<Icon icon={X} size="sm" />}
              onClick={() => activeTabId && closeTab(activeTabId)}
              disabled={!activeTabId}
            >
              Close this tab
            </ListPopoverItem>
            <ListPopoverItem
              icon={<Icon icon={Trash2} size="sm" />}
              onClick={closeAllTabs}
              disabled={tabs.length === 0}
            >
              Close all tabs
            </ListPopoverItem>
          </ListPopoverGroup>
        </ListPopoverContent>
      </ListPopover>
    );
  }
);

HeaderActionsMenu.displayName = 'HeaderActionsMenu';

export default HeaderActionsMenu;
