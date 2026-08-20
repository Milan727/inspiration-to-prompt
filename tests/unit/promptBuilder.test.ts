import { describe, it, expect } from 'vitest';
import { buildPrompt } from '../../src/modules/prompt-builder/builder';
import { SelectedImage, PhotographySettings } from '../../src/types';

describe('promptBuilder', () => {
  const mockImage: SelectedImage = {
    url: 'https://i.pinimg.com/236x/test/image.jpg',
    highResUrl: 'https://i.pinimg.com/originals/test/image.jpg',
    alt: 'Moody Portrait in Paris',
    title: 'Paris Street Style',
    sourceUrl: 'https://pinterest.com/pin/123456',
    timestamp: 1000,
  };

  const defaultSettings: PhotographySettings = {
    aspectRatio: '4:5',
    cameraLens: '85mm portrait prime',
    lightingStyle: 'golden hour',
    customDirective: '',
    textOverlayMode: 'none',
    customOverlayText: '',
  };

  it('should build a recreate_scene prompt correctly for ChatGPT', () => {
    const result = buildPrompt({
      selectedImage: mockImage,
      intent: 'recreate_scene',
      target: 'chatgpt',
      settings: defaultSettings,
    });

    expect(result.intent).toBe('recreate_scene');
    expect(result.target).toBe('chatgpt');
    expect(result.promptText).toContain('Paris Street Style');
    expect(result.promptText).toContain('85mm portrait prime');
    expect(result.promptText).toContain('CREATE AND RENDER THIS EXACT PHOTOGRAPH DIRECTLY NOW');
    expect(result.imageUrls).toEqual(['https://i.pinimg.com/originals/test/image.jpg']);
  });

  it('should build a place_my_face prompt with selfie context', () => {
    const result = buildPrompt({
      selectedImage: mockImage,
      intent: 'place_my_face',
      target: 'gemini',
      settings: defaultSettings,
      referenceSelfie: {
        id: 'selfie-1',
        name: 'my_photo.jpg',
        dataUrl: 'data:image/jpeg;base64,mockdata',
        timestamp: 1000,
      },
    });

    expect(result.intent).toBe('place_my_face');
    expect(result.promptText).toContain('Image 2 (Second attached image): Subject face photo');
    expect(result.referenceSelfieDataUrl).toBe('data:image/jpeg;base64,mockdata');
  });

  it('should compile pro_portrait intent with 85mm portrait specs', () => {
    const result = buildPrompt({
      selectedImage: mockImage,
      intent: 'pro_portrait',
      target: 'chatgpt',
      settings: { ...defaultSettings, aspectRatio: '1:1' },
    });

    expect(result.intent).toBe('pro_portrait');
    expect(result.promptText).toContain('EXECUTIVE PORTRAIT RECREATION');
    expect(result.promptText).toContain('Studio 3-point lighting setup');
  });

  it('should format Midjourney /imagine syntax correctly', () => {
    const result = buildPrompt({
      selectedImage: mockImage,
      intent: 'recreate_scene',
      target: 'midjourney',
      settings: defaultSettings,
    });

    expect(result.target).toBe('midjourney');
    expect(result.promptText).toContain('/imagine prompt:');
    expect(result.promptText).toContain('--ar 4:5 --v 6.0');
  });
});
