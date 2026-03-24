import { useEffect } from 'react';

import type { FontFamily } from '@/lib/font';
import { APP_FONT_CSS_MAP } from '@/lib/font';
import { loadFont } from '@/lib/font-loader';

import { useReadingSettingsStore } from '../store/reading-settings-store';

/**
 * Loads the user's persisted font choices on mount — both the reading font
 * and the app UI font — so the correct typefaces are available before the
 * first paint that depends on them.
 *
 */
const useInitialFontSetup = () => {
  const { fontFamily, appFontFamily } = useReadingSettingsStore((s) => s.settings);

  useEffect(() => {
    loadFont(fontFamily).catch((error) => {
      console.error('Failed to preload initial font:', error);
    });

    const appFontCss = APP_FONT_CSS_MAP[appFontFamily];
    if (appFontCss) {
      document.documentElement.style.fontFamily = appFontCss;
      document.body.style.fontFamily = appFontCss;
    }

    if (appFontFamily !== 'geist' && appFontFamily !== 'system-ui') {
      loadFont(appFontFamily as FontFamily).catch(() => {});
    }
  }, [fontFamily, appFontFamily]);
};

export default useInitialFontSetup;
