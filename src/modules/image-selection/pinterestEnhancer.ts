/**
 * Enhances Pinterest image URLs to fetch the highest-resolution version available.
 */
export function enhancePinterestUrl(url: string): string {
  if (!url) return url;

  if (url.includes('pinimg.com')) {
    const originalUrl = url.replace(/\/(236|474|564|736)x\//g, '/originals/');
    return originalUrl;
  }

  return url;
}

/**
 * Fallback chain for a Pinterest image URL. `originals/` URLs guessed from a thumbnail can 404 (the
 * original may be a .png while thumbnails are .jpg), but the 736x / 474x sizes always exist as .jpg.
 */
export function pinimgCandidates(url: string): string[] {
  if (!url || !url.includes('pinimg.com')) return url ? [url] : [];
  const sized = (size: string) => url.replace(/\/(originals|\d+x)\//, `/${size}/`);
  return [...new Set([url, sized('736x'), sized('474x')])];
}

/**
 * Extracts the highest quality image URL from an img element or srcset attribute.
 */
export function getBestImageSource(img: HTMLImageElement): { url: string; highResUrl: string } {
  // What the browser actually displayed: guaranteed to load, used as the last fallback.
  const loaded = img.currentSrc || img.src || '';
  let best = img.getAttribute('data-src') || img.getAttribute('data-actual-src') || loaded;

  if (img.srcset) {
    const candidates = img.srcset
      .split(',')
      .map((entry) => {
        const [src, descriptor = '1x'] = entry.trim().split(/\s+/);
        return { src, scale: parseFloat(descriptor) || 1 };
      })
      .filter((c) => c.src)
      .sort((a, b) => b.scale - a.scale);
    if (candidates.length > 0) best = candidates[0].src;
  }

  // A srcset entry that already points at originals/ is real; only guess originals/ for sized thumbnails.
  const highResUrl = best.includes('/originals/') ? best : enhancePinterestUrl(best);
  return { url: loaded || best, highResUrl };
}

/** Strips the auto-generated caption prefixes Pinterest adds to alt text ("This may contain: …"). */
export function cleanPinterestText(text: string): string {
  if (!text) return '';
  return text
    .replace(/^this may contain:\s*/i, '')
    .replace(/^image may contain:\s*/i, '')
    .replace(/^may be an image of\s*/i, '')
    .trim();
}

const GENERIC_TITLES = /^(pinterest|home|explore|inspiration photo)$/i;

/**
 * Extracts title, caption and pin link for a pin image. Looks only at the image's own card (nearest
 * ancestors), never the whole page: walking up to <body> used to pick up the site logo ("Pinterest")
 * and the link of a different pin.
 */
export function extractPinterestMetadata(img: HTMLImageElement): { title: string; alt: string; sourceUrl: string } {
  const alt = cleanPinterestText(img.alt || '');
  const onPinPage = /^\/pin\/\d+/.test(window.location.pathname);

  const pinLink = img.closest('a[href*="/pin/"]') as HTMLAnchorElement | null;
  const sourceUrl = pinLink?.href || (onPinPage ? window.location.href : '');

  let title = '';
  let node: HTMLElement | null = img.parentElement;
  for (let depth = 0; node && depth < 6 && !title; depth++, node = node.parentElement) {
    const titleEl = node.querySelector('[data-test-id="pin-title"], [data-test-id="pinTitle"]');
    title = cleanPinterestText(titleEl?.textContent?.trim() ?? '');
  }
  if (!title && onPinPage) {
    title = cleanPinterestText(document.querySelector('[data-test-id="pin-title"], main h1')?.textContent?.trim() ?? '');
  }
  if (GENERIC_TITLES.test(title)) title = '';

  return {
    title: title || alt || 'Inspiration Photo',
    alt: alt || title,
    sourceUrl,
  };
}

/**
 * Feature Extraction: Extracts Shot Type and Color Palette from image canvas
 */
export function extractVisualCanvasProperties(img: HTMLImageElement): { shotType: string; colorPalette: string } {
  const width = img.naturalWidth || img.clientWidth || 800;
  const height = img.naturalHeight || img.clientHeight || 1000;
  const ratio = width / height;

  let shotType = 'Medium Editorial Portrait';
  if (ratio < 0.75) {
    shotType = 'Full-Length Vertical Editorial Shoot';
  } else if (ratio >= 0.75 && ratio <= 1.1) {
    shotType = 'Close-up Studio Portrait / Headshot';
  } else if (ratio > 1.1) {
    shotType = 'Wide Environmental Travel / Landscape Shoot';
  }

  let colorPalette = 'Balanced natural lighting and rich contrast';
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 10;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0, 10, 10);
      const data = ctx.getImageData(0, 0, 10, 10).data;
      let r = 0, g = 0, b = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
      }
      r = Math.round(r / (data.length / 4));
      g = Math.round(g / (data.length / 4));
      b = Math.round(b / (data.length / 4));

      if (r > 160 && g > 120 && b < 100) {
        colorPalette = 'Warm Golden Hour sunlight with rich amber highlights';
      } else if (b > r && b > g) {
        colorPalette = 'Cool cinematic moody tones with cyan and navy shadows';
      } else if (r < 60 && g < 60 && b < 60) {
        colorPalette = 'High-contrast low-key dark studio shadows';
      } else if (r > 200 && g > 200 && b > 200) {
        colorPalette = 'Bright high-key diffused studio light';
      }
    }
  } catch (e) {
    // Cross-origin canvas security restriction fallback
  }

  return { shotType, colorPalette };
}
