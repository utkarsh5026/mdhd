import { toPng } from 'html-to-image';
import React, { useRef } from 'react';
import * as XLSX from 'xlsx';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

/** Props accepted by any of the six HTML table elements rendered by this module. */
type TableElementProps = React.ComponentPropsWithoutRef<
  'table' | 'thead' | 'tbody' | 'tr' | 'th' | 'td'
>;

/**
 * Props for the `TableRender` dispatcher component.
 *
 * @param type  - The HTML table element tag to render.
 * @param props - Native HTML props forwarded to that element.
 */
interface TableRenderProps {
  type: 'table' | 'thead' | 'tbody' | 'tr' | 'th' | 'td';
  props: TableElementProps;
}

/**
 * Walks the DOM upward and leftward from `el` to find the nearest preceding heading.
 *
 * Checks previous siblings at each ancestor level, including headings nested inside
 * sibling subtrees. Returns an empty string when no heading is found.
 *
 * @param el - The starting DOM element (typically the table wrapper).
 * @returns The trimmed text content of the nearest `<h1>`–`<h6>`, or `''`.
 */
function getNearestHeading(el: HTMLElement): string {
  let node: HTMLElement | null = el;
  while (node) {
    let sibling = node.previousElementSibling as HTMLElement | null;

    while (sibling) {
      if (/^H[1-6]$/.test(sibling.tagName)) return sibling.textContent?.trim() ?? '';
      const headings = sibling.querySelectorAll('h1,h2,h3,h4,h5,h6');
      if (headings.length) return headings[headings.length - 1].textContent?.trim() ?? '';
      sibling = sibling.previousElementSibling as HTMLElement | null;
    }
    node = node.parentElement;
  }
  return '';
}

/**
 * Converts a heading string into a URL-safe filename with the given extension.
 *
 * Non-alphanumeric characters are replaced with hyphens and leading/trailing
 * hyphens are stripped. Falls back to `"table"` when the slug is empty.
 *
 * @param heading - The source heading text to slugify.
 * @param ext     - File extension without a leading dot (e.g. `'png'`, `'csv'`).
 * @returns A slugified filename such as `"my-table-heading.csv"`.
 */
function toFilename(heading: string, ext: string): string {
  const slug = heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug || 'table'}.${ext}`;
}

/**
 * Extracts all table rows from a container element as a 2-D array of cell strings.
 *
 * Queries every `<tr>` inside `container` and maps its `<th>` / `<td>` children to
 * their `textContent`. Used to build CSV and Excel exports.
 *
 * @param container - The DOM element wrapping the `<table>`.
 * @returns A 2-D array where each inner array represents one row of cell text values.
 */
function extractRows(container: HTMLElement): string[][] {
  const rows = Array.from(container.querySelectorAll('tr'));
  return rows.map((row) =>
    Array.from(row.querySelectorAll('th, td')).map((cell) => cell.textContent ?? '')
  );
}

/**
 * Triggers a browser file download by temporarily injecting an `<a>` element.
 *
 * When `isBlobUrl` is `true`, the object URL is revoked after the click to free memory.
 *
 * @param url       - The data URL or object URL pointing to the file content.
 * @param filename  - The suggested filename shown in the browser's save dialog.
 * @param isBlobUrl - Whether `url` is a `blob:` URL that should be revoked after use.
 */
function triggerDownload(url: string, filename: string, isBlobUrl = false) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  if (isBlobUrl) URL.revokeObjectURL(url);
}

/**
 * Renders a `<table>` inside a horizontally-scrollable, rounded container with a
 * right-click context menu offering PNG, CSV, and Excel export actions.
 *
 * The export filename is derived from the nearest preceding heading in the DOM.
 *
 * @component
 * @param props - Standard HTML `<table>` props forwarded to the inner element.
 */
const TableWrapper: React.FC<React.ComponentPropsWithoutRef<'table'>> = (props) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const getBaseName = () => {
    const el = wrapperRef.current;
    return el ? getNearestHeading(el.parentElement ?? el) : '';
  };

  const exportItems = [
    {
      emoji: '🖼️',
      label: 'Image',
      description: 'PNG · 2× resolution',
      onSelect: async () => {
        const el = wrapperRef.current;
        if (!el) return;
        try {
          const dataUrl = await toPng(el, { pixelRatio: 2 });
          triggerDownload(dataUrl, toFilename(getBaseName(), 'png'));
        } catch (err) {
          console.error('[TableRender] image export failed', err);
        }
      },
    },
    {
      emoji: '📄',
      label: 'CSV',
      description: 'Comma-separated',
      onSelect: () => {
        const el = wrapperRef.current;
        if (!el) return;
        const rows = extractRows(el);
        const csv = rows
          .map((row) =>
            row
              .map((cell) => {
                const escaped = cell.replace(/"/g, '""');
                return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
              })
              .join(',')
          )
          .join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        triggerDownload(URL.createObjectURL(blob), toFilename(getBaseName(), 'csv'), true);
      },
    },
    {
      emoji: '📊',
      label: 'Excel',
      description: '.xlsx spreadsheet',
      onSelect: () => {
        const el = wrapperRef.current;
        if (!el) return;
        const rows = extractRows(el);
        const ws = XLSX.utils.aoa_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Table');
        XLSX.writeFile(wb, toFilename(getBaseName(), 'xlsx'));
      },
    },
  ];

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="my-4 sm:my-6 overflow-x-auto rounded-2xl border border-border no-swipe">
          <div ref={wrapperRef} className="min-w-full overflow-hidden rounded-2xl shadow-sm">
            <table
              {...props}
              className="min-w-full divide-y divide-border border-separate border-spacing-0 text-xs sm:text-base"
            />
          </div>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-52 font-cascadia-code rounded-2xl">
        <div className="px-2 pt-1 pb-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Export table
          </p>
        </div>
        <ContextMenuSeparator />
        {exportItems.map(({ emoji, label, description, onSelect }) => (
          <ContextMenuItem key={label} onSelect={onSelect} className="gap-3 py-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-transparent text-base">
              {emoji}
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium leading-none">{label}</span>
              <span className="text-[11px] leading-none text-muted-foreground">{description}</span>
            </div>
          </ContextMenuItem>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
};

/**
 * Dispatches to the correct styled table sub-element based on the `type` prop.
 *
 * Acts as a unified entry point for react-markdown's table node renderers,
 * applying consistent Tailwind styles to each HTML table element variant.
 *
 * @component
 * @param props.type  - The table element tag to render (`table` | `thead` | `tbody` | `tr` | `th` | `td`).
 * @param props.props - Native HTML props forwarded to the rendered element.
 */
const TableRender: React.FC<TableRenderProps> = ({ type, props }) => {
  switch (type) {
    case 'table':
      return <TableWrapper {...(props as React.ComponentPropsWithoutRef<'table'>)} />;
    case 'thead':
      return (
        <thead {...(props as React.ComponentPropsWithoutRef<'thead'>)} className="bg-muted/50" />
      );
    case 'tbody':
      return (
        <tbody
          {...(props as React.ComponentPropsWithoutRef<'tbody'>)}
          className="divide-y divide-border bg-card"
        />
      );
    case 'tr':
      return (
        <tr
          {...(props as React.ComponentPropsWithoutRef<'tr'>)}
          className="hover:bg-muted/30 transition-colors duration-150"
        />
      );
    case 'th':
      return (
        <th
          {...(props as React.ComponentPropsWithoutRef<'th'>)}
          className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-foreground/80 uppercase tracking-wide sm:tracking-wider wrap-break-word"
        />
      );
    case 'td':
      return (
        <td
          {...(props as React.ComponentPropsWithoutRef<'td'>)}
          className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-base text-foreground/80 wrap-break-word leading-5 sm:leading-7"
        />
      );
    default:
      return null;
  }
};

export default TableRender;
