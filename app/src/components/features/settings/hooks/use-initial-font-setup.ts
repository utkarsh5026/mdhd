import { useEffect } from 'react';

import type { FontFamily } from '@/lib/font';
import { APP_FONT_CSS_MAP } from '@/lib/font';
import { loadFont } from '@/lib/font-loader';

import { getCodeFontOption, useCodeDisplaySettingsStore } from '../store/code-display-settings';
import { useReadingSettingsStore } from '../store/reading-settings-store';

/**
 * Loads the user's persisted font choices on mount — the reading font, the app
 * UI font, and the code block font — so the correct typefaces are available
 * before the first paint that depends on them.
 *
 * Re-runs whenever a choice changes, which is also what pulls a newly selected
 * webfont down while the settings panel's preview is on screen.
 */
const useInitialFontSetup = () => {
  const { fontFamily, appFontFamily } = useReadingSettingsStore((s) => s.typography);
  const codeFontFamily = useCodeDisplaySettingsStore((s) => s.settings.fontFamily);

  useEffect(() => {
    const codeFont = getCodeFontOption(codeFontFamily).slug;
    if (codeFont) {
      loadFont(codeFont).catch((error) => {
        console.error('Failed to preload code font:', error);
      });
    }
  }, [codeFontFamily]);

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

    return () => {
      document.documentElement.style.fontFamily = '';
      document.body.style.fontFamily = '';
    };
  }, [fontFamily, appFontFamily]);
};

export default useInitialFontSetup;
