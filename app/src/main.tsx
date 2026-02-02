import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import router from './router.tsx';
import './styles/font-styles.css';
import './styles/variable-fonts.css';

import '@fontsource-variable/fira-code';
import '@fontsource-variable/source-code-pro';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
