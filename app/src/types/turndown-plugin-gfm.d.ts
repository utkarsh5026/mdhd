/**
 * `turndown-plugin-gfm` ships no type declarations and has no `@types` package.
 * Only the plugins this project actually uses are declared.
 */
declare module 'turndown-plugin-gfm' {
  import type TurndownService from 'turndown';

  /** Adds tables, strikethrough, task lists, and fenced code blocks. */
  export const gfm: TurndownService.Plugin;
  /** Adds GFM table support on its own. */
  export const tables: TurndownService.Plugin;
  /** Adds `~~strikethrough~~` support on its own. */
  export const strikethrough: TurndownService.Plugin;
  /** Adds `- [ ]` task list support on its own. */
  export const taskListItems: TurndownService.Plugin;
}
