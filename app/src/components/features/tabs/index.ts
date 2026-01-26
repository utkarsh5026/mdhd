// Store
export {
  useTabsStore,
  useTabs,
  useActiveTabId,
  useActiveTab,
  useShowEmptyState,
  useTabsHasHydrated,
  useHeaderVisible,
  useTabsActions,
  type Tab,
  type TabReadingState,
} from './store';


// Components
export { default as TabBar } from './components/tab-bar/tab-bar';
export { default as TabItem } from './components/tab-bar/tab-item';
export { default as TabbedContentArea } from './components/tabbed-content-area';
export { default as InlineMarkdownViewer } from './components/markdown/inline-markdown-viewer';
export { default as FullscreenMarkdownViewer } from './components/markdown/fullscreen-markdown-viewer';
