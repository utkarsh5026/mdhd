export type ValidateFileNameOptions = {
  /**
   * When set (e.g. ".md"), the caller intends the extension to be fixed/read-only.
   * In that case the editable portion must not contain dots and must not include
   * the extension.
   */
  fixedExtension?: string;
};

/**
 * Validates a file name according to frontend/editor/storage constraints.
 *
 * @param input - The user-entered file name to validate.
 * @param options - Optional configuration for fixed extensions (e.g., { fixedExtension: ".md" }).
 *   If `fixedExtension` is provided, the user should not include the extension or any dots in the name.
 * @returns An empty string if valid, otherwise a user-facing error message describing the first problem found.
 *
 * Rules enforced:
 *  - Name cannot be empty.
 *  - Name cannot start/end with whitespace.
 *  - Name cannot be '.' or '..'.
 *  - Name must not exceed 255 characters.
 *  - Name must not contain '/' or '\\' (platform/path safety).
 *  - Name must not contain ASCII control characters (0x00-0x1F or 0x7F).
 *  - Name must not contain any of: < > : " | ? *
 *  - Name must not end with a dot ('.').
 *  - If fixedExtension is set, name must not include dots or the extension itself.
 */
export function validateFileName(input: string, options: ValidateFileNameOptions = {}): string {
  const raw = input;

  if (raw.length === 0) return 'Name cannot be empty';
  if (raw !== raw.trim())
    return 'Name cannot start or end with whitespace. Remove leading/trailing spaces.';

  if (raw === '.' || raw === '..') return 'That name is not allowed';

  if (raw.length > 255) return 'Name is too long';

  if (raw.includes('/') || raw.includes('\\')) return "Name cannot contain '/' or '\\'";

  for (const ch of raw) {
    const code = ch.codePointAt(0) ?? 0;
    if (code <= 0x1f || code === 0x7f) {
      return 'Name cannot contain control characters';
    }
  }

  if (/[<>:"|?*]/.test(raw)) {
    return 'Name cannot contain any of these characters: < > : " | ? *';
  }

  if (raw.endsWith('.')) return "Name cannot end with '.'";

  const fixedExt = options.fixedExtension;
  if (fixedExt) {
    const lower = raw.toLowerCase();
    const lowerExt = fixedExt.toLowerCase();

    if (raw.includes('.')) {
      return `The extension is fixed to ${fixedExt}. Don’t include dots (.) in the name.`;
    }
    if (lower.endsWith(lowerExt)) {
      return `The extension is fixed to ${fixedExt}. Please type only the name.`;
    }
  }

  return '';
}
