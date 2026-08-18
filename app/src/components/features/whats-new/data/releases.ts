import type { LucideIcon } from 'lucide-react';
import { CloudUpload, KeyRound, PanelLeft, ScrollText, WifiOff } from 'lucide-react';

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
    id: '2026-08-17-offline',
    version: 'v1.1',
    date: '2026-08-17',
    title: 'MDHD works without a connection',
    tagline: 'Open it on a plane and everything you have read is still there.',
    highlights: [
      {
        icon: WifiOff,
        title: 'Opens with no internet',
        description:
          'Once you have visited MDHD, it loads and runs from your device even with no connection.',
      },
      {
        icon: KeyRound,
        title: 'You stay signed in',
        description:
          'Losing the network no longer signs you out — your documents and settings stay put.',
      },
      {
        icon: CloudUpload,
        title: 'Catches up when you reconnect',
        description:
          'Reading you do offline, including where you stopped, syncs on its own once you are back.',
      },
    ],
  },
  {
    id: '2026-08-11-whats-new',
    version: 'v1.0',
    date: '2026-08-11',
    title: 'Release notes now live in the app',
    tagline: 'A short summary each time MDHD changes.',
    highlights: [
      {
        icon: ScrollText,
        title: 'Notes when something changes',
        description: 'Open MDHD after an update and a note like this one lists what is new.',
      },
      {
        icon: PanelLeft,
        title: 'Kept in the sidebar',
        description: 'Reopen the notes any time from the icon at the bottom of the sidebar.',
      },
    ],
  },
];

/** The release the modal announces. `RELEASES` is ordered newest first. */
export const LATEST_RELEASE: Release = RELEASES[0];
