import React, { memo } from 'react';
import type { MarkdownMetadata } from '@/services/section/parsing';
import { cn } from '@/lib/utils';

interface MetadataDisplayProps {
  metadata: MarkdownMetadata;
  className?: string;
}

type MetadataValue = string | number | boolean | string[] | number[] | object | null | undefined;

const formatKey = (key: string): string => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
};

const isArrayLike = (value: MetadataValue): value is string[] | number[] => {
  return Array.isArray(value);
};

const toStringArray = (value: MetadataValue): string[] => {
  if (isArrayLike(value)) return value.map(String);
  if (typeof value === 'string') return value.split(',').map((s) => s.trim());
  return [];
};

const renderValue = (value: MetadataValue): React.ReactNode => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return value.toLocaleString();
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && !Array.isArray(value)) {
    return JSON.stringify(value);
  }
  return String(value);
};

const MetadataDisplay: React.FC<MetadataDisplayProps> = memo(({ metadata, className }) => {
  const entries = Object.entries(metadata).filter(
    ([, value]) => value !== null && value !== undefined && value !== ''
  );

  if (entries.length === 0) return null;

  const title = metadata.title as string | undefined;
  const otherEntries = entries.filter(([key]) => key !== 'title');

  return (
    <div className={cn('mb-4 pb-3 border-b border-border/20', className)}>
      {title && (
        <h1 className="text-lg font-medium text-foreground/85 mb-2">{title}</h1>
      )}

      {otherEntries.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground/60">
          {otherEntries.map(([key, value]) => {
            const typedValue = value as MetadataValue;
            const arrayValue = toStringArray(typedValue);
            const isArray = isArrayLike(typedValue) || (typeof typedValue === 'string' && typedValue.includes(','));

            if (isArray && arrayValue.length > 0) {
              return (
                <div key={key} className="flex items-center gap-1.5">
                  <span className="text-muted-foreground/40">{formatKey(key)}:</span>
                  <div className="flex flex-wrap gap-1">
                    {arrayValue.map((item, idx) => (
                      <span
                        key={`${key}-${idx}`}
                        className="px-1.5 py-0.5 rounded bg-muted/20 text-muted-foreground/50"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <span key={key} className="inline-flex items-center gap-1">
                <span className="text-muted-foreground/40">{formatKey(key)}:</span>
                <span className="text-muted-foreground/60">{renderValue(typedValue)}</span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
});

MetadataDisplay.displayName = 'MetadataDisplay';

export default MetadataDisplay;
