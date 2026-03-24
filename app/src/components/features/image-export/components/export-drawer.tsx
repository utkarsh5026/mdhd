import * as DialogPrimitive from '@radix-ui/react-dialog';
import { toJpeg, toPng, toSvg } from 'html-to-image';
import { Redo2, Undo2, XIcon } from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { DialogOverlay, DialogPortal } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { download, toFilename } from '@/utils/download';

import { ToolbarButton } from './settings/shared-controls';

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
  filenameHint: string,
  options: ExportOptions
) {
  if (!el) return;
  try {
    const dataUrl = await converters[format](el, options);
    download(dataUrl, toFilename(filenameHint || 'export', format, 'snippet'));
  } catch (err) {
    console.error(`[ImageExport] ${format.toUpperCase()} export failed`, err);
    toast.error(`${format.toUpperCase()} export failed`);
  }
}

async function copyImageToClipboard(el: HTMLElement | null, options: ExportOptions) {
  if (!el) return;
  const dataUrl = await toPng(el, options);
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
}

const GRID_BG = {
  backgroundImage: `
    linear-gradient(color-mix(in srgb, var(--color-foreground) 5%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--color-foreground) 5%, transparent) 1px, transparent 1px),
    linear-gradient(color-mix(in srgb, var(--color-foreground) 2.5%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--color-foreground) 2.5%, transparent) 1px, transparent 1px)
  `,
  backgroundSize: '120px 120px, 120px 120px, 24px 24px, 24px 24px',
};

type ResizeEdge = 'right' | 'bottom' | 'bottom-right';

const EDGE_CURSORS: Record<ResizeEdge, string> = {
  right: 'ew-resize',
  bottom: 'ns-resize',
  'bottom-right': 'nwse-resize',
};

const EDGE_THRESHOLD = 12;

function getEdgeFromPoint(rect: DOMRect, clientX: number, clientY: number): ResizeEdge | null {
  if (clientX < rect.left || clientY < rect.top) return null;
  if (clientX > rect.right + EDGE_THRESHOLD || clientY > rect.bottom + EDGE_THRESHOLD) return null;

  const nearRight = clientX >= rect.right - EDGE_THRESHOLD;
  const nearBottom = clientY >= rect.bottom - EDGE_THRESHOLD;

  if (nearRight && nearBottom) return 'bottom-right';
  if (nearRight) return 'right';
  if (nearBottom) return 'bottom';
  return null;
}

const DraggablePreview: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const panOffset = useRef({ x: 0, y: 0 });
  const dragState = useRef<{
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
  } | null>(null);
  const scaleRef = useRef(1);
  const resizeState = useRef<{
    edge: ResizeEdge;
    startX: number;
    startY: number;
    startScale: number;
  } | null>(null);
  // Natural (unscaled) width, captured once on first resize
  const naturalWidth = useRef<number | null>(null);

  const applyScale = (scale: number) => {
    scaleRef.current = scale;
    if (contentRef.current) {
      contentRef.current.style.transform = `scale(${scale})`;
    }
  };

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;

    if (contentRef.current) {
      const rect = contentRef.current.getBoundingClientRect();
      const edge = getEdgeFromPoint(rect, e.clientX, e.clientY);
      if (edge) {
        if (naturalWidth.current === null) {
          naturalWidth.current = rect.width / scaleRef.current;
        }
        resizeState.current = {
          edge,
          startX: e.clientX,
          startY: e.clientY,
          startScale: scaleRef.current,
        };
        containerRef.current?.setPointerCapture(e.pointerId);
        return;
      }
    }

    if (!containerRef.current) return;
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPanX: panOffset.current.x,
      startPanY: panOffset.current.y,
    };
    containerRef.current.style.cursor = 'grabbing';
    containerRef.current.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (resizeState.current && contentRef.current && naturalWidth.current) {
      const { edge, startX, startY, startScale } = resizeState.current;
      const dx = edge === 'bottom' ? 0 : e.clientX - startX;
      const dy = edge === 'right' ? 0 : e.clientY - startY;
      const delta = Math.abs(dx) > Math.abs(dy) ? dx : dy;
      const newScale = Math.max(0.15, startScale + delta / naturalWidth.current);
      applyScale(newScale);
      return;
    }

    if (dragState.current && wrapperRef.current) {
      const newX = dragState.current.startPanX + (e.clientX - dragState.current.startX);
      const newY = dragState.current.startPanY + (e.clientY - dragState.current.startY);
      panOffset.current = { x: newX, y: newY };
      wrapperRef.current.style.transform = `translate(${newX}px, ${newY}px)`;
      return;
    }

    if (containerRef.current && contentRef.current) {
      const edge = getEdgeFromPoint(
        contentRef.current.getBoundingClientRect(),
        e.clientX,
        e.clientY
      );
      containerRef.current.style.cursor = edge ? EDGE_CURSORS[edge] : 'grab';
    }
  }, []);

  const onPointerUp = useCallback(() => {
    resizeState.current = null;
    dragState.current = null;
    if (containerRef.current) containerRef.current.style.cursor = 'grab';
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden relative min-h-0 bg-muted/40 select-none"
      style={{ ...GRID_BG, cursor: 'grab' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div ref={wrapperRef} className="grid place-items-center min-h-full min-w-full p-6 lg:p-10">
        <div
          ref={contentRef}
          className="relative drop-shadow-2xl"
          style={{ transformOrigin: 'center center' }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (contentRef.current) {
              applyScale(1);
              naturalWidth.current = null;
            }
            if (wrapperRef.current) {
              wrapperRef.current.style.transform = '';
              panOffset.current = { x: 0, y: 0 };
            }
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export interface ExportDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  captureRef: React.RefObject<HTMLDivElement | null>;
  exportScale: number;
  transparentBackground: boolean;
  filenameHint: string;
  onReset: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  previewContent: React.ReactNode;
  sidebarContent: React.ReactNode;
  navigationContent?: React.ReactNode;
}

const ExportDrawer: React.FC<ExportDrawerProps> = ({
  open,
  onOpenChange,
  title,
  description,
  captureRef,
  exportScale,
  transparentBackground,
  filenameHint,
  onReset,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  previewContent,
  sidebarContent,
  navigationContent,
}) => {
  const [copied, setCopied] = useState(false);

  const getExportOptions = useCallback(
    () => ({
      pixelRatio: exportScale,
      ...(transparentBackground ? { backgroundColor: undefined } : {}),
    }),
    [exportScale, transparentBackground]
  );

  const handleExport = useCallback(
    (format: ImageFormat) => () =>
      exportImage(captureRef.current, format, filenameHint, getExportOptions()),
    [captureRef, filenameHint, getExportOptions]
  );

  const handleCopyToClipboard = useCallback(async () => {
    try {
      await copyImageToClipboard(captureRef.current, getExportOptions());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('[ImageExport] copy failed', err);
      toast.error('Failed to copy image to clipboard');
    }
  }, [captureRef, getExportOptions]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className={cn(
            'fixed bottom-0 left-0 right-0 z-50 h-[90vh] overflow-hidden flex flex-col ',
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
              <div className="flex items-center gap-3">
                <div>
                  <DialogPrimitive.Title className="text-sm font-semibold tracking-tight">
                    {title}
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description className="text-[11px] text-muted-foreground/70 mt-0.5">
                    {description}
                  </DialogPrimitive.Description>
                </div>
                {navigationContent}
              </div>
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-muted/30">
                  <ToolbarButton label="Reset" onClick={onReset} />
                  <div className="w-px h-4 bg-border/40" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 cursor-pointer rounded-md hover:bg-muted"
                    onClick={onUndo}
                    disabled={!canUndo}
                    title="Undo (Ctrl+Z)"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 cursor-pointer rounded-md hover:bg-muted"
                    onClick={onRedo}
                    disabled={!canRedo}
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

          {/* Content: Preview + Sidebar */}
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
            {/* Preview area — drag to pan */}
            <DraggablePreview>{previewContent}</DraggablePreview>

            {/* Sidebar */}
            {sidebarContent}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </DialogPrimitive.Root>
  );
};

export default ExportDrawer;
