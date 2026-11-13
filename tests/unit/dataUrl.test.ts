// @vitest-environment node
// jsdom's Blob lacks arrayBuffer(); Node's matches what Chrome's service worker provides.
import { describe, it, expect, vi } from 'vitest';
import { blobToDataUrl, fetchImageAsDataUrl } from '../../src/lib/dataUrl';

describe('blobToDataUrl', () => {
  it('should encode a blob as a base64 data URL without FileReader', async () => {
    expect(await blobToDataUrl(new Blob(['hello'], { type: 'text/plain' }))).toBe('data:text/plain;base64,aGVsbG8=');
  });

  it('should handle binary data larger than one encoding chunk', async () => {
    const bytes = new Uint8Array(100_000).map((_, i) => i % 256);
    const url = await blobToDataUrl(new Blob([bytes], { type: 'image/png' }));
    expect(Buffer.from(url.split(',')[1], 'base64').equals(Buffer.from(bytes))).toBe(true);
  });
});

describe('fetchImageAsDataUrl', () => {
  it('should fall back to the 736x size when a guessed originals/ URL 404s', async () => {
    const calls: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      calls.push(url);
      return url.includes('/originals/')
        ? new Response('', { status: 404 })
        : new Response(new Blob(['img'], { type: 'image/jpeg' }));
    }));
    const dataUrl = await fetchImageAsDataUrl('https://i.pinimg.com/originals/ab/cd/x.jpg');
    expect(dataUrl.startsWith('data:image/jpeg;base64,')).toBe(true);
    expect(calls).toEqual(['https://i.pinimg.com/originals/ab/cd/x.jpg', 'https://i.pinimg.com/736x/ab/cd/x.jpg']);
    vi.unstubAllGlobals();
  });

  it('should report every failed attempt when nothing loads', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 403 })));
    await expect(fetchImageAsDataUrl('https://example.com/a.jpg')).rejects.toThrow('https://example.com/a.jpg: HTTP 403');
    vi.unstubAllGlobals();
  });

  it('should reject responses that are not images', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Blob(['<html>'], { type: 'text/html' }))));
    await expect(fetchImageAsDataUrl('https://example.com/a.jpg')).rejects.toThrow('not an image');
    vi.unstubAllGlobals();
  });
});
