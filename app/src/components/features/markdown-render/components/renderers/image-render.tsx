import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ImageIcon, ImageOffIcon, PlayCircleIcon, VideoOffIcon, XIcon } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { toast } from 'sonner';

import PhotoImageExportDialog from '@/components/features/image-export/components/photo-image-export-dialog';
import { DialogOverlay, DialogPortal } from '@/components/ui/dialog';
import ExportContextMenu from '@/components/ui/export-context-menu';
import { cn } from '@/lib/utils';
import { download, getNearestHeading, toFilename } from '@/utils/download';

import styles from './image-render.module.css';

const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|mov|avi|mkv)(\?.*)?$/i;

function isVideoSrc(src: string | undefined): boolean {
  return src ? VIDEO_EXTENSIONS.test(src) : false;
}

function srcExtension(src: string | undefined, fallback: string): string {
  if (!src) return fallback;
  const match = /\.(\w{2,5})(\?|$)/.exec(src.split('/').pop() ?? '');
  return match ? match[1].toLowerCase() : fallback;
}

/**
 * ImageRender Component
 *
 * Renders image or video elements with:
 * - Shimmer skeleton loading state showing alt text while the media fetches
 * - Smooth fade-in animation when the media finishes loading
 * - Inline caption rendered from the markdown `title` attribute
 * - Bottom sheet gallery view that opens when the user clicks the media
 */
const ImageRender: React.FC<React.ComponentPropsWithoutRef<'img'>> = ({
  className,
  style,
  src,
  alt,
  title,
  width,
  height,
  crossOrigin,
  ...rest
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const [imageExportOpen, setImageExportOpen] = useState(false);
  const figureRef = useRef<HTMLElement>(null);

  const altText = alt ?? 'Image';
  const isVideo = isVideoSrc(src);

  const LoadingIcon = isVideo ? PlayCircleIcon : ImageIcon;
  const ErrorIcon = isVideo ? VideoOffIcon : ImageOffIcon;
  const errorText = isVideo ? 'Could not load video' : 'Could not load image';

  function getFilename(ext: string) {
    return toFilename(getNearestHeading(figureRef.current), ext, altText);
  }

  async function fetchAndDownload(fallbackExt: string) {
    if (!src) return;
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const ext = blob.type.split('/')[1]?.split('+')[0] ?? srcExtension(src, fallbackExt);
      download(URL.createObjectURL(blob), getFilename(ext), true);
    } catch {
      download(src, getFilename(srcExtension(src, fallbackExt)));
    }
  }

  const imageExportItems = [
    {
      label: 'Download',
      description: `Save ${srcExtension(src, 'png')} file`,
      onSelect: () => fetchAndDownload('png'),
    },
    {
      label: 'Copy image',
      description: 'Copy to clipboard',
      onSelect: async () => {
        if (!src) return;
        try {
          const res = await fetch(src);
          const blob = await res.blob();
          await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        } catch (err) {
          console.error('[ImageRender] copy image failed', err);
          toast.error('Failed to copy image');
        }
      },
    },
    {
      label: 'Copy URL',
      description: 'Copy image address',
      onSelect: async () => {
        if (!src) return;
        try {
          await navigator.clipboard.writeText(src);
        } catch (err) {
          console.error('[ImageRender] copy URL failed', err);
          toast.error('Failed to copy URL');
        }
      },
    },
    {
      label: 'Customize image',
      description: 'Export with style',
      onSelect: () => setImageExportOpen(true),
    },
    {
      label: 'Open in new tab',
      description: 'View full size',
      onSelect: () => {
        if (src) window.open(src, '_blank', 'noopener,noreferrer');
      },
    },
  ];

  const videoExportItems = [
    {
      label: 'Download',
      description: `Save ${srcExtension(src, 'mp4')} file`,
      onSelect: () => fetchAndDownload('mp4'),
    },
    {
      label: 'Copy URL',
      description: 'Copy video address',
      onSelect: async () => {
        if (!src) return;
        try {
          await navigator.clipboard.writeText(src);
        } catch (err) {
          console.error('[ImageRender] copy URL failed', err);
        }
      },
    },
    {
      label: 'Open in new tab',
      description: 'View in browser',
      onSelect: () => {
        if (src) window.open(src, '_blank', 'noopener,noreferrer');
      },
    },
  ];

  return (
    <>
      <ExportContextMenu
        title={isVideo ? 'Video' : 'Image'}
        items={isVideo ? videoExportItems : imageExportItems}
      >
        <figure ref={figureRef} className={cn('my-4', className)} style={style}>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={`View ${isVideo ? 'video' : 'image'}: ${altText}`}
            className="block w-full cursor-zoom-in relative min-h-48 overflow-hidden rounded-md"
          >
            {/* Shimmer skeleton — visible while loading */}
            {!loaded && !error && (
              <div
                className={cn(
                  'absolute inset-0 bg-muted/60 flex flex-col items-center justify-center gap-2 rounded-md',
                  styles.shimmer
                )}
              >
                <LoadingIcon size={28} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground italic max-w-[80%] truncate">
                  {altText}
                </span>
              </div>
            )}

            {/* Error overlay */}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/60 rounded-md">
                <ErrorIcon size={28} />
                <span className="text-xs italic">{errorText}</span>
              </div>
            )}

            {/* Media — hidden via opacity until loaded */}
            {isVideo ? (
              <video
                key={src}
                src={src}
                muted
                playsInline
                preload="metadata"
                onLoadedData={() => setLoaded(true)}
                onError={() => setError(true)}
                className={cn(
                  'max-w-full h-auto rounded-md transition-opacity duration-400',
                  loaded ? 'opacity-100' : 'opacity-0'
                )}
              />
            ) : (
              <img
                key={src}
                {...rest}
                src={src}
                alt={altText}
                width={width}
                height={height}
                crossOrigin={crossOrigin}
                onLoad={() => setLoaded(true)}
                onError={() => setError(true)}
                className={cn(
                  'max-w-full h-auto rounded-md transition-opacity duration-400',
                  loaded ? 'opacity-100' : 'opacity-0'
                )}
              />
            )}

            {/* Play indicator overlay for video thumbnails */}
            {isVideo && loaded && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-foreground/40 rounded-full p-2 backdrop-blur-sm">
                  <PlayCircleIcon size={36} className="text-background" />
                </div>
              </div>
            )}
          </button>

          {/* Inline caption: title if set, otherwise alt */}
          {(title ?? alt) && (
            <figcaption className="text-center text-xs text-muted-foreground/60 mt-1.5 px-1">
              {title ?? alt}
            </figcaption>
          )}

          {/* Bottom sheet gallery view */}
          <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
            <DialogPortal>
              <DialogOverlay />
              <DialogPrimitive.Content
                className={cn(
                  'fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] overflow-y-auto',
                  'rounded-t-2xl bg-background border-t border-border p-4',
                  'data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-4 data-[state=open]:fade-in-0 data-[state=open]:duration-300',
                  'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-4 data-[state=closed]:fade-out-0 data-[state=closed]:duration-200'
                )}
              >
                <DialogPrimitive.Title className="sr-only">
                  {title ?? altText}
                </DialogPrimitive.Title>

                {/* Drag handle + close button row */}
                <div className="relative py-2">
                  <div className="w-10 h-1 rounded-full bg-muted mx-auto" />
                  <DialogPrimitive.Close
                    aria-label="Close"
                    className="absolute top-0 right-0 p-1 rounded-full hover:bg-muted transition-colors cursor-pointer"
                  >
                    <XIcon className="size-5" />
                  </DialogPrimitive.Close>
                </div>

                {/* Full media or error state */}
                <div className="flex items-center justify-center min-h-40 mt-4">
                  {error ? (
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground w-full min-h-40">
                      <ErrorIcon size={32} />
                      <span className="text-sm italic">{errorText}</span>
                    </div>
                  ) : isVideo ? (
                    <video
                      src={src}
                      controls
                      playsInline
                      className="max-h-[70vh] max-w-full rounded-md mx-auto"
                    />
                  ) : (
                    <img
                      src={src}
                      alt={altText}
                      className="max-h-[70vh] max-w-full object-contain mx-auto rounded-md"
                    />
                  )}
                </div>

                {/* Alt text */}
                <p className="text-xs text-muted-foreground text-center mt-2">{altText}</p>

                {/* Caption */}
                {title && (
                  <p className="text-sm italic text-muted-foreground text-center mt-1">{title}</p>
                )}
              </DialogPrimitive.Content>
            </DialogPortal>
          </DialogPrimitive.Root>
        </figure>
      </ExportContextMenu>

      {imageExportOpen && src && (
        <PhotoImageExportDialog
          open={imageExportOpen}
          onOpenChange={setImageExportOpen}
          src={src}
          alt={altText}
        />
      )}
    </>
  );
};

export default ImageRender;
