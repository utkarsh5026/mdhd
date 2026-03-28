import { Bookmark, BookmarkCheck, FileText, Maximize, MoreHorizontal, Share2 } from 'lucide-react';
import { memo } from 'react';

import {
  useBookmarkActions,
  useIsCurrentSectionBookmarked,
} from '@/components/features/content-reading/hooks';
import Icon from '@/components/ui/icon';
import {
  ListPopover,
  ListPopoverContent,
  ListPopoverGroup,
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
    const { toggleBookmark } = useBookmarkActions();

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
            >
              {isBookmarked ? 'Remove Bookmark' : 'Bookmark Section'}
            </ListPopoverItem>
          </ListPopoverGroup>
        </ListPopoverContent>
      </ListPopover>
    );
  }
);

HeaderActionsMenu.displayName = 'HeaderActionsMenu';

export default HeaderActionsMenu;
