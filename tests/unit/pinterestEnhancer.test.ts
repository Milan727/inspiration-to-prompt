import { describe, it, expect } from 'vitest';
import { enhancePinterestUrl } from '../../src/modules/image-selection/pinterestEnhancer';

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
