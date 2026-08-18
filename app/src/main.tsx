import './styles/font-styles.css';
import './index.css';
import './styles/variable-fonts.css';
import '@fontsource-variable/geist';
import '@fontsource-variable/fira-code';
import '@fontsource-variable/source-code-pro';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { toast } from 'sonner';

import { registerServiceWorker } from '@/services/offline';

import router from './router.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);

// Registered here rather than inside a component so it runs for every route,
// and outside React so a re-render can never re-register. The worker itself
// waits for `window.load`, which is well after `<Toaster />` mounts, so these
// callbacks always have somewhere to land.
const updateServiceWorker = registerServiceWorker({
  onOfflineReady: () => {
    toast.success('Ready to work offline', {
      description: 'MDHD is saved on this device and will open without a connection.',
    });
  },
  onNeedRefresh: () => {
    toast('A new version of MDHD is available', {
      description: 'Reload when you reach a good stopping point.',
      duration: Infinity,
      action: {
        label: 'Reload',
        onClick: () => void updateServiceWorker(),
      },
    });
  },
});
