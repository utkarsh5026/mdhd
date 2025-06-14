export const parseError = (error: unknown, fallback?: string) => {
  if (error instanceof Error) {
    return error.message;
  }
  return fallback ?? String(error);
};

/**
 * Creates a function that handles errors automatically.
 * @param fn - The function to wrap with error handling
 * @param fallback - The fallback value to return in case of error
 * @param options - Additional options for error handling
 * @returns A wrapped function that handles errors
 */
export const withErrorHandling = <T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
  fallback: T,
  options?: {
    errorPrefix?: string;
    onError?: (error: unknown) => void;
    logError?: boolean;
  }
) => {
  return async (...args: Args): Promise<T> => {
    try {
      return await fn(...args);
    } catch (error) {
      const {
        errorPrefix = "Error occurred:",
        onError,
        logError = true,
      } = options || {};

      if (logError) {
        console.error(`${errorPrefix}`, {
          message: parseError(error),
          originalError: error,
        });
      }

      if (onError) {
        onError(error);
      }

      return fallback;
    }
  };
};
