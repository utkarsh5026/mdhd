import { useKeyPress } from '@/hooks';

import { useTabsStore } from '../store/tabs-store';

/**
 * Listens for Ctrl/Cmd + N and creates a new untitled tab.
 */
export function useNewTabShortcut() {
  const createUntitledTab = useTabsStore((s) => s.createUntitledTab);

  useKeyPress('ctrl+n', (e) => {
    e.preventDefault();
    createUntitledTab();
  });
}
