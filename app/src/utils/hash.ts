/**
 * Computes the SHA-256 hash of a UTF-8 string using the Web Crypto API.
 *
 * @param content - The string to hash.
 * @returns A lowercase hex-encoded SHA-256 digest.
 */
export async function sha256(content: string): Promise<string> {
  const data = new TextEncoder().encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
