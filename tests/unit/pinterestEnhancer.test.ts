import { describe, it, expect } from 'vitest';
import { enhancePinterestUrl, cleanPinterestText, pinimgCandidates, getBestImageSource, extractPinterestMetadata } from '../../src/modules/image-selection/pinterestEnhancer';

describe('pinterestEnhancer', () => {
  it('should upgrade 236x Pinterest thumbnail URL to originals', () => {
    const input = 'https://i.pinimg.com/236x/12/34/56/1234567890abcdef.jpg';
    const expected = 'https://i.pinimg.com/originals/12/34/56/1234567890abcdef.jpg';
    expect(enhancePinterestUrl(input)).toBe(expected);
  });

  it('should upgrade 564x Pinterest URL to originals', () => {
    const input = 'https://i.pinimg.com/564x/ab/cd/ef/abcdef.jpg';
    const expected = 'https://i.pinimg.com/originals/ab/cd/ef/abcdef.jpg';
    expect(enhancePinterestUrl(input)).toBe(expected);
  });

  it('should leave non-Pinterest URLs intact', () => {
    const input = 'https://images.unsplash.com/photo-123456789?auto=format';
    expect(enhancePinterestUrl(input)).toBe(input);
  });
});

describe('cleanPinterestText', () => {
  it('should strip Pinterest auto-caption prefixes and keep the rest unchanged', () => {
    expect(cleanPinterestText('This may contain: a woman in a linen suit')).toBe('a woman in a linen suit');
    expect(cleanPinterestText('  Face swap test  ')).toBe('Face swap test');
  });
});

describe('pinimgCandidates', () => {
  it('should list the original first, then sizes that always exist', () => {
    expect(pinimgCandidates('https://i.pinimg.com/originals/ab/x.jpg')).toEqual([
      'https://i.pinimg.com/originals/ab/x.jpg',
      'https://i.pinimg.com/736x/ab/x.jpg',
      'https://i.pinimg.com/474x/ab/x.jpg',
    ]);
    expect(pinimgCandidates('https://example.com/a.jpg')).toEqual(['https://example.com/a.jpg']);
  });
});

describe('getBestImageSource', () => {
  it('should keep the loaded image as the fallback and pick the largest srcset entry', () => {
    const img = document.createElement('img');
    img.src = 'https://i.pinimg.com/236x/ab/x.jpg';
    img.srcset = 'https://i.pinimg.com/236x/ab/x.jpg 1x, https://i.pinimg.com/474x/ab/x.jpg 2x, https://i.pinimg.com/originals/ab/x.png 4x';
    expect(getBestImageSource(img)).toEqual({
      url: 'https://i.pinimg.com/236x/ab/x.jpg',
      highResUrl: 'https://i.pinimg.com/originals/ab/x.png',
    });
  });
});

describe('extractPinterestMetadata', () => {
  it('should read the title and link from the pin card, not the page logo', () => {
    document.body.innerHTML = `
      <header><h1>Pinterest</h1><a href="https://www.pinterest.com/pin/111/">other pin</a></header>
      <div class="card">
        <a href="https://www.pinterest.com/pin/222/"><img alt="This may contain: a man in a jersey"></a>
        <div data-test-id="pinTitle">Everything looks intentional</div>
      </div>`;
    const img = document.querySelector('img')!;
    expect(extractPinterestMetadata(img)).toEqual({
      title: 'Everything looks intentional',
      alt: 'a man in a jersey',
      sourceUrl: 'https://www.pinterest.com/pin/222/',
    });
  });

  it('should never use "Pinterest" as a title', () => {
    document.body.innerHTML = `<div><img alt=""><div data-test-id="pin-title">Pinterest</div></div>`;
    expect(extractPinterestMetadata(document.querySelector('img')!).title).toBe('Inspiration Photo');
  });
});
