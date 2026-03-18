import ReadingCore from '../reading-core';
import ContentReader from './content-reader';
import Header from './layout-header';
import LoadingState from './loading-state';
import MetadataDisplay from './metadata-display';
import NavigationControls from './navigation-controls';
import ScrollContentReader from './scroll-content-reader';
import SectionBreadcrumb from './section-breadcrumb';

/**
 * Shared padding classes for the reading area.
 * Used by both ContentReader (card mode) and ScrollContentReader (scroll mode)
 * so layout changes only need to be made in one place.
 */
export const READER_PADDING_CLASSES = 'px-6 md:px-12 lg:px-20 xl:px-32 py-20 md:py-24';

export {
  ContentReader,
  Header,
  LoadingState,
  MetadataDisplay,
  NavigationControls,
  ReadingCore,
  ScrollContentReader,
  SectionBreadcrumb,
};
