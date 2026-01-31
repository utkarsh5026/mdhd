/**
 * Parses an error into a readable string message.
 * @param error - The error to parse (can be any type)
 * @param fallback - Optional fallback message if error is not an Error instance
 * @returns The parsed error message as a string
 */
export const parseError = (error: unknown, fallback?: string) => {
  if (error instanceof Error) {
    return error.message;
  }
  return fallback ?? String(error);
};

/**
 * Options for configuring error handling behavior.
 *
 * @property context - Context label for error messages (default: 'Error occurred:')
 * @property logError - Whether to log errors to console (default: true)
 * @property onError - Optional callback to execute when an error occurs
 */
type ErrorHandlingOptions = {
  context?: string;
  logError?: boolean;
  onError?: (error: unknown) => void;
};

/**
 * Internal helper to handle errors consistently across sync and async wrappers.
 * @template T - The return type of the function
 * @returns The fallback value
 */
function handleErrorWithFallback<T>(
  error: unknown,
  fallback: T,
  options?: ErrorHandlingOptions
): T {
  const { context = 'Error occurred:', onError, logError = true } = options || {};

  if (logError) {
    console.error(`${context}`, {
      message: parseError(error),
      originalError: error,
    });
  }

  if (onError) {
    onError(error);
  }

  return fallback;
}

/**
 * Wraps an asynchronous function with error handling.
 * @template T - The return type of the wrapped function
 * @template Args - The argument types of the wrapped function
 *
 * @param fn - The async function to wrap with error handling
 * @param fallback - The value to return if an error occurs
 * @param options - Optional configuration for error handling
 *
 * @returns A wrapped version of the function that catches errors and returns the fallback
 *
 * @example
 * const safeFetch = withErrorHandlingAsync(
 *   async (url: string) => fetch(url).then(r => r.json()),
 *   { data: [] },
 *   { context: 'Fetch failed:' }
 * );
 * const result = await safeFetch('/api/data');
 */
export const withErrorHandlingAsync = <T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
  fallback: T,
  options?: ErrorHandlingOptions
) => {
  return async (...args: Args): Promise<T> => {
    try {
      return await fn(...args);
    } catch (error) {
      return handleErrorWithFallback(error, fallback, options);
    }
  };
};

/**
 * Wraps a synchronous function with error handling.
 * @template T - The return type of the wrapped function
 * @template Args - The argument types of the wrapped function
 *
 * @param fn - The synchronous function to wrap with error handling
 * @param fallback - The value to return if an error occurs
 * @param options - Optional configuration for error handling
 *
 * @returns A wrapped version of the function that catches errors and returns the fallback
 *
 * @example
 * const safeJsonParse = withErrorHandling(JSON.parse, {}, { context: 'JSON parsing' });
 * const result = safeJsonParse('{invalid json}');
 */
export const withErrorHandling = <T, Args extends unknown[]>(
  fn: (...args: Args) => T,
  fallback: T,
  options?: ErrorHandlingOptions
) => {
  return (...args: Args): T => {
    try {
      return fn(...args);
    } catch (error) {
      return handleErrorWithFallback(error, fallback, options);
    }
  };
};

/**
 * TYPE DEFINITIONS
 * A Tuple representing a result: [Error, null] OR [null, Data]
 * This allows TypeScript to narrow types automatically when you check the error.
 */
type SafeResult<T, E = Error> = [E, null] | [null, T];

/**
 * Wraps a synchronous function in a try-catch and returns a result tuple.
 * Implements the Result Pattern for safer error handling without throwing.
 *
 * @template T - The return type of the function on success
 * @template E - The error type (defaults to Error)
 *
 * @param fn - The synchronous function to execute
 *
 * @returns A tuple: [error, null] on failure or [null, data] on success
 *
 * @example
 * // Safe JSON parsing
 * const [error, data] = attempt(() => JSON.parse(jsonString));
 * if (error) {
 *   console.error('Parse failed:', error);
 * } else {
 *   console.log('Parsed data:', data);
 * }
 *
 */
export function attempt<T, E = Error>(fn: () => T): SafeResult<T, E> {
  try {
    const data = fn();
    return [null, data];
  } catch (error) {
    return [error as E, null];
  }
}

/**
 * Wraps an asynchronous function and returns a result tuple.
 * Implements the Result Pattern for async operations without throwing.
 *
 * @template T - The return type of the function on success
 * @template E - The error type (defaults to Error)
 *
 * @param fn - The async function to execute
 *
 * @returns A Promise resolving to a tuple: [error, null] on failure or [null, data] on success
 *
 * @example
 * // Safe fetch operation
 * const [error, response] = await attemptAsync(() => fetch('/api/data'));
 * if (error) {
 *   console.error('Fetch failed:', error);
 *   return;
 * }
 * const data = await response.json();
 *
 */
export async function attemptAsync<T, E = Error>(fn: () => Promise<T>): Promise<SafeResult<T, E>> {
  return fn()
    .then((data) => [null, data] as SafeResult<T, E>)
    .catch((error) => [error as E, null] as SafeResult<T, E>);
}
