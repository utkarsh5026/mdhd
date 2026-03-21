export type SlideDirection = 'left' | 'right' | 'none';

export interface PresentationState {
  isActive: boolean;
  showNotes: boolean;
  showOverview: boolean;
  showFilmstrip: boolean;
  startTime: number | null;
}

export interface PresentationActions {
  startPresentation: () => void;
  stopPresentation: () => void;
  toggleNotes: () => void;
  toggleOverview: () => void;
  toggleFilmstrip: () => void;
}
