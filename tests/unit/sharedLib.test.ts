import { describe, it, expect, beforeEach, vi } from 'vitest';
import { closestAspectRatio } from '../../src/lib/aspectRatio';
import { appendHistory, createHistoryItem, saveCapturedImage, HISTORY_LIMIT, STORAGE_KEYS } from '../../src/lib/storage';
import { buildPrompt } from '../../src/modules/prompt-builder/builder';
import { MAIN_INTENTS, MORE_INTENTS, RULE_PACKS } from '../../src/modules/prompt-builder/rulePacks';
import { DEFAULT_SETTINGS } from '../../src/lib/storage';
import { SelectedImage } from '../../src/types';

let store: Record<string, any>;
beforeEach(() => {
  store = {};
  (globalThis as any).chrome = {
    storage: {
      local: {
        get: vi.fn(async (keys: string | string[]) => {
          const list = Array.isArray(keys) ? keys : [keys];
          return Object.fromEntries(list.filter((k) => k in store).map((k) => [k, store[k]]));
        }),
        set: vi.fn(async (items: Record<string, any>) => Object.assign(store, items)),
      },
    },
  };
});

const image: SelectedImage = {
  url: 'https://i.pinimg.com/236x/a.jpg',
  highResUrl: 'https://i.pinimg.com/originals/a.jpg',
  alt: 'alt',
  title: 'Amalfi linen suit',
  sourceUrl: '',
  timestamp: 1,
  width: 1080,
  height: 1920,
};

describe('closestAspectRatio', () => {
  it('should match common photo shapes, including tall 9:16 images', () => {
    expect(closestAspectRatio(1080, 1920)).toBe('9:16');
    expect(closestAspectRatio(1080, 1350)).toBe('4:5');
    expect(closestAspectRatio(1000, 1000)).toBe('1:1');
    expect(closestAspectRatio(1500, 1000)).toBe('3:2');
    expect(closestAspectRatio(1920, 1080)).toBe('16:9');
  });

  it('should fall back to 4:5 for unknown sizes', () => {
    expect(closestAspectRatio(0, 0)).toBe('4:5');
  });
});

describe('storage helpers', () => {
  it('should store a captured image with its style and match the aspect ratio to the image', async () => {
    await saveCapturedImage(image, 'fashion_transfer');
    expect(store[STORAGE_KEYS.image]).toEqual(image);
    expect(store[STORAGE_KEYS.intent]).toBe('fashion_transfer');
    expect(store[STORAGE_KEYS.settings].aspectRatio).toBe('9:16');
  });

  it('should keep newest history first, replace duplicates and cap the length', async () => {
    const prompt = buildPrompt({ selectedImage: image, intent: 'recreate_scene', target: 'chatgpt', settings: DEFAULT_SETTINGS });
    for (let i = 0; i < HISTORY_LIMIT + 5; i++) {
      await appendHistory({ ...createHistoryItem(prompt, image), id: `p_${i}` });
    }
    await appendHistory({ ...createHistoryItem(prompt, image), id: 'p_3' });
    const history = store[STORAGE_KEYS.history];
    expect(history).toHaveLength(HISTORY_LIMIT);
    expect(history[0].id).toBe('p_3');
    expect(history.filter((h: any) => h.id === 'p_3')).toHaveLength(1);
    expect(history[0].title).toBe('Amalfi linen suit');
  });
});

describe('style lists', () => {
  it('should show every style exactly once across the main and "more" lists', () => {
    expect([...MAIN_INTENTS, ...MORE_INTENTS].sort()).toEqual(Object.keys(RULE_PACKS).sort());
    expect(RULE_PACKS.place_my_face.needsSelfie).toBe(true);
  });
});
