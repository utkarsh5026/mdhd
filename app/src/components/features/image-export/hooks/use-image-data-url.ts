import { useEffect, useState } from 'react';

/**
 * Fetches an image as a data URL to avoid CORS/tainted canvas issues with html-to-image.
 */
export function useImageDataUrl(src: string): string {
  const [dataUrl, setDataUrl] = useState(src);

  useEffect(() => {
    let revoked = false;

    if (src.startsWith('data:') || src.startsWith('blob:')) {
      setDataUrl(src);
      return;
    }

    (async () => {
      try {
        const res = await fetch(src);
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          if (!revoked && typeof reader.result === 'string') {
            setDataUrl(reader.result);
          }
        };
        reader.readAsDataURL(blob);
      } catch {
        // Fallback to original src if fetch fails
        if (!revoked) setDataUrl(src);
      }
    })();

    return () => {
      revoked = true;
    };
  }, [src]);

  return dataUrl;
}
