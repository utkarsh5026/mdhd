import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import type { ImageSnippet } from '@/services/markdown/snippets';

import { usePhotoImageExportStore } from '../store/photo-image-export-store';
import type { Annotation } from '../store/types';
import ExportDrawer from './export-drawer';
import PhotoImagePreview from './photo-image-preview';
import PhotoSettingsSidebar from './photo-settings-sidebar';
import SnippetNavigator from './snippet-navigator';

interface PhotoImageExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  alt: string;
  imageSnippets?: ImageSnippet[];
}

const PhotoImageExportDialog: React.FC<PhotoImageExportDialogProps> = ({
  open,
  onOpenChange,
  src,
  alt,
  imageSnippets = [],
}) => {
  const captureRef = useRef<HTMLDivElement>(null);

  const initialIndex = useMemo(
    () =>
      Math.max(
        0,
        imageSnippets.findIndex((s) => s.src === src)
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open]
  );
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const activeSnippet = imageSnippets.length > 1 ? imageSnippets[currentIndex] : undefined;
  const activeSrc = activeSnippet?.src ?? src;
  const activeAlt = activeSnippet?.alt ?? alt;

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) setCurrentIndex(0);
      onOpenChange(next);
    },
    [onOpenChange]
  );

  const {
    settings,
    updateSettings,
    resetSettings,
    presets,
    savePreset,
    loadPreset,
    deletePreset,
    undo,
    redo,
    canUndo,
    canRedo,
  } = usePhotoImageExportStore(
    useShallow((s) => ({
      settings: s.settings,
      updateSettings: s.updateSettings,
      resetSettings: s.resetSettings,
      presets: s.presets,
      savePreset: s.savePreset,
      loadPreset: s.loadPreset,
      deletePreset: s.deletePreset,
      undo: s.undo,
      redo: s.redo,
      canUndo: s.canUndo,
      canRedo: s.canRedo,
    }))
  );

  const handleAnnotationUpdate = useCallback(
    (id: string, partial: Partial<Annotation>) => {
      updateSettings({
        annotations: settings.annotations.map((a) => (a.id === id ? { ...a, ...partial } : a)),
      } as Partial<typeof settings>);
    },
    [settings.annotations, updateSettings]
  );

  return (
    <ExportDrawer
      open={open}
      onOpenChange={handleOpenChange}
      title="Export Image"
      description="Customize and export as PNG, SVG, or JPEG"
      captureRef={captureRef}
      exportScale={settings.exportScale}
      transparentBackground={settings.transparentBackground}
      filenameHint={activeAlt || 'image'}
      onReset={resetSettings}
      onUndo={undo}
      onRedo={redo}
      canUndo={canUndo()}
      canRedo={canRedo()}
      navigationContent={
        <SnippetNavigator
          snippets={imageSnippets}
          currentIndex={currentIndex}
          onIndexChange={setCurrentIndex}
          renderLabel={(s) => {
            const is = s as ImageSnippet;
            const filename = is.src.split('/').pop() ?? is.src;
            return <span className="truncate">{is.alt || filename}</span>;
          }}
        />
      }
      previewContent={
        <PhotoImagePreview
          ref={captureRef}
          src={activeSrc}
          alt={activeAlt}
          settings={settings}
          onAnnotationUpdate={handleAnnotationUpdate}
          onSettingsUpdate={updateSettings}
        />
      }
      sidebarContent={
        <PhotoSettingsSidebar
          settings={settings}
          updateSettings={updateSettings}
          presets={presets}
          savePreset={savePreset}
          loadPreset={loadPreset}
          deletePreset={deletePreset}
          alt={activeAlt}
        />
      }
    />
  );
};

export default PhotoImageExportDialog;
