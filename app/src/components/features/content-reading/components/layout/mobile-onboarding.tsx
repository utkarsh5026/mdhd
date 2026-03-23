import { memo, useEffect, useState } from 'react';

import { useIsTouch, useLocalStorage } from '@/hooks';

const SIDEBAR_HINT_KEY = 'mdhd-sidebar-hint-shown';

const MobileOnboarding: React.FC = memo(() => {
  const isTouch = useIsTouch();
  const { storedValue: hintShown, setValue: setHintShown } = useLocalStorage(
    SIDEBAR_HINT_KEY,
    false
  );
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isTouch || hintShown) return;

    const showTimer = setTimeout(() => setVisible(true), 1000);
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setHintShown(true);
    }, 5000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [isTouch, hintShown, setHintShown]);

  if (!isTouch || hintShown) return null;

  return (
    <div
      className={`md:hidden fixed top-2.5 left-14 z-60 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
      onClick={() => {
        setVisible(false);
        setHintShown(true);
      }}
    >
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/95 backdrop-blur-sm border border-border/40 shadow-md">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary/80" />
        </span>
        <span className="text-xs text-muted-foreground select-none">Tap to open sidebar</span>
      </div>
    </div>
  );
});

MobileOnboarding.displayName = 'MobileOnboarding';
export default MobileOnboarding;
