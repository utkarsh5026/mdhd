import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import type { PresentationActions, PresentationState } from './types';

const usePresentationStore = create<PresentationState & PresentationActions>()(
  devtools(
    (set) => ({
      isActive: false,
      showNotes: false,
      showOverview: false,
      showFilmstrip: false,
      startTime: null,

      startPresentation: () =>
        set({
          isActive: true,
          showNotes: false,
          showOverview: false,
          showFilmstrip: false,
          startTime: Date.now(),
        }),
      stopPresentation: () =>
        set({
          isActive: false,
          showNotes: false,
          showOverview: false,
          showFilmstrip: false,
          startTime: null,
        }),
      toggleNotes: () => set((s) => ({ showNotes: !s.showNotes })),
      toggleOverview: () => set((s) => ({ showOverview: !s.showOverview })),
      toggleFilmstrip: () => set((s) => ({ showFilmstrip: !s.showFilmstrip })),
    }),
    { name: 'presentation-store' }
  )
);

export const usePresentationActive = () => usePresentationStore((s) => s.isActive);
export const usePresentationShowNotes = () => usePresentationStore((s) => s.showNotes);
export const usePresentationShowOverview = () => usePresentationStore((s) => s.showOverview);
export const usePresentationShowFilmstrip = () => usePresentationStore((s) => s.showFilmstrip);
export const usePresentationStartTime = () => usePresentationStore((s) => s.startTime);
export const usePresentationActions = () =>
  usePresentationStore(
    useShallow((s) => ({
      startPresentation: s.startPresentation,
      stopPresentation: s.stopPresentation,
      toggleNotes: s.toggleNotes,
      toggleOverview: s.toggleOverview,
      toggleFilmstrip: s.toggleFilmstrip,
    }))
  );

export default usePresentationStore;
