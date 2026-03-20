export { default as PresentationMode } from './components/presentation-mode';
export {
  usePresentationActions,
  usePresentationActive,
  usePresentationShowNotes,
} from './store/presentation-store';
export type { PresentationState } from './store/types';
export { parsePresenterNotes } from './utils/parse-notes';
