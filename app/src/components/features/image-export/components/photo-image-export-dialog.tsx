import React, { useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { usePhotoImageExportStore } from '../store/photo-image-export-store';
import ExportDrawer from './export-drawer';
import PhotoImagePreview from './photo-image-preview';
import PhotoSettingsSidebar from './photo-settings-sidebar';

interface PhotoImageExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  alt: string;
}

const PhotoImageExportDialog: React.FC<PhotoImageExportDialogProps> = ({
  open,
  onOpenChange,
  src,
  alt,
}) => {
  const captureRef = useRef<HTMLDivElement>(null);
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

  return (
    <ExportDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Export Image"
      description="Customize and export as PNG, SVG, or JPEG"
      captureRef={captureRef}
      exportScale={settings.exportScale}
      transparentBackground={settings.transparentBackground}
      filenameHint={alt || 'image'}
      onReset={resetSettings}
      onUndo={undo}
      onRedo={redo}
      canUndo={canUndo()}
      canRedo={canRedo()}
      previewContent={
        <PhotoImagePreview ref={captureRef} src={src} alt={alt} settings={settings} />
      }
      sidebarContent={
        <PhotoSettingsSidebar
          settings={settings}
          updateSettings={updateSettings}
          presets={presets}
          savePreset={savePreset}
          loadPreset={loadPreset}
          deletePreset={deletePreset}
          alt={alt}
        />
      }
    />
  );
};

export default PhotoImageExportDialog;
