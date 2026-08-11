import { Toaster } from 'sonner';

import { CommandPalette } from '@/components/features/command-palette';
import { useInitialFontSetup } from '@/components/features/settings';
import { WhatsNewModal } from '@/components/features/whats-new';
import Homepage from '@/components/layout/home';

import { useTheme } from './hooks';
import { useAuthRedirect } from './hooks/use-auth-redirect';
import { useSync } from './hooks/use-sync';

const App = () => {
  useTheme();
  useInitialFontSetup();
  useAuthRedirect();
  useSync();

  return (
    <>
      <Homepage />
      <CommandPalette />
      <WhatsNewModal />
      <Toaster />
    </>
  );
};

export default App;
