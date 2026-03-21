import { useCallback, useRef, useState } from 'react';

import { useReadingSettingsStore } from '@/components/features/settings/store/reading-settings-store';
import { fontFamilyMap } from '@/lib/font';
import type { MarkdownMetadata, MarkdownSection } from '@/services/section/parsing';

import { buildPrintHtml, type PdfExportOptions } from '../utils/build-print-html';

export interface PdfExportSettings {
  includeTableOfContents: boolean;
  includeMetadata: boolean;
  pageSize: 'a4' | 'letter' | 'legal';
}

const DEFAULT_SETTINGS: PdfExportSettings = {
  includeTableOfContents: true,
  includeMetadata: true,
  pageSize: 'a4',
};

/**
 * Clones rendered markdown sections from the live DOM into the print iframe.
 * Each section's inner HTML is copied so we get the fully-rendered markdown
 * (including CodeMirror highlights) rather than raw markdown text.
 */
function injectRenderedSections(iframeDoc: Document) {
  // Find all rendered scroll sections in the main document
  const liveSections = document.querySelectorAll('[data-section-index]');

  // Find all placeholder divs in the iframe
  const placeholders = iframeDoc.querySelectorAll('[data-section-index]');

  placeholders.forEach((placeholder) => {
    const index = placeholder.getAttribute('data-section-index');
    if (index === null) return;

    // Find the matching live section
    const liveSection = Array.from(liveSections).find(
      (el) => el.getAttribute('data-section-index') === index
    );

    if (liveSection) {
      // Clone the rendered content
      const clone = liveSection.cloneNode(true) as HTMLElement;
      // Remove any interactive buttons or no-print elements
      clone.querySelectorAll('button, [data-no-print], .no-print').forEach((el) => el.remove());
      placeholder.replaceWith(clone);
    }
  });
}

export function usePdfExport() {
  const [isExporting, setIsExporting] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const exportPdf = useCallback(
    (
      title: string,
      sections: MarkdownSection[],
      metadata: MarkdownMetadata | null,
      settings: PdfExportSettings = DEFAULT_SETTINGS
    ) => {
      setIsExporting(true);

      const readingSettings = useReadingSettingsStore.getState().settings;
      const fontFamily = fontFamilyMap[readingSettings.fontFamily];

      const options: PdfExportOptions = {
        title,
        sections,
        metadata,
        fontFamily,
        fontSize: readingSettings.fontSize,
        lineHeight: readingSettings.lineHeight,
        ...settings,
      };

      const html = buildPrintHtml(options);

      // Remove any existing iframe
      if (iframeRef.current) {
        iframeRef.current.remove();
        iframeRef.current = null;
      }

      // Create hidden iframe for printing
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.top = '-10000px';
      iframe.style.left = '-10000px';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
      iframeRef.current = iframe;

      const iframeDoc = iframe.contentDocument ?? iframe.contentWindow?.document;
      if (!iframeDoc) {
        setIsExporting(false);
        return;
      }

      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      iframe.onload = () => {
        setTimeout(() => {
          if (iframe.contentDocument) {
            injectRenderedSections(iframe.contentDocument);
          }

          setTimeout(() => {
            iframe.contentWindow?.print();
            setIsExporting(false);

            setTimeout(() => {
              iframe.remove();
              iframeRef.current = null;
            }, 1000);
          }, 100);
        }, 300);
      };
    },
    []
  );

  return { exportPdf, isExporting };
}
