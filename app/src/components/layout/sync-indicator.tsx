import {
  BookMarked,
  Cloud,
  CloudOff,
  Code,
  Layout,
  Monitor,
  Palette,
  RefreshCw,
  Type,
} from 'lucide-react';
import { memo } from 'react';

import {
  ListPopover,
  ListPopoverContent,
  ListPopoverGroup,
  ListPopoverGroupLabel,
  ListPopoverItem,
  ListPopoverTrigger,
} from '@/components/ui/list-popover';
import { Switch } from '@/components/ui/switch';
import { useIsAuthenticated } from '@/services/auth';
import { useIsOnline } from '@/services/offline';
import {
  useDisabledSyncKeys,
  useIsSyncing,
  useLastSyncAt,
  useSyncActions,
  useSyncError,
  useSyncPreferencesActions,
} from '@/services/sync';
import { syncableStores } from '@/services/sync/syncable-settings';
import { formatTimeAgo } from '@/utils/time';

import { Button } from '../ui/button';

const KEY_ICONS: Record<string, React.ReactNode> = {
  'reading-settings': <Layout className="h-3 w-3" />,
  'code-display-settings': <Code className="h-3 w-3" />,
  'code-theme-storage': <Monitor className="h-3 w-3" />,
  'markdown-style': <Type className="h-3 w-3" />,
  theme: <Palette className="h-3 w-3" />,
  'bookmarked-themes': <BookMarked className="h-3 w-3" />,
};

const SyncIndicator = memo(() => {
  const isAuthenticated = useIsAuthenticated();
  const isOnline = useIsOnline();
  const isSyncing = useIsSyncing();
  const lastSyncAt = useLastSyncAt();
  const syncError = useSyncError();
  const { startSync, clearError } = useSyncActions();
  const disabledKeys = useDisabledSyncKeys();
  const { setKeyEnabled } = useSyncPreferencesActions();

  if (!isAuthenticated) return null;

  const handleSync = () => {
    if (syncError) clearError();
    startSync();
  };

  let statusIcon: React.ReactNode;
  let statusText: string;

  if (!isOnline) {
    statusIcon = <CloudOff className="h-4 w-4 text-muted-foreground" />;
    statusText = lastSyncAt
      ? `Offline — synced ${formatTimeAgo(new Date(lastSyncAt).getTime())}`
      : 'Offline — will sync when reconnected';
  } else if (isSyncing) {
    statusIcon = <RefreshCw className="h-4 w-4 animate-spin" />;
    statusText = 'Syncing...';
  } else if (syncError) {
    statusIcon = <CloudOff className="h-4 w-4 text-destructive" />;
    statusText = 'Sync failed';
  } else if (lastSyncAt) {
    statusIcon = <Cloud className="h-4 w-4 text-muted-foreground" />;
    statusText = `Synced ${formatTimeAgo(new Date(lastSyncAt).getTime())}`;
  } else {
    statusIcon = <Cloud className="h-4 w-4 text-muted-foreground" />;
    statusText = 'Not yet synced';
  }

  const footer = (
    <div className="border-t border-border/30 p-1.5">
      <Button
        variant="ghost"
        size="sm"
        className="w-full h-7 text-[11px] text-muted-foreground gap-1.5 font-normal"
        onClick={handleSync}
        disabled={isSyncing || !isOnline}
      >
        <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? 'Syncing...' : 'Sync now'}
      </Button>
    </div>
  );

  return (
    <ListPopover>
      <ListPopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Sync settings">
          {statusIcon}
        </Button>
      </ListPopoverTrigger>

      <ListPopoverContent side="right" align="end" footer={footer}>
        <ListPopoverGroup>
          <ListPopoverGroupLabel>{statusText}</ListPopoverGroupLabel>

          {syncableStores.map((store) => {
            const enabled = !disabledKeys.includes(store.key);
            return (
              <ListPopoverItem
                key={store.key}
                icon={
                  <span className="text-muted-foreground">
                    {KEY_ICONS[store.key] ?? <Cloud className="h-3 w-3" />}
                  </span>
                }
                suffix={
                  <Switch
                    checked={enabled}
                    onCheckedChange={(checked) => setKeyEnabled(store.key, checked)}
                    onClick={(e) => e.stopPropagation()}
                    className="scale-[0.65] origin-right"
                  />
                }
                onClick={() => setKeyEnabled(store.key, !enabled)}
                className="text-muted-foreground"
              >
                {store.label}
              </ListPopoverItem>
            );
          })}
        </ListPopoverGroup>
      </ListPopoverContent>
    </ListPopover>
  );
});

SyncIndicator.displayName = 'SyncIndicator';

export default SyncIndicator;
