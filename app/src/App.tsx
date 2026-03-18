import { Toaster } from 'sonner';

import Homepage from '@/components/layout/home';

import { useTheme } from './hooks';

const App = () => {
  useTheme();

  return (
    <>
      <Homepage />
      <Toaster />
    </>
  );
};

export default App;
