/**
 * Lightweight hook to detect touch-primary devices via `pointer: coarse` media query.
 * Prefer this over the full `useMobile` hook in leaf UI components.
 */
export const useIsTouch = (): boolean =>
  typeof window !== 'undefined' && matchMedia('(pointer: coarse)').matches;
