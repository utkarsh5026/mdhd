export const parseError = (error: unknown, fallback?: string) => {
  if (error instanceof Error) {
    return error.message;
  }
  return fallback ?? String(error);
};
