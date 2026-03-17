import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * React class-based ErrorBoundary that catches rendering errors
 * in its child component tree via componentDidCatch / getDerivedStateFromError.
 *
 * Use this to wrap critical UI subtrees so a single component crash
 * doesn't take down the entire application.
 */
export class ReactErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ReactErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-4">
          <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
            <span className="text-2xl">!</span>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-1">Something went wrong</h2>
            <p className="text-xs text-muted-foreground max-w-sm">
              {this.state.error?.message ||
                'An unexpected error occurred while rendering this section.'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-xl"
            onClick={this.handleReset}
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
