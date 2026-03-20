import { toPng } from 'html-to-image';
import React, { useRef } from 'react';
import * as XLSX from 'xlsx';

import ExportContextMenu from '@/components/ui/export-context-menu';
import { download, getNearestHeading, toFilename } from '@/utils/download';

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

function extractRows(container: HTMLElement): string[][] {
  const rows = Array.from(container.querySelectorAll('tr'));
  return rows.map((row) =>
    Array.from(row.querySelectorAll('th, td')).map((cell) => cell.textContent ?? '')
  );
}

/**
 * Renders a `<table>` inside a horizontally-scrollable, rounded container with a
 * right-click context menu offering PNG, CSV, and Excel export actions.
 *
 * @component
 * @param props - Standard HTML `<table>` props forwarded to the inner element.
 */
const TableWrapper: React.FC<React.ComponentPropsWithoutRef<'table'>> = (props) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const exportItems = [
    {
      label: 'Image',
      description: 'PNG · 2× resolution',
      onSelect: async () => {
        const el = wrapperRef.current;
        if (!el) return;
        try {
          const dataUrl = await toPng(el, { pixelRatio: 2 });
          download(dataUrl, toFilename(getNearestHeading(wrapperRef.current), 'png', 'table'));
        } catch (err) {
          console.error('[TableRender] image export failed', err);
        }
      },
    },
    {
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
        download(
          URL.createObjectURL(blob),
          toFilename(getNearestHeading(wrapperRef.current), 'csv', 'table'),
          true
        );
      },
    },
    {
      label: 'Excel',
      description: '.xlsx spreadsheet',
      onSelect: () => {
        const el = wrapperRef.current;
        if (!el) return;
        const rows = extractRows(el);
        const ws = XLSX.utils.aoa_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Table');
        XLSX.writeFile(wb, toFilename(getNearestHeading(wrapperRef.current), 'xlsx', 'table'));
      },
    },
  ];

  return (
    <ExportContextMenu title="Export table" items={exportItems}>
      <div className="my-4 sm:my-6 overflow-x-auto rounded-2xl border border-border no-swipe">
        <div ref={wrapperRef} className="min-w-full overflow-hidden rounded-2xl shadow-sm">
          <table
            {...props}
            className="min-w-full divide-y divide-border border-separate border-spacing-0 text-xs sm:text-base"
          />
        </div>
      </div>
    </ExportContextMenu>
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
