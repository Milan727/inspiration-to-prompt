/**
 * Returns the host permission pattern needed to fetch an image (e.g. `https://example.com/*`),
 * or null for URLs that need no permission (data: URLs, invalid URLs).
 */
export function imageOriginPattern(url: string): string | null {
  try {
    const { protocol, host } = new URL(url);
    if (protocol !== 'https:' && protocol !== 'http:') return null;
    return `${protocol}//${host}/*`;
  } catch {
    return null;
  }
}

/**
 * Asks for access to the site hosting the image so the service worker can fetch it for attachment.
 * Must be called directly from a click handler (before any other await) to keep the user gesture.
 * Resolves true without prompting when access is already granted (e.g. Pinterest's pinimg.com).
 */
export async function requestImageHostAccess(url: string): Promise<boolean> {
  const pattern = imageOriginPattern(url);
  if (!pattern) return true;
  return chrome.permissions.request({ origins: [pattern] });
}
