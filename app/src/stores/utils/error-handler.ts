import { parseError } from '@/utils/error';
import { StoreApi } from 'zustand';

/**
 * Interface for store states that include an error property
 */
interface WithError {
  error: string | null;
}

/**
 * Creates a reusable error handler for Zustand stores
 *
 * @param set The Zustand set function
 * @param logPrefix Prefix for console error messages
 * @param defaultValue Default value to return on error
 * @returns Error handler function
 */
export function createErrorHandler<T extends WithError, R>(
  set: StoreApi<T>['setState'],
  logPrefix: string,
  defaultValue: R
) {
  return async function handleError<F extends (...args: unknown[]) => Promise<R>>(
    operation: F,
    fallbackMessage: string,
    ...args: Parameters<F>
  ): Promise<R> {
    try {
      return await operation(...args);
    } catch (error) {
      console.error(`${logPrefix}:`, error);
      set({ error: parseError(error, fallbackMessage) } as Partial<T>);
      return defaultValue;
    }
  };
}
