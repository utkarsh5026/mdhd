import * as DialogPrimitive from '@radix-ui/react-dialog';
import { toJpeg, toPng, toSvg } from 'html-to-image';
import { Redo2, Undo2, XIcon } from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react';

import { download, toFilename } from '@/components/features/markdown-render/utils/file';
import { Button } from '@/components/ui/button';
import { DialogOverlay, DialogPortal } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

import { useCodeImageExportStore } from '../store/code-image-export-store';
import CodeImagePreview from './code-image-preview';
import SettingsSidebar from './settings-sidebar';
import { ToolbarButton } from './shared-controls';

type ImageFormat = 'png' | 'svg' | 'jpg';
type ExportOptions = NonNullable<Parameters<typeof toPng>[1]>;

const converters: Record<ImageFormat, (el: HTMLElement, opts: ExportOptions) => Promise<string>> = {
  png: toPng,
  svg: toSvg,
  jpg: (el, opts) => toJpeg(el, { ...opts, quality: 0.95 }),
};

async function exportImage(
  el: HTMLElement | null,
  format: ImageFormat,
  language: string,
  options: ExportOptions
) {
  if (!el) return;
  try {
    const dataUrl = await converters[format](el, options);
    download(dataUrl, toFilename(language || 'code', format, 'snippet'));
  } catch (err) {
    console.error(`[CodeImageExport] ${format.toUpperCase()} export failed`, err);
  }
}

async function copyImageToClipboard(el: HTMLElement | null, options: ExportOptions) {
  if (!el) return;
  const dataUrl = await toPng(el, options);
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
}

interface CodeImageExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code: string;
  language: string;
}

const CodeImageExportDialog: React.FC<CodeImageExportDialogProps> = ({
  open,
  onOpenChange,
  code,
  language,
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
  } = useCodeImageExportStore();

  const [copied, setCopied] = useState(false);

  const getExportOptions = useCallback(
    () => ({
      pixelRatio: settings.exportScale,
      ...(settings.transparentBackground ? { backgroundColor: undefined } : {}),
    }),
    [settings.exportScale, settings.transparentBackground]
  );

  const handleExport = useCallback(
    (format: ImageFormat) => () =>
      exportImage(captureRef.current, format, language, getExportOptions()),
    [language, getExportOptions]
  );

  const handleCopyToClipboard = useCallback(async () => {
    try {
      await copyImageToClipboard(captureRef.current, getExportOptions());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('[CodeImageExport] copy failed', err);
    }
  }, [getExportOptions]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className={cn(
            'fixed bottom-0 left-0 right-0 z-50 h-[90vh] overflow-hidden flex flex-col font-cascadia-code',
            'rounded-t-2xl bg-background/95 backdrop-blur-xl border-t border-border/50 p-0',
            'shadow-[0_-8px_40px_rgba(0,0,0,0.12)]',
            'data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-4 data-[state=open]:fade-in-0 data-[state=open]:duration-300',
            'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-4 data-[state=closed]:fade-out-0 data-[state=closed]:duration-200'
          )}
        >
          {/* Drag handle + header */}
          <div className="shrink-0 rounded-t-2xl">
            <div className="relative pt-2.5 pb-1">
              <div className="w-8 h-1 rounded-full bg-foreground/15 mx-auto" />
              <DialogPrimitive.Close
                aria-label="Close"
                className="absolute top-2 right-3 p-1.5 rounded-lg hover:bg-muted/80 transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <XIcon className="size-4" />
              </DialogPrimitive.Close>
            </div>

            <div className="px-6 pb-3 flex items-center justify-between">
              <div>
                <DialogPrimitive.Title className="text-sm font-semibold tracking-tight">
                  Export Code Image
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-[11px] text-muted-foreground/70 mt-0.5">
                  Customize and export as PNG, SVG, or JPEG
                </DialogPrimitive.Description>
              </div>
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-muted/30">
                  <ToolbarButton label="Reset" onClick={resetSettings} />
                  <div className="w-px h-4 bg-border/40" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 cursor-pointer rounded-md hover:bg-muted"
                    onClick={undo}
                    disabled={!canUndo()}
                    title="Undo (Ctrl+Z)"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 cursor-pointer rounded-md hover:bg-muted"
                    onClick={redo}
                    disabled={!canRedo()}
                    title="Redo (Ctrl+Y)"
                  >
                    <Redo2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-muted/30">
                  <ToolbarButton
                    label={copied ? 'Copied 😃' : 'Copy'}
                    onClick={handleCopyToClipboard}
                    className={cn(copied && 'text-green-600 bg-green-500/5')}
                  />
                  <div className="w-px h-4 bg-border/40" />
                  <ToolbarButton label="SVG" onClick={handleExport('svg')} />
                  <ToolbarButton label="JPEG" onClick={handleExport('jpg')} />
                  <ToolbarButton label="PNG" onClick={handleExport('png')} />
                </div>
              </div>
            </div>
            <div className="h-px bg-border/30" />
          </div>

          {/* Content: Preview + Settings */}
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
            {/* Preview area with subtle pattern */}
            <div
              className="flex-1 overflow-auto relative min-h-0"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, var(--color-border) 0.5px, transparent 0)',
                backgroundSize: '24px 24px',
                backgroundColor: 'var(--color-muted)',
                backgroundBlendMode: 'multiply',
                opacity: 1,
              }}
            >
              <div className="absolute inset-0  pointer-events-none" />
              <div className="grid place-items-center min-h-full min-w-full p-6 lg:p-10">
                <div className="relative max-w-full drop-shadow-2xl">
                  <CodeImagePreview
                    ref={captureRef}
                    code={code}
                    language={language}
                    settings={settings}
                  />
                </div>
              </div>
            </div>

            {/* Controls Sidebar */}
            <SettingsSidebar
              settings={settings}
              updateSettings={updateSettings}
              presets={presets}
              savePreset={savePreset}
              loadPreset={loadPreset}
              deletePreset={deletePreset}
              language={language}
            />
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </DialogPrimitive.Root>
  );
};

export default CodeImageExportDialog;
