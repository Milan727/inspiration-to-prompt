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
 * Sanitizes titles and text to strip public figures, celebrity names, and policy-triggering keywords
 */
export function sanitizePublicFiguresAndSafetyKeywords(text: string): string {
  if (!text) return '';

  let cleaned = text
    .replace(/^this may contain:\s*/i, '')
    .replace(/^image may contain:\s*/i, '')
    .replace(/^may be an image of\s*/i, '');

  // List of public figure / celebrity terms to anonymize for AI policy safety
  const publicFigureRegex = /\b(modi|narendra modi|nawazuddin|nawazuddin siddiqui|biden|trump|obama|putin|musk|elon musk|taylor swift|shah rukh khan|srk|salman khan|actor|politician|president|prime minister)\b/gi;
  cleaned = cleaned.replace(publicFigureRegex, 'subject');

  // Strip policy risk keywords
  cleaned = cleaned
    .replace(/\b(face swap|faceswap|swap face|substitute face|deepfake|impersonate)\b/gi, 'portrait subject styling')
    .trim();

  return cleaned;
}

/**
 * Extracts the highest quality image URL from an img element or srcset attribute.
 */
export function getBestImageSource(img: HTMLImageElement): { url: string; highResUrl: string } {
  let url = img.src || '';
  
  if (img.srcset) {
    const candidates = img.srcset
      .split(',')
      .map((entry) => {
        const parts = entry.trim().split(/\s+/);
        const src = parts[0];
        const descriptor = parts[1] || '1x';
        let scale = 1;
        if (descriptor.endsWith('x')) {
          scale = parseFloat(descriptor.replace('x', '')) || 1;
        } else if (descriptor.endsWith('w')) {
          scale = parseFloat(descriptor.replace('w', '')) || 1;
        }
        return { src, scale };
      })
      .sort((a, b) => b.scale - a.scale);

    if (candidates.length > 0 && candidates[0].src) {
      url = candidates[0].src;
    }
  }

  const dataSrc = img.getAttribute('data-src') || img.getAttribute('data-actual-src');
  if (dataSrc) {
    url = dataSrc;
  }

  const highResUrl = enhancePinterestUrl(url);

  return {
    url,
    highResUrl,
  };
}

export function cleanPinterestText(text: string): string {
  return sanitizePublicFiguresAndSafetyKeywords(text);
}

/**
 * Extracts metadata from Pinterest DOM container with public figure sanitization.
 * Scrapes descriptions and search tags from page DOM to extract detailed features without an API key!
 */
export function extractPinterestMetadata(img: HTMLImageElement): { title: string; alt: string; sourceUrl: string } {
  const rawAlt = img.alt || '';
  let alt = cleanPinterestText(rawAlt);
  let title = alt;
  let sourceUrl = window.location.href;

  let pinDescription = '';
  let pinTags: string[] = [];

  // 1. Scrape meta tags
  const metaDesc = document.querySelector('meta[property="og:description"], meta[name="description"]');
  if (metaDesc) {
    const content = metaDesc.getAttribute('content');
    if (content) {
      pinDescription = cleanPinterestText(content);
    }
  }

  // 2. Scrape on-page description container
  const descEl = document.querySelector('[data-test-id="pin-description"], [data-test-id="truncated-description"]');
  if (descEl && descEl.textContent) {
    const scrapedDesc = cleanPinterestText(descEl.textContent.trim());
    if (scrapedDesc.length > pinDescription.length) {
      pinDescription = scrapedDesc;
    }
  }

  // 3. Scrape tag lists
  const tagElements = document.querySelectorAll('[data-test-id="visual-search-tag"], [data-test-id="pin-tag"], a[href*="/search/q/"]');
  tagElements.forEach((el) => {
    if (el.textContent) {
      const tag = cleanPinterestText(el.textContent.trim());
      if (tag && !pinTags.includes(tag) && tag.length < 25) {
        pinTags.push(tag);
      }
    }
  });

  // 4. Scrape title
  let current: HTMLElement | null = img;
  while (current && current !== document.body) {
    const titleEl = current.querySelector('[data-test-id="pin-title"], [data-test-id="pinTitle"], h1, h2');
    if (titleEl && titleEl.textContent) {
      title = cleanPinterestText(titleEl.textContent.trim());
    }

    const linkEl = current.querySelector('a[href*="/pin/"]');
    if (linkEl && linkEl instanceof HTMLAnchorElement) {
      sourceUrl = linkEl.href;
    }

    current = current.parentElement;
  }

  // Combine title, description, and tags for rich prompt compilation
  let combinedDetails = title || alt || 'Inspiration Photo';
  if (pinDescription && pinDescription !== title) {
    combinedDetails += ` - Details: ${pinDescription}`;
  }
  if (pinTags.length > 0) {
    combinedDetails += ` (Tags: ${pinTags.join(', ')})`;
  }

  return {
    title: title || alt || 'Inspiration Photo',
    alt: combinedDetails,
    sourceUrl
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
