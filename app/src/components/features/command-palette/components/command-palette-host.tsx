import { lazy, Suspense, useState } from 'react';

import { useKeyPress } from '@/hooks';

const CommandPalette = lazy(() => import('./command-palette'));

/**
 * Owns the Cmd/Ctrl+K shortcut and mounts the palette on first use.
 *
 * Only this listener ships in the initial bundle; the palette itself — along
 * with the fuzzy matcher and local search index it pulls in — is fetched the
 * first time it is opened.
 */
const CommandPaletteHost: React.FC = () => {
  const [open, setOpen] = useState(false);

  useKeyPress('ctrl+k', (e) => {
    e.preventDefault();
    setOpen((current) => !current);
  });

  if (!open) return null;

  return (
    <Suspense fallback={null}>
      <CommandPalette open={open} onOpenChange={setOpen} />
    </Suspense>
  );
};

export default CommandPaletteHost;
