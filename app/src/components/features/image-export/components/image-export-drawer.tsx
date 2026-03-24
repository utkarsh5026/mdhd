import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import type { CodeSnippet } from '@/services/markdown/snippets';

import { useCodeImageExportStore } from '../store/code-image-export-store';
import type { Annotation } from '../store/types';
import CodeImagePreview from './code-image-preview';
import ExportDrawer from './export-drawer';
import SettingsSidebar from './settings-sidebar';
import SnippetNavigator from './snippet-navigator';

interface CodeImageExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code: string;
  language: string;
  codeSnippets?: CodeSnippet[];
}

const CodeImageExportDialog: React.FC<CodeImageExportDialogProps> = ({
  open,
  onOpenChange,
  code,
  language,
  codeSnippets = [],
}) => {
  const captureRef = useRef<HTMLDivElement>(null);

  const initialIndex = useMemo(
    () =>
      Math.max(
        0,
        codeSnippets.findIndex((s) => s.code === code && s.language === language)
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open]
  );
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const activeSnippet = codeSnippets.length > 1 ? codeSnippets[currentIndex] : undefined;
  const activeCode = activeSnippet?.code ?? code;
  const activeLanguage = activeSnippet?.language ?? language;

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
  } = useCodeImageExportStore(
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
      title="Export Code Image"
      description="Customize and export as PNG, SVG, or JPEG"
      captureRef={captureRef}
      exportScale={settings.exportScale}
      transparentBackground={settings.transparentBackground}
      filenameHint={activeLanguage || 'code'}
      onReset={resetSettings}
      onUndo={undo}
      onRedo={redo}
      canUndo={canUndo()}
      canRedo={canRedo()}
      navigationContent={
        <SnippetNavigator
          snippets={codeSnippets}
          currentIndex={currentIndex}
          onIndexChange={setCurrentIndex}
          renderLabel={(s) => {
            const cs = s as CodeSnippet;
            return (
              <span className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono uppercase">
                  {cs.language}
                </span>
                <span className="truncate">{cs.code.split('\n')[0]}</span>
              </span>
            );
          }}
        />
      }
      previewContent={
        <CodeImagePreview
          ref={captureRef}
          code={activeCode}
          language={activeLanguage}
          settings={settings}
          onAnnotationUpdate={handleAnnotationUpdate}
          onSettingsUpdate={updateSettings}
        />
      }
      sidebarContent={
        <SettingsSidebar
          settings={settings}
          updateSettings={updateSettings}
          presets={presets}
          savePreset={savePreset}
          loadPreset={loadPreset}
          deletePreset={deletePreset}
          language={activeLanguage}
          lineCount={activeCode.split('\n').length}
        />
      }
    />
  );
};

export default CodeImageExportDialog;
