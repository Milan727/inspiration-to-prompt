import { pinimgCandidates } from '../modules/image-selection/pinterestEnhancer';

/**
 * Converts a Blob to a base64 data URL without FileReader, which is not available in
 * extension service workers.
 */
export async function blobToDataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return `data:${blob.type || 'application/octet-stream'};base64,${btoa(binary)}`;
}

/** Downloads an image as a data URL, walking the Pinterest size fallbacks when a URL fails. */
export async function fetchImageAsDataUrl(url: string): Promise<string> {
  const failures: string[] = [];
  for (const candidate of pinimgCandidates(url)) {
    try {
      const res = await fetch(candidate);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      if (!blob.type.startsWith('image/')) throw new Error(`not an image (${blob.type || 'unknown type'})`);
      return await blobToDataUrl(blob);
    } catch (err) {
      failures.push(`${candidate}: ${(err as Error).message}`);
    }
  }
  throw new Error(`Image download failed. ${failures.join('; ')}`);
}
