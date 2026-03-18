import Header from './layout-header';
import NavigationControls from './navigation-controls';
import LoadingState from './loading-state';
import ContentReader from './content-reader';
import ScrollContentReader from './scroll-content-reader';
import MetadataDisplay from './metadata-display';
import ReadingCore from '../reading-core';
import SectionBreadcrumb from './section-breadcrumb';

/**
 * Shared padding classes for the reading area.
 * Used by both ContentReader (card mode) and ScrollContentReader (scroll mode)
 * so layout changes only need to be made in one place.
 */
export const READER_PADDING_CLASSES = 'px-6 md:px-12 lg:px-20 xl:px-32 py-20 md:py-24';

export {
  Header,
  NavigationControls,
  LoadingState,
  ContentReader,
  ScrollContentReader,
  MetadataDisplay,
  ReadingCore,
  SectionBreadcrumb,
};
