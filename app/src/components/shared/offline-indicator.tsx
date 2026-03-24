import { Wifi, WifiOff } from 'lucide-react';
import { memo, useEffect, useRef, useState } from 'react';

type Status = 'online' | 'offline' | 'back-online';

const OfflineIndicator: React.FC = memo(() => {
  const [status, setStatus] = useState<Status>(navigator.onLine ? 'online' : 'offline');
  const wasOffline = useRef(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      if (wasOffline.current) {
        setStatus('back-online');
        setTimeout(() => setStatus('online'), 1500);
      }
      wasOffline.current = false;
    };
    const handleOffline = () => {
      wasOffline.current = true;
      setStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
});

OfflineIndicator.displayName = 'OfflineIndicator';
export default OfflineIndicator;
