import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  parseSelectorConfig,
  getSelectorConfig,
  refreshRemoteSelectors,
  DEFAULT_SELECTORS,
  SELECTORS_STORAGE_KEY,
  SELECTORS_MAX_AGE_MS,
} from '../../src/modules/llm-injector/composerSelectors';

const validRemote = {
  schemaVersion: 1,
  chatgpt: { textareaSelectors: ['#new-chatgpt-box'], fileInputSelectors: ['input[type="file"]'] },
  gemini: { textareaSelectors: ['#new-gemini-box'], fileInputSelectors: [] },
};

let store: Record<string, any>;

beforeEach(() => {
  store = {};
  (globalThis as any).chrome = {
    storage: {
      local: {
        get: vi.fn(async (key: string) => (key in store ? { [key]: store[key] } : {})),
        set: vi.fn(async (items: Record<string, any>) => Object.assign(store, items)),
      },
    },
  };
  vi.restoreAllMocks();
});

describe('parseSelectorConfig', () => {
  it('should accept a valid config and the bundled defaults', () => {
    expect(parseSelectorConfig(validRemote)).toEqual(validRemote);
    expect(DEFAULT_SELECTORS.chatgpt.textareaSelectors.length).toBeGreaterThan(0);
  });

  it('should reject wrong schema versions, missing targets and bad selector lists', () => {
    expect(parseSelectorConfig({ ...validRemote, schemaVersion: 2 })).toBeNull();
    expect(parseSelectorConfig({ ...validRemote, gemini: undefined })).toBeNull();
    expect(parseSelectorConfig({ ...validRemote, chatgpt: { textareaSelectors: [], fileInputSelectors: [] } })).toBeNull();
    expect(parseSelectorConfig({ ...validRemote, chatgpt: { textareaSelectors: [42], fileInputSelectors: [] } })).toBeNull();
    expect(parseSelectorConfig('not json')).toBeNull();
  });
});

describe('remote selector refresh', () => {
  it('should cache a valid remote config and serve it', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(validRemote))));
    await refreshRemoteSelectors(1_000);
    expect(store[SELECTORS_STORAGE_KEY]).toEqual({ config: validRemote, fetchedAt: 1_000 });
    expect((await getSelectorConfig()).chatgpt.textareaSelectors).toEqual(['#new-chatgpt-box']);
  });

  it('should keep the current selectors when the remote file is invalid or unreachable', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"schemaVersion":1}')));
    await refreshRemoteSelectors(1_000);
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 404 })));
    await refreshRemoteSelectors(2_000);
    expect(store[SELECTORS_STORAGE_KEY]).toBeUndefined();
    expect(await getSelectorConfig()).toEqual(DEFAULT_SELECTORS);
  });

  it('should not refetch before the cache expires', async () => {
    store[SELECTORS_STORAGE_KEY] = { config: validRemote, fetchedAt: 1_000 };
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await refreshRemoteSelectors(1_000 + SELECTORS_MAX_AGE_MS - 1);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
