/**
 * Higher-order function that adds caching to any async function
 */
export function withCache<T>(fn: () => Promise<T>): () => Promise<T> {
  let cachedResult: T | null = null;

  return async function () {
    if (cachedResult !== null) {
      return cachedResult;
    }

    const result = await fn();
    cachedResult = result;
    return result;
  };
}
