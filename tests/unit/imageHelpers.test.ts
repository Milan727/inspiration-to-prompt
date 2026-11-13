import { describe, it, expect } from 'vitest';
import { imageOriginPattern } from '../../src/lib/imageAccess';
import { fitWithin } from '../../src/lib/imageResize';

describe('imageOriginPattern', () => {
  it('should return an origin match pattern for http(s) image URLs', () => {
    expect(imageOriginPattern('https://images.example.com/a/b.jpg?w=200')).toBe('https://images.example.com/*');
    expect(imageOriginPattern('http://example.com:8080/x.png')).toBe('http://example.com:8080/*');
  });

  it('should return null for data URLs and invalid input', () => {
    expect(imageOriginPattern('data:image/jpeg;base64,abc')).toBeNull();
    expect(imageOriginPattern('not a url')).toBeNull();
  });
});

describe('fitWithin', () => {
  it('should scale the longest side down to the limit and keep the aspect ratio', () => {
    expect(fitWithin(4000, 3000, 1024)).toEqual({ width: 1024, height: 768 });
    expect(fitWithin(1080, 1920, 1024)).toEqual({ width: 576, height: 1024 });
  });

  it('should never upscale small images', () => {
    expect(fitWithin(640, 480, 1024)).toEqual({ width: 640, height: 480 });
  });
});
