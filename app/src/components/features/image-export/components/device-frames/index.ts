import React from 'react';

import type { SharedExportSettings } from '../../store/types';
import AppleWatchFrame from './apple-watch-frame';
import BrowserArcFrame from './browser-arc-frame';
import BrowserChromeFrame from './browser-chrome-frame';
import GnomeFrame from './gnome-frame';
import IPadFrame from './ipad-frame';
import IPhoneFrame from './iphone-frame';
import MacBookFrame from './macbook-frame';
import PixelFrame from './pixel-frame';
import SocialCardFrame from './social-card-frame';

type DeviceFrame = SharedExportSettings['deviceFrame'];

export const DeviceFrameWrapper: React.FC<{
  frame: DeviceFrame;
  children: React.ReactNode;
}> = ({ frame, children }) => {
  switch (frame) {
    case 'browser-chrome':
      return React.createElement(BrowserChromeFrame, null, children);
    case 'browser-arc':
      return React.createElement(BrowserArcFrame, null, children);
    case 'iphone':
      return React.createElement(IPhoneFrame, null, children);
    case 'pixel':
      return React.createElement(PixelFrame, null, children);
    case 'macbook':
      return React.createElement(MacBookFrame, null, children);
    case 'ipad':
      return React.createElement(IPadFrame, null, children);
    case 'apple-watch':
      return React.createElement(AppleWatchFrame, null, children);
    case 'gnome':
      return React.createElement(GnomeFrame, null, children);
    case 'social-card':
      return React.createElement(SocialCardFrame, null, children);
    default:
      return React.createElement(React.Fragment, null, children);
  }
};
