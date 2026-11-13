import { CompiledPrompt, IntentType, PhotographySettings, PromptHistoryItem, SelectedImage } from '../types';
import { RULE_PACKS } from '../modules/prompt-builder/rulePacks';
import { closestAspectRatio } from './aspectRatio';

/** Every chrome.storage.local key the extension uses, in one place. */
export const STORAGE_KEYS = {
  image: 'activeSelectedImage',
  intent: 'activeIntent',
  selfie: 'userReferenceSelfie',
  extraFaces: 'userExtraFaces',
  faceConsent: 'faceConsent',
  target: 'targetLLM',
  settings: 'photoSettings',
  history: 'promptHistory',
} as const;

export const DEFAULT_SETTINGS: PhotographySettings = {
  aspectRatio: '4:5',
  cameraLens: '85mm portrait',
  lightingStyle: 'natural ambient lighting',
  customDirective: '',
  // Keep the inspiration's text and graphics by default: dropping them was the biggest visible difference from the original.
  textOverlayMode: 'original',
  customOverlayText: '',
};

export const HISTORY_LIMIT = 50;

/** More photos of the user's face (other angles) on top of the main photo. Each is attached as its own image. */
export const MAX_EXTRA_FACES = 3;

export function withDefaults(settings: Partial<PhotographySettings> | undefined): PhotographySettings {
  return { ...DEFAULT_SETTINGS, ...(settings ?? {}) };
}

/** Stores a newly captured image (and optionally the style picked for it) and matches the aspect ratio to its shape. */
export async function saveCapturedImage(image: SelectedImage, intent?: IntentType): Promise<void> {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.settings);
  const settings = withDefaults(stored[STORAGE_KEYS.settings]);
  if (image.width && image.height) settings.aspectRatio = closestAspectRatio(image.width, image.height);
  await chrome.storage.local.set({
    [STORAGE_KEYS.image]: image,
    [STORAGE_KEYS.settings]: settings,
    ...(intent ? { [STORAGE_KEYS.intent]: intent } : {}),
  });
}

export function createHistoryItem(prompt: CompiledPrompt, image: SelectedImage | null): PromptHistoryItem {
  return {
    id: `p_${prompt.timestamp}`,
    intent: prompt.intent,
    target: prompt.target,
    title: image?.title || image?.alt || RULE_PACKS[prompt.intent].title,
    promptText: prompt.promptText,
    imageUrl: image?.highResUrl || image?.url,
    timestamp: prompt.timestamp,
  };
}

export async function appendHistory(item: PromptHistoryItem): Promise<PromptHistoryItem[]> {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.history);
  const current: PromptHistoryItem[] = stored[STORAGE_KEYS.history] ?? [];
  const updated = [item, ...current.filter((h) => h.id !== item.id)].slice(0, HISTORY_LIMIT);
  await chrome.storage.local.set({ [STORAGE_KEYS.history]: updated });
  return updated;
}
