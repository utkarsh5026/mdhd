import { Wifi, WifiOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useIsOnline } from '@/services/offline';

type Status = 'online' | 'offline' | 'back-online';

/**
 * Thin banner that appears while the browser is offline, and flashes a
 * confirmation when the connection returns.
 *
 * Deliberately worded as a state ("Reading offline"), not a warning: every
 * document lives in IndexedDB, so losing the network costs the user nothing
 * but sync.
 */
const OfflineIndicator: React.FC = () => {
  const isOnline = useIsOnline();
  const [status, setStatus] = useState<Status>(isOnline ? 'online' : 'offline');
  const wasOffline = useRef(!isOnline);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      setStatus('offline');
      return;
    }

    if (!wasOffline.current) return;
    wasOffline.current = false;
    setStatus('back-online');
    const id = setTimeout(() => setStatus('online'), 1500);
    return () => clearTimeout(id);
  }, [isOnline]);

  const visible = status !== 'online';
  const isBackOnline = status === 'back-online';

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-100 flex items-center justify-center gap-1.5 text-white text-xs py-1 transition-all duration-300 ${visible ? 'translate-y-0' : '-translate-y-full'} ${isBackOnline ? 'bg-emerald-500/90' : 'bg-amber-500/90'}`}
    >
      {isBackOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
      <span>{isBackOnline ? 'Back online' : 'Reading offline'}</span>
    </div>
  );
};

OfflineIndicator.displayName = 'OfflineIndicator';
export default OfflineIndicator;
