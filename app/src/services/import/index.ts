/**
 * Document import: turns Word, Google Docs, HTML, and source files into markdown.
 *
 * Everything downstream of an upload — section parsing, search, tabs, sync,
 * export — operates on markdown strings, so conversion happens once at import
 * time and nothing else in the app needs to know a file started life as a
 * `.docx` or a `.rs`. Conversion is entirely client-side and works offline.
 *
 * Google Docs is covered through its `.docx` export; there is no live Drive
 * integration, by design — the app must not hard-depend on the server.
 */
export { convertFirstDocument, convertToMarkdown } from './convert';
export {
  detectFormat,
  getExtension,
  IMPORT_ACCEPT_ATTRIBUTE,
  isImportable,
  toMarkdownFilename,
} from './formats';
export { type ConvertedDocument, DocumentConversionError, type ImportFormat } from './types';
