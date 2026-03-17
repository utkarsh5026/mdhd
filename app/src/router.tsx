import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { ErrorBoundary, LoadingFallback } from '@/components/utils';

const App = lazy(() => import('./App'));

/**
 * Application Router Configuration
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <App />
      </Suspense>
    ),
    errorElement: <ErrorBoundary />,
  },
]);

export default router;
