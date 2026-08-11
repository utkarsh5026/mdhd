import { format, parseISO } from 'date-fns';
import React from 'react';

import { cn } from '@/lib/utils';

import type { Release } from '../data/releases';

interface ReleaseNotesProps {
  release: Release;
  onDismiss: () => void;
  /**
   * Ref to the acknowledge button, so the dialog can put initial focus on the
   * primary action rather than the close affordance.
   */
  dismissRef?: React.RefObject<HTMLButtonElement | null>;
  className?: string;
}

/**
 * The body of a release announcement: a meta line, the headline, up to three
 * highlights, and the acknowledge button.
 *
 * Deliberately plain — hairline rules and type weight carry the structure, so
 * this reads like the app's own writing rather than a product launch page.
 * Rendered inside both the desktop dialog and the mobile bottom sheet, so it
 * owns its own spacing but never its own positioning.
 */
const ReleaseNotes: React.FC<ReleaseNotesProps> = ({
  release,
  onDismiss,
  dismissRef,
  className,
}) => (
  <div className={cn('flex flex-col gap-5', className)}>
    {/* Meta */}
    <p className="flex items-baseline gap-2 text-[11px] text-muted-foreground/40 select-none">
      <span className="font-semibold uppercase tracking-widest">mdhd</span>
      <span className="tabular-nums">{release.version}</span>
      <span aria-hidden>·</span>
      <span className="tabular-nums">{format(parseISO(release.date), 'd MMM yyyy')}</span>
    </p>

    {/* Headline */}
    <div className="space-y-1.5">
      <h2 className="text-lg font-semibold tracking-tight text-foreground text-balance">
        {release.title}
      </h2>
      <p className="text-sm leading-relaxed text-muted-foreground/70 text-pretty">
        {release.tagline}
      </p>
    </div>

    {/* Highlights */}
    <ul className="divide-y divide-border/50 border-y border-border/50">
      {release.highlights.slice(0, 3).map(({ icon: Icon, title, description }) => (
        <li key={title} className="flex items-start gap-3.5 py-3.5">
          <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground/70" />
          <div className="min-w-0">
            <p className="text-sm font-medium leading-snug text-foreground">{title}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground/60 text-pretty">
              {description}
            </p>
          </div>
        </li>
      ))}
    </ul>

    {/* Footer */}
    <div className="flex justify-end">
      <button
        ref={dismissRef}
        onClick={onDismiss}
        className={cn(
          'h-8 rounded-lg border border-border/60 px-4 text-xs font-medium text-foreground/80',
          'transition-colors hover:bg-accent hover:text-foreground cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40'
        )}
      >
        Close
      </button>
    </div>
  </div>
);

ReleaseNotes.displayName = 'ReleaseNotes';
export default ReleaseNotes;
