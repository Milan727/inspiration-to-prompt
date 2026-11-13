import { LOG_PREFIX } from '../../brand';
import bundledSelectors from '../../../config/selectors.json';

export type ComposerTarget = 'chatgpt' | 'gemini';

export interface LLMSelectorConfig {
  textareaSelectors: string[];
  fileInputSelectors: string[];
}

export interface SelectorConfig {
  schemaVersion: number;
  chatgpt: LLMSelectorConfig;
  gemini: LLMSelectorConfig;
}

/** Schema version this build understands. Remote files with a different version are ignored. */
export const SELECTOR_SCHEMA_VERSION = 1;

/**
 * Remote copy of config/selectors.json. Editing that file on the main branch fixes ChatGPT / Gemini
 * page changes for every user without a Chrome Web Store release (it is data, not code).
 */
export const REMOTE_SELECTORS_URL =
  'https://raw.githubusercontent.com/Milan727/inspiration-to-prompt/main/config/selectors.json';

export const SELECTORS_STORAGE_KEY = 'remoteSelectors';
export const SELECTORS_MAX_AGE_MS = 6 * 60 * 60 * 1000;

function isSelectorList(value: unknown, allowEmpty: boolean): value is string[] {
  return (
    Array.isArray(value) &&
    (allowEmpty || value.length > 0) &&
    value.length <= 20 &&
    value.every((s) => typeof s === 'string' && s.length > 0 && s.length <= 200)
  );
}

function parseTargetConfig(value: unknown): LLMSelectorConfig | null {
  if (!value || typeof value !== 'object') return null;
  const { textareaSelectors, fileInputSelectors } = value as Record<string, unknown>;
  if (!isSelectorList(textareaSelectors, false) || !isSelectorList(fileInputSelectors, true)) return null;
  return { textareaSelectors, fileInputSelectors };
}

/** Validates an untrusted selector config (e.g. fetched from GitHub). Returns null if anything is off. */
export function parseSelectorConfig(value: unknown): SelectorConfig | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  if (raw.schemaVersion !== SELECTOR_SCHEMA_VERSION) return null;
  const chatgpt = parseTargetConfig(raw.chatgpt);
  const gemini = parseTargetConfig(raw.gemini);
  if (!chatgpt || !gemini) return null;
  return { schemaVersion: SELECTOR_SCHEMA_VERSION, chatgpt, gemini };
}

const parsedBundled = parseSelectorConfig(bundledSelectors);
if (!parsedBundled) throw new Error('config/selectors.json is invalid');
export const DEFAULT_SELECTORS: SelectorConfig = parsedBundled;

/** Latest cached remote selectors, falling back to the copy bundled with this build. */
export async function getSelectorConfig(): Promise<SelectorConfig> {
  try {
    const data = await chrome.storage.local.get(SELECTORS_STORAGE_KEY);
    return parseSelectorConfig(data[SELECTORS_STORAGE_KEY]?.config) ?? DEFAULT_SELECTORS;
  } catch (err) {
    console.warn(`${LOG_PREFIX} Could not read cached selectors, using bundled defaults:`, err);
    return DEFAULT_SELECTORS;
  }
}

/**
 * Fetches the remote selector file when the cached copy is older than SELECTORS_MAX_AGE_MS.
 * Invalid or unreachable remote data leaves the existing cache untouched.
 */
export async function refreshRemoteSelectors(now = Date.now()): Promise<void> {
  const data = await chrome.storage.local.get(SELECTORS_STORAGE_KEY);
  const fetchedAt: number | undefined = data[SELECTORS_STORAGE_KEY]?.fetchedAt;
  if (fetchedAt !== undefined && now - fetchedAt < SELECTORS_MAX_AGE_MS) return;

  try {
    const res = await fetch(REMOTE_SELECTORS_URL, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const config = parseSelectorConfig(await res.json());
    if (!config) throw new Error('Remote selector config failed validation');
    await chrome.storage.local.set({ [SELECTORS_STORAGE_KEY]: { config, fetchedAt: now } });
  } catch (err) {
    console.warn(`${LOG_PREFIX} Remote selector refresh failed, keeping current selectors:`, err);
  }
}

/**
 * Utility to find the first matching element from a selector list
 */
export function findElementBySelectors(selectors: string[], parent: Document | Element = document): HTMLElement | null {
  for (const selector of selectors) {
    try {
      const el = parent.querySelector(selector);
      if (el && el instanceof HTMLElement) {
        return el;
      }
    } catch (e) {
      // Ignore invalid selector errors during fallback search
    }
  }
  return null;
}
