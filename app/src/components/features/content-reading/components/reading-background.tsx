import React, { memo, useEffect, useState } from 'react';

import { backgroundImageDB } from '@/services/indexeddb/background-image-db';

import { useReadingSettingsStore } from '../../settings/store/reading-settings-store';

function fitToCSS(fit: string): string {
  switch (fit) {
    case 'contain':
      return 'contain';
    case 'fill':
      return '100% 100%';
    case 'tile':
      return 'auto';
    default:
      return 'cover';
  }
}

const ReadingBackground: React.FC = memo(() => {
  const background = useReadingSettingsStore((s) => s.settings.background);
  const backgroundImageId = useReadingSettingsStore((s) => s.settings.backgroundImageId);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!backgroundImageId) {
      setImageDataUrl(null);
      return;
    }
    backgroundImageDB
      .load(backgroundImageId)
      .then((url) => setImageDataUrl(url))
      .catch(() => setImageDataUrl(null));
  }, [backgroundImageId]);

  if (background.backgroundType === 'theme') return null;

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {background.backgroundType === 'solid' && (
        <div className="absolute inset-0" style={{ backgroundColor: background.backgroundColor }} />
      )}

      {background.backgroundType === 'image' && imageDataUrl && (
        <>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${imageDataUrl})`,
              backgroundSize: fitToCSS(background.backgroundImageFit),
              backgroundRepeat: background.backgroundImageFit === 'tile' ? 'repeat' : 'no-repeat',
              backgroundPosition: 'center',
              opacity: background.backgroundImageOpacity / 100,
              filter:
                background.backgroundImageBlur > 0
                  ? `blur(${background.backgroundImageBlur}px)`
                  : undefined,
              transform: background.backgroundImageBlur > 0 ? 'scale(1.1)' : undefined,
              willChange: 'transform',
            }}
          />
          {background.backgroundImageOverlayOpacity > 0 && (
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: background.backgroundImageOverlay,
                opacity: background.backgroundImageOverlayOpacity / 100,
              }}
            />
          )}
        </>
      )}
    </div>
  );
});

ReadingBackground.displayName = 'ReadingBackground';

export default ReadingBackground;
