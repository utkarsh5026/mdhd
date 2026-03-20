import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import type { PresentationActions, PresentationState } from './types';

const usePresentationStore = create<PresentationState & PresentationActions>()(
  devtools(
    (set) => ({
      isActive: false,
      showNotes: false,

      startPresentation: () => set({ isActive: true, showNotes: false }),
      stopPresentation: () => set({ isActive: false, showNotes: false }),
      toggleNotes: () => set((s) => ({ showNotes: !s.showNotes })),
    }),
    { name: 'presentation-store' }
  )
);

export const usePresentationActive = () => usePresentationStore((s) => s.isActive);
export const usePresentationShowNotes = () => usePresentationStore((s) => s.showNotes);
export const usePresentationActions = () =>
  usePresentationStore(
    useShallow((s) => ({
      startPresentation: s.startPresentation,
      stopPresentation: s.stopPresentation,
      toggleNotes: s.toggleNotes,
    }))
  );

export default usePresentationStore;
