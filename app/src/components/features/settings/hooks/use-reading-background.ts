import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

import { backgroundImageDB } from '@/services/indexeddb/background-image-db';

import { useReadingSettingsStore } from '../store/reading-settings-store';

/** Maximum allowed background image size in bytes (5 MB). */
const MAX_IMAGE_SIZE = 5_000_000;

/**
 * Hook that manages the reading-mode background image and color settings.
 *
 * Reads background configuration from `useReadingSettingsStore` and mirrors the
 * active background image from IndexedDB into local React state as a data URL.
 * Exposes helpers to upload a new image (with size/type validation) and to
 * remove the current one.
 *
 * @hook
 * @returns An object containing:
 *   - `background` — the current `ReadingBackgroundSettings` slice
 *   - `backgroundImageDataUrl` — the active image as a data URL, or `null`
 *   - `updateBackground` — action to patch background settings
 *   - `uploadImage` — validates and persists a new background image
 *   - `removeImage` — deletes the stored image and resets the background
 */
export const useReadingBackground = () => {
  const background = useReadingSettingsStore((s) => s.settings.background);
  const backgroundImageId = useReadingSettingsStore((s) => s.settings.backgroundImageId);
  const updateBackground = useReadingSettingsStore((s) => s.updateBackground);
  const setBackgroundImageId = useReadingSettingsStore((s) => s.setBackgroundImageId);
  const clearBackgroundImage = useReadingSettingsStore((s) => s.clearBackgroundImage);

  const [backgroundImageDataUrl, setBackgroundImageDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!backgroundImageId) {
      setBackgroundImageDataUrl(null);
      return;
    }

    backgroundImageDB
      .load(backgroundImageId)
      .then((dataUrl) => setBackgroundImageDataUrl(dataUrl))
      .catch(() => setBackgroundImageDataUrl(null));
  }, [backgroundImageId]);

  /**
   * Validates and saves a new background image to IndexedDB.
   *
   * Rejects non-image MIME types and files larger than `MAX_IMAGE_SIZE` with a
   * toast error. On success, deletes any previously stored image, persists the
   * new one under a fresh UUID, updates the store with `backgroundType: 'image'`,
   * and sets `backgroundImageDataUrl` for immediate display.
   *
   * @param file - The image `File` selected by the user.
   */
  const uploadImage = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error('Image must be under 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const id = uuidv4();

        try {
          if (backgroundImageId) {
            await backgroundImageDB.delete(backgroundImageId);
          }

          await backgroundImageDB.save(id, dataUrl);
          setBackgroundImageId(id);
          updateBackground({ backgroundType: 'image' });
          setBackgroundImageDataUrl(dataUrl);
        } catch {
          toast.error('Failed to save background image');
        }
      };
      reader.readAsDataURL(file);
    },
    [backgroundImageId, setBackgroundImageId, updateBackground]
  );

  /**
   * Removes the current background image.
   *
   * Deletes the stored entry from IndexedDB (errors silently ignored), calls
   * `clearBackgroundImage` to reset the store, and clears `backgroundImageDataUrl`.
   */
  const removeImage = useCallback(async () => {
    if (backgroundImageId) {
      await backgroundImageDB.delete(backgroundImageId).catch(() => {});
    }
    clearBackgroundImage();
    setBackgroundImageDataUrl(null);
  }, [backgroundImageId, clearBackgroundImage]);

  return {
    background,
    backgroundImageDataUrl,
    updateBackground,
    uploadImage,
    removeImage,
  };
};
