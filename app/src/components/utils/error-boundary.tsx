import React from 'react';
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { Home, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/components/shared/theme/hooks/use-theme';

/**
 * ErrorBoundary Component
 *
 * A beautifully designed error boundary that catches and displays errors
 * in a user-friendly way, allowing users to recover from errors gracefully.
 *
 * Features:
 * - Handles different types of errors with appropriate messages
 * - Provides clear actions to recover (refresh or return home)
 * - Adapts to different screen sizes with responsive design
 * - Uses subtle animations and visual cues to communicate error state
 */
const ErrorBoundary: React.FC = () => {
  const error = useRouteError();
  const { currentTheme } = useTheme();

  let errorMessage = 'An unexpected error occurred';
  let errorDetails = '';

  if (isRouteErrorResponse(error)) {
    // Handle route errors (404, etc)
    errorMessage = `${error.status} - ${error.statusText}`;
    errorDetails = error.data?.message ?? "The page you're looking for couldn't be found.";
  } else if (error instanceof Error) {
    // Handle JavaScript errors
    errorMessage = error.message;
    errorDetails = error.stack?.split('\n')[0] ?? '';
  } else if (typeof error === 'string') {
    // Handle string errors
    errorMessage = error;
  }

  // Check if it's a chunk loading error
  const isChunkError =
    errorMessage.includes('Failed to fetch dynamically imported module') ||
    errorMessage.includes('Loading chunk') ||
    errorMessage.includes('Importing a module script failed');

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background font-cascadia-code">
      {/* Background decorative elements */}
      <div
        className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10 blur-3xl -z-10"
        style={{
          background: `radial-gradient(circle, ${currentTheme.primary}, transparent)`,
        }}
      ></div>
      <div
        className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10 blur-3xl -z-10"
        style={{
          background: `radial-gradient(circle, ${currentTheme.primary}, transparent)`,
        }}
      ></div>

      <Card className="max-w-md w-full p-6 md:p-8 shadow-lg border-primary/20 bg-card/90 backdrop-blur-sm rounded-3xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
            <div className="text-4xl">😕</div>
          </div>

          <h1 className="text-xl md:text-2xl font-bold mb-2 text-foreground">
            Something went wrong
          </h1>

          <p className="text-sm md:text-base text-muted-foreground mb-3">
            {isChunkError
              ? 'We had trouble loading some application resources. This often happens due to network issues or a new version being deployed.'
              : errorMessage}
          </p>

          {errorDetails && !isChunkError && (
            <p className="text-xs text-muted-foreground mb-6 bg-primary/5 p-2 rounded-lg overflow-hidden overflow-ellipsis">
              {errorDetails}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <Button
              variant="outline"
              className="flex items-center justify-center gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary rounded-2xl"
              onClick={() => window.location.reload()}
            >
              <RefreshCcw className="h-4 w-4" />
              <span>Refresh Page</span>
            </Button>

            <Button
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl"
              asChild
            >
              <Link to="/">
                <Home className="h-4 w-4" />
                <span>Back to Home</span>
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ErrorBoundary;
