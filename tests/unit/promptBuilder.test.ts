import { describe, it, expect } from 'vitest';
import { buildPrompt } from '../../src/modules/prompt-builder/builder';
import { RULE_PACKS } from '../../src/modules/prompt-builder/rulePacks';
import { DEFAULT_SETTINGS } from '../../src/lib/storage';
import { SelectedImage, PhotographySettings, IntentType, TargetLLM, ReferencePhoto } from '../../src/types';

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

  const selfie: ReferencePhoto = {
    id: 'selfie-1',
    name: 'my_photo.jpg',
    dataUrl: 'data:image/jpeg;base64,mockdata',
    timestamp: 1000,
  };

  const intents = Object.keys(RULE_PACKS) as IntentType[];
  const targets: TargetLLM[] = ['chatgpt', 'gemini', 'midjourney', 'flux'];

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
    expect(result.promptText).toContain('Generate the image now');
    expect(result.promptText).not.toContain('Image 2');
    expect(result.imageUrls).toEqual(['https://i.pinimg.com/originals/test/image.jpg']);
  });

  it('should build a place_my_face prompt with selfie context', () => {
    const result = buildPrompt({
      selectedImage: mockImage,
      intent: 'place_my_face',
      target: 'gemini',
      settings: defaultSettings,
      referenceSelfie: selfie,
    });

    expect(result.intent).toBe('place_my_face');
    expect(result.promptText).toContain('- Image 2 (2-my-photo.jpg): a photo of me, used only for my face');
    expect(result.promptText).toContain('with my consent');
    expect(result.referenceSelfieDataUrl).toBe('data:image/jpeg;base64,mockdata');
  });

  it('should compile pro_portrait intent with studio headshot specs', () => {
    const result = buildPrompt({
      selectedImage: mockImage,
      intent: 'pro_portrait',
      target: 'chatgpt',
      settings: { ...defaultSettings, aspectRatio: '1:1' },
    });

    expect(result.intent).toBe('pro_portrait');
    expect(result.promptText).toContain('PROFESSIONAL HEADSHOT');
    expect(result.promptText).toContain('soft studio lighting');
    expect(result.promptText).toContain('Aspect ratio: 1:1.');
  });

  it('should format Midjourney prompts with an image prompt URL and parameters', () => {
    const result = buildPrompt({
      selectedImage: mockImage,
      intent: 'recreate_scene',
      target: 'midjourney',
      settings: defaultSettings,
    });

    expect(result.target).toBe('midjourney');
    expect(result.promptText.startsWith('https://i.pinimg.com/originals/test/image.jpg ')).toBe(true);
    expect(result.promptText).toContain('Paris Street Style');
    expect(result.promptText).toMatch(/--ar 4:5 --style raw$/);
    expect(result.promptText).not.toContain('--v ');
  });

  it('should format Flux prompts as plain text with the aspect ratio', () => {
    const result = buildPrompt({
      selectedImage: mockImage,
      intent: 'travel_lifestyle',
      target: 'flux',
      settings: { ...defaultSettings, aspectRatio: '9:16' },
    });

    expect(result.promptText).toContain('Paris Street Style');
    expect(result.promptText).toContain(RULE_PACKS.travel_lifestyle.styleKeywords);
    expect(result.promptText).toContain('Aspect ratio 9:16.');
    expect(result.promptText).not.toContain('--ar');
  });

  it('should never include details copied from one specific reference photo', () => {
    const banned = [/star/i, /safety pin/i, /split-screen/i, /graffiti/i, /harness/i, /bypass/i];
    for (const intent of intents) {
      for (const target of targets) {
        for (const referenceSelfie of [null, selfie]) {
          const { promptText } = buildPrompt({ selectedImage: mockImage, intent, target, settings: defaultSettings, referenceSelfie });
          for (const pattern of banned) {
            expect(promptText, `${intent}/${target} matched ${pattern}`).not.toMatch(pattern);
          }
        }
      }
    }
  });

  it('should include the chosen aspect ratio and contiguous checklist numbering for every intent', () => {
    for (const intent of intents) {
      for (const referenceSelfie of [null, selfie]) {
        const { promptText } = buildPrompt({
          selectedImage: mockImage,
          intent,
          target: 'chatgpt',
          settings: { ...defaultSettings, aspectRatio: '3:2' },
          referenceSelfie,
        });

        // Editing my own photo keeps its shape; every other style uses the chosen ratio.
        const expectedRatio = intent === 'apply_effect' && referenceSelfie ? 'Aspect ratio: the same as Image 2.' : 'Aspect ratio: 3:2.';
        expect(promptText, intent).toContain(expectedRatio);
        const numbers = [...promptText.matchAll(/^(\d+)\. /gm)].map((m) => Number(m[1]));
        expect(numbers, intent).toEqual(numbers.map((_, i) => i + 1));
        expect(promptText, intent).not.toMatch(/\n{3,}/);
      }
    }
  });

  it('should use the custom directive as the main instruction for directed_edit', () => {
    const { promptText } = buildPrompt({
      selectedImage: mockImage,
      intent: 'directed_edit',
      target: 'chatgpt',
      settings: { ...defaultSettings, customDirective: 'make it a rainy night' },
    });

    expect(promptText).toContain('My instructions: make it a rainy night');
    expect(promptText).not.toContain('Extra direction');
  });

  describe('putting the user in the photo', () => {
    const withSelfie = (intent: IntentType, settings = defaultSettings) =>
      buildPrompt({ selectedImage: mockImage, intent, target: 'chatgpt', settings, referenceSelfie: selfie }).promptText;

    it('should frame "Put me in this photo" as an edit of Image 1, not a new photo', () => {
      const text = withSelfie('place_my_face');
      expect(text).toContain('Edit Image 1: replace the person in it with me (Image 2)');
      expect(text).toContain('not a new photo');
    });

    it('should take only facial identity from the selfie, never its accessories, expression or lighting', () => {
      for (const intent of intents.filter((i) => i !== 'apply_effect')) {
        const text = withSelfie(intent);
        expect(text, intent).toContain('Take ONLY my identity from Image 2 (2-my-photo.jpg)');
        expect(text, intent).toMatch(/Do NOT copy anything else from Image 2: not its glasses or sunglasses/);
        expect(text, intent).toContain('expression');
      }
    });

    it('should keep the facial expression and pose from Image 1 when placing or recreating', () => {
      for (const intent of ['place_my_face', 'recreate_scene'] as IntentType[]) {
        expect(withSelfie(intent), intent).toContain('exactly the facial expression of the person in Image 1');
      }
    });

    it('should keep the inspiration\'s text and graphics by default', () => {
      expect(DEFAULT_SETTINGS.textOverlayMode).toBe('original');
      const text = withSelfie('place_my_face', DEFAULT_SETTINGS);
      expect(text).toContain('keep every word of text, typography, sticker, shape and graphic overlay from Image 1');
      expect(text).not.toContain('remove all words');
    });

    it('should name both attachments so the images cannot be mixed up', () => {
      const text = withSelfie('place_my_face');
      expect(text).toContain('Image 1 (1-inspiration.jpg)');
      expect(text).toContain('Image 2 (2-my-photo.jpg)');
      expect(text).toContain('Camera: 85mm portrait prime lens.');
    });
  });

  describe('adding the inspiration\'s effect to my own photo', () => {
    const text = buildPrompt({ selectedImage: mockImage, intent: 'apply_effect', target: 'chatgpt', settings: defaultSettings, referenceSelfie: selfie }).promptText;

    it('should edit Image 2 (my photo) and use Image 1 only as the effect reference', () => {
      expect(text).toContain('Edit Image 2 (my photo): add the effects and graphics from Image 1');
      expect(text).toContain('- Image 2 (2-my-photo.jpg): my own photo, the base image to edit');
      expect(text).toContain('Do not copy the person, clothes, pose or background from Image 1.');
    });

    it('should keep my whole photo instead of taking only my face from it', () => {
      expect(text).toContain('keep me exactly as I am in Image 2');
      expect(text).not.toContain('Take ONLY my identity');
    });

    it('should keep my photo\'s shape and skip the lens setting', () => {
      expect(text).toContain('Aspect ratio: the same as Image 2. Do not crop');
      expect(text).not.toContain('Camera:');
    });
  });

  describe('with extra photos of my face', () => {
    const extraFaces: ReferencePhoto[] = [
      { ...selfie, id: 'extra-1', dataUrl: 'data:image/jpeg;base64,side' },
      { ...selfie, id: 'extra-2', dataUrl: 'data:image/jpeg;base64,smile' },
    ];
    const build = (intent: IntentType, referenceSelfie: ReferencePhoto | null = selfie) =>
      buildPrompt({ selectedImage: mockImage, intent, target: 'chatgpt', settings: defaultSettings, referenceSelfie, extraFaces });

    it('should attach and name every extra photo after the main one', () => {
      const result = build('place_my_face');
      expect(result.extraFaceDataUrls).toEqual(['data:image/jpeg;base64,side', 'data:image/jpeg;base64,smile']);
      expect(result.promptText).toContain('- Image 3 (3-my-face.jpg): another photo of me from a different angle');
      expect(result.promptText).toContain('- Image 4 (4-my-face.jpg)');
    });

    it('should take my identity from all of my photos combined', () => {
      const text = build('place_my_face').promptText;
      expect(text).toContain('Take ONLY my identity from Images 2–4 (all photos of me from different angles');
      expect(text).toContain('replace the person in it with me (Images 2–4)');
      expect(text).toContain('never the glasses from my photos');
    });

    it('should still edit only Image 2 when adding an effect to my photo', () => {
      const text = build('apply_effect').promptText;
      expect(text).toContain('keep me exactly as I am in Image 2');
      expect(text).toContain('Images 3–4: more photos of me, used only to keep my face accurate.');
    });

    it('should ignore extra photos when there is no main photo', () => {
      const result = build('recreate_scene', null);
      expect(result.extraFaceDataUrls).toEqual([]);
      expect(result.promptText).not.toContain('Image 3');
    });
  });

  it('should take glasses from Image 1, never from my photo, when placing me', () => {
    const text = buildPrompt({ selectedImage: mockImage, intent: 'place_my_face', target: 'chatgpt', settings: defaultSettings, referenceSelfie: selfie }).promptText;
    expect(text).toContain('wear the same glasses as the person in Image 1, or none if they have none; never the glasses from Image 2');
  });
});
