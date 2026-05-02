import { Toaster } from 'sonner';

import { useInitialFontSetup } from '@/components/features/settings';
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
      <Toaster />
    </>
  );
};

export default App;
