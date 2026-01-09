import React from 'react';

type TableElementProps = React.ComponentPropsWithoutRef<
  'table' | 'thead' | 'tbody' | 'tr' | 'th' | 'td'
>;

interface TableRenderProps {
  type: 'table' | 'thead' | 'tbody' | 'tr' | 'th' | 'td';
  props: TableElementProps;
}

/**
 * TableRender Component
 *
 * Renders responsive tables with improved mobile handling and touch-friendly interactions.
 * Features horizontal scrolling, adaptive text sizing, and optimized spacing.
 */
const TableRender: React.FC<TableRenderProps> = ({ type, props }) => {
  switch (type) {
    case 'table':
      return (
        <div className="my-4 sm:my-6 overflow-x-auto p-1 sm:p-2 rounded-md sm:rounded-xl no-swipe">
          <div className="min-w-full overflow-hidden rounded-lg sm:rounded-2xl shadow-sm">
            <table
              {...(props as React.ComponentPropsWithoutRef<'table'>)}
              className="min-w-full divide-y divide-[#303030] border-separate border-spacing-0 text-xs sm:text-base"
            />
          </div>
        </div>
      );
    case 'thead':
      return (
        <thead {...(props as React.ComponentPropsWithoutRef<'thead'>)} className="bg-[#252525]" />
      );
    case 'tbody':
      return (
        <tbody
          {...(props as React.ComponentPropsWithoutRef<'tbody'>)}
          className="divide-y divide-[#303030] bg-[#1a1a1a]"
        />
      );
    case 'tr':
      return (
        <tr
          {...(props as React.ComponentPropsWithoutRef<'tr'>)}
          className="hover:bg-[#242424] transition-colors duration-150"
        />
      );
    case 'th':
      return (
        <th
          {...(props as React.ComponentPropsWithoutRef<'th'>)}
          className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-foreground/80 uppercase tracking-wide sm:tracking-wider break-words"
        />
      );
    case 'td':
      return (
        <td
          {...(props as React.ComponentPropsWithoutRef<'td'>)}
          className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-base text-foreground/80 break-words leading-5 sm:leading-7"
        />
      );
    default:
      return null;
  }
};

export default TableRender;
