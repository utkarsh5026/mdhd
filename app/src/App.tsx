import { Toaster } from 'sonner';

import { useInitialFontSetup } from '@/components/features/settings';
import Homepage from '@/components/layout/home';

import { useTheme } from './hooks';
import { useAuthRedirect } from './hooks/use-auth-redirect';

const App = () => {
  useTheme();
  useInitialFontSetup();
  useAuthRedirect();

  return (
    <>
      <Homepage />
      <Toaster />
    </>
  );
};

export default App;
