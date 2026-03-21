import { useEffect, useState } from 'react';

/**
 * Converts a remote image URL to a data URL to avoid CORS/tainted-canvas issues.
 *
 * - `data:` and `blob:` URLs are returned as-is immediately.
 * - Non-HTTP(S) strings (e.g. relative paths) are returned unchanged.
 * - For `http(s)://` URLs, the image is fetched, converted to a base64 data URL via
 *   `FileReader`, and the state is updated once the conversion completes.
 *
 * The fetch is tied to an `AbortController` that is cancelled on cleanup, so stale
 * responses from rapid `src` changes are safely discarded.
 *
 * @hook
 * @param src - The image source — a remote URL, data URL, blob URL, or relative path.
 * @returns The resolved data URL, or the original `src` while conversion is in progress
 *   or if the input does not require conversion.
 */
export function useImageDataUrl(src: string): string {
  const [dataUrl, setDataUrl] = useState(src);

  useEffect(() => {
    if (src.startsWith('data:') || src.startsWith('blob:')) {
      setDataUrl(src);
      return;
    }

    if (!/^https?:\/\//i.test(src)) {
      setDataUrl(src);
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(src, { signal: controller.signal });
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          if (!controller.signal.aborted && typeof reader.result === 'string') {
            setDataUrl(reader.result);
          }
        };
        reader.readAsDataURL(blob);
      } catch {
        if (!controller.signal.aborted) setDataUrl(src);
      }
    })();

    return () => {
      controller.abort();
    };
  }, [src]);

  return dataUrl;
}
