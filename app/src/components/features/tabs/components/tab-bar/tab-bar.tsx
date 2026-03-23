import React, { memo } from 'react';

import DesktopTabBar from './desktop-tab-bar';
import MobileTabBar from './mobile-tab-bar';

export interface MobileNavProps {
  currentIndex: number;
  total: number;
  readingMode: 'card' | 'scroll';
  onPrevious: () => void;
  onNext: () => void;
  onFullscreen: () => void;
}

interface TabBarProps {
  mobileNav?: MobileNavProps;
}

const TabBar: React.FC<TabBarProps> = memo(({ mobileNav }) => {
  return (
    <>
      <MobileTabBar mobileNav={mobileNav} />
      <DesktopTabBar />
    </>
  );
});

TabBar.displayName = 'TabBar';

export default TabBar;
