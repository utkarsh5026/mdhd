import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useIsTouch, useLocalStorage } from '@/hooks';

const SWIPE_HINT_KEY = 'mdhd-swipe-hint-shown';

const SwipeHint: React.FC = () => {
  const isTouch = useIsTouch();
  const { storedValue: hintShown, setValue: setHintShown } = useLocalStorage(SWIPE_HINT_KEY, false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isTouch || hintShown) return;

    // Show after a brief delay
    const showTimer = setTimeout(() => setVisible(true), 500);
    // Auto-dismiss
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setHintShown(true);
    }, 3000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [isTouch, hintShown, setHintShown]);

  if (!isTouch || hintShown) return null;

  return (
    <div
      className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-2 rounded-full bg-card/90 backdrop-blur-sm border border-border/30 shadow-md transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      <ChevronLeft className="h-4 w-4 text-muted-foreground animate-pulse" />
      <span className="text-xs text-muted-foreground select-none">Swipe to navigate</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground animate-pulse" />
    </div>
  );
};

SwipeHint.displayName = 'SwipeHint';
export default SwipeHint;
