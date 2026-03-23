import { Toaster } from 'sonner';

import { useInitialFontSetup } from '@/components/features/settings';
import Homepage from '@/components/layout/home';

import { useTheme } from './hooks';

const App = () => {
  useTheme();
  useInitialFontSetup();

  return (
    <>
      <Homepage />
      <Toaster />
    </>
  );
};

export default App;
