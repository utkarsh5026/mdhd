import { format, parseISO } from 'date-fns';
import { Sparkles } from 'lucide-react';
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
 * The body of a release announcement: wordmark, headline, up to three
 * highlights, and the acknowledge button.
 *
 * Rendered inside both the desktop dialog and the mobile bottom sheet, so it
 * owns its own spacing but never its own positioning.
 */
const ReleaseNotes: React.FC<ReleaseNotesProps> = ({
  release,
  onDismiss,
  dismissRef,
  className,
}) => (
  <div className={cn('relative flex flex-col', className)}>
    {/* Soft primary wash behind the header — decorative only. Radial rather
        than linear so it fades on every side instead of ending in a hard edge. */}
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 -top-10 h-52 bg-[radial-gradient(75%_100%_at_50%_0%,color-mix(in_oklch,var(--primary)_16%,transparent),transparent_72%)]"
    />

    <div className="relative flex flex-col gap-6">
      {/* Wordmark + version */}
      <div className="flex items-center gap-2.5">
        <span className="grid size-7 place-items-center rounded-xl bg-primary/10 ring-1 ring-primary/15">
          <Sparkles className="size-3.5 text-primary" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50 select-none">
          mdhd
        </span>
        <span className="rounded-full border border-border/50 px-2.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground/70">
          {release.version}
        </span>
      </div>

      {/* Headline */}
      <div className="space-y-1.5">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground text-balance">
          {release.title}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground/80 text-pretty">
          {release.tagline}
        </p>
      </div>

      {/* Highlights */}
      <ul className="space-y-2">
        {release.highlights.slice(0, 3).map(({ icon: Icon, title, description }, index) => (
          <li
            key={title}
            style={{ animationDelay: `${80 + index * 70}ms` }}
            className={cn(
              'flex items-start gap-3.5 rounded-2xl border border-border/40 bg-card/40 p-3.5',
              'transition-colors hover:border-border/70 hover:bg-card/70',
              'animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards duration-300'
            )}
          >
            <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 ring-1 ring-primary/15">
              <Icon className="size-4 text-primary" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-snug text-foreground">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground/70 text-pretty">
                {description}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {/* Footer */}
      <div className="flex items-center gap-3 border-t border-border/40 pt-4">
        <span className="text-[11px] text-muted-foreground/40">
          {format(parseISO(release.date), 'MMMM d, yyyy')}
        </span>
        <button
          ref={dismissRef}
          onClick={onDismiss}
          className={cn(
            'ml-auto h-9 rounded-xl bg-primary px-5 text-xs font-medium text-primary-foreground',
            'transition-all duration-150 hover:bg-primary/90 active:scale-[0.98] cursor-pointer',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'
          )}
        >
          Got it
        </button>
      </div>
    </div>
  </div>
);

ReleaseNotes.displayName = 'ReleaseNotes';
export default ReleaseNotes;
