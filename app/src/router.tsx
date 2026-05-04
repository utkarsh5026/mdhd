import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import { ErrorBoundary, LoadingFallback } from '@/components/utils';

const App = lazy(() => import('./App'));
const SharePage = lazy(
  () => import('@/components/features/content-reading/components/share/share-page')
);
const StatsPage = lazy(() => import('@/components/features/stats/stats-page'));
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
  {
    path: '/stats',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <StatsPage />
      </Suspense>
    ),
    errorElement: <ErrorBoundary />,
  },
  {
    // Public share view — no auth hooks, no sync, no sidebar.
    path: '/share/:token',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <SharePage />
      </Suspense>
    ),
    errorElement: <ErrorBoundary />,
  },
]);

export default router;
