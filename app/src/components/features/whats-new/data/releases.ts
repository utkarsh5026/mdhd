import type { LucideIcon } from 'lucide-react';
import { History, Sparkles } from 'lucide-react';

/**
 * One thing that changed, written for someone who has never read the diff.
 *
 * Keep `title` to a few words and `description` to a single plain-language
 * sentence — this is a product announcement, not a changelog line.
 */
export interface ReleaseHighlight {
  /** Any `lucide-react` icon component. Rendered in a tinted tile. */
  icon: LucideIcon;
  /** Short label, ideally under ~34 characters so it stays on one line. */
  title: string;
  /** One sentence saying what the user can now do. No jargon, no file paths. */
  description: string;
}

/** A single announcement shown in the "What's new" modal. */
export interface Release {
  /**
   * Stable, unique, sortable identifier — `YYYY-MM-DD-slug`. Changing an
   * existing id re-announces that release to everyone, so only ever add new
   * ones.
   */
  id: string;
  /** Badge text shown next to the wordmark, e.g. `v1.2`. */
  version: string;
  /** ISO date (`YYYY-MM-DD`) the release shipped. */
  date: string;
  /** The headline. Sentence case, no trailing period. */
  title: string;
  /** One line under the headline framing why this release matters. */
  tagline: string;
  /** Between one and three highlights. Three is the maximum by design. */
  highlights: ReleaseHighlight[];
}

/**
 * Every MDHD release, **newest first**.
 *
 * New entries go at the top of this array — the first element is what the
 * modal announces. Maintained by the `/pr` command, which appends a release
 * whenever a pull request is opened.
 */
export const RELEASES: Release[] = [
  {
    id: '2026-08-11-whats-new',
    version: 'v1.0',
    date: '2026-08-11',
    title: "See what's new, right here",
    tagline: 'Every improvement to MDHD now introduces itself the moment it lands.',
    highlights: [
      {
        icon: Sparkles,
        title: 'A proper welcome for new features',
        description:
          'When something new ships, a short note tells you what changed — then gets out of your way.',
      },
      {
        icon: History,
        title: 'Catch up whenever you like',
        description:
          'Missed one? The sparkle in the sidebar reopens the latest release notes any time.',
      },
    ],
  },
];

/** The release the modal announces. `RELEASES` is ordered newest first. */
export const LATEST_RELEASE: Release = RELEASES[0];
