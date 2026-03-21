import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

import { backgroundImageDB } from '@/services/indexeddb/background-image-db';

import { useReadingSettingsStore } from '../store/reading-settings-store';

const MAX_IMAGE_SIZE = 5_000_000;

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
          // Delete old image if exists
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
