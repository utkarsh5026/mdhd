/**
 * Converts a heading string into a URL-safe filename with the given extension.
 *
 * Non-alphanumeric characters are replaced with hyphens and leading/trailing
 * hyphens are stripped. Falls back to `fallback` when the slug is empty.
 *
 * @param heading - The heading text to slugify.
 * @param ext - The file extension to append (without leading dot).
 * @param fallback - Filename stem to use when the slug would be empty. Defaults to `'file'`.
 * @returns A URL-safe filename string, e.g. `"my-heading.csv"`.
 *
 * @example
 * toFilename('Hello, World!', 'csv') // → 'hello-world.csv'
 * toFilename('!!!', 'png')           // → 'file.png'
 */
export function toFilename(heading: string, ext: string, fallback = 'file'): string {
  const slug = heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug || fallback}.${ext}`;
}

/**
 * Triggers a file download in the browser by temporarily injecting an anchor element.
 *
 * Appends a hidden `<a>` to `document.body`, clicks it programmatically, then removes it.
 * When `isBlobUrl` is `true`, the object URL is revoked after the click to free memory.
 *
 * @param url - The resource URL or blob URL to download.
 * @param filename - The suggested filename for the downloaded file.
 * @param isBlobUrl - Whether `url` is a blob URL that should be revoked after download.
 */
export function download(url: string, filename: string, isBlobUrl = false) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  if (isBlobUrl) URL.revokeObjectURL(url);
}
