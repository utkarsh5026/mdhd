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

type TableElementProps = React.ComponentPropsWithoutRef<
  'table' | 'thead' | 'tbody' | 'tr' | 'th' | 'td'
>;

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

function triggerDownload(url: string, filename: string, isBlobUrl = false) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  if (isBlobUrl) URL.revokeObjectURL(url);
}

const TableWrapper: React.FC<React.ComponentPropsWithoutRef<'table'>> = (props) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

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
          triggerDownload(dataUrl, 'table.png');
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
        triggerDownload(URL.createObjectURL(blob), 'table.csv', true);
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
        XLSX.writeFile(wb, 'table.xlsx');
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
