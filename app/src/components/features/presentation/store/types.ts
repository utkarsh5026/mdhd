export interface PresentationState {
  isActive: boolean;
  showNotes: boolean;
}

export interface PresentationActions {
  startPresentation: () => void;
  stopPresentation: () => void;
  toggleNotes: () => void;
}
