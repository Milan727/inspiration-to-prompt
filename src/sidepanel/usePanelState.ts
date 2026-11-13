import { useCallback, useEffect, useState } from 'react';
import { IntentType, PhotographySettings, PromptHistoryItem, ReferencePhoto, SelectedImage, TargetLLM } from '../types';
import { RULE_PACKS } from '../modules/prompt-builder/rulePacks';
import { DEFAULT_SETTINGS, STORAGE_KEYS, withDefaults } from '../lib/storage';
import { isTarget } from '../lib/targets';
import { LOG_PREFIX } from '../brand';

export interface PanelState {
  loaded: boolean;
  image: SelectedImage | null;
  intent: IntentType;
  selfie: ReferencePhoto | null;
  extraFaces: ReferencePhoto[];
  faceConsent: boolean;
  target: TargetLLM;
  settings: PhotographySettings;
  history: PromptHistoryItem[];
}

const INITIAL: PanelState = {
  loaded: false,
  image: null,
  intent: 'place_my_face',
  selfie: null,
  extraFaces: [],
  faceConsent: false,
  target: 'chatgpt',
  settings: DEFAULT_SETTINGS,
  history: [],
};

function fromStorage(values: Record<string, any>, prev: PanelState): PanelState {
  const next = { ...prev };
  if (STORAGE_KEYS.image in values) next.image = values[STORAGE_KEYS.image] ?? null;
  if (values[STORAGE_KEYS.intent] in RULE_PACKS) next.intent = values[STORAGE_KEYS.intent];
  if (STORAGE_KEYS.selfie in values) next.selfie = values[STORAGE_KEYS.selfie] ?? null;
  if (STORAGE_KEYS.extraFaces in values) next.extraFaces = values[STORAGE_KEYS.extraFaces] ?? [];
  if (STORAGE_KEYS.faceConsent in values) next.faceConsent = Boolean(values[STORAGE_KEYS.faceConsent]);
  if (isTarget(values[STORAGE_KEYS.target])) next.target = values[STORAGE_KEYS.target];
  if (STORAGE_KEYS.settings in values) next.settings = withDefaults(values[STORAGE_KEYS.settings]);
  if (STORAGE_KEYS.history in values) next.history = values[STORAGE_KEYS.history] ?? [];
  return next;
}

/**
 * Side panel state backed by chrome.storage.local. Writes go to storage and come back through
 * storage.onChanged, so changes made elsewhere (the Pinterest menu, the context menu) show up live.
 */
export function usePanelState() {
  const [state, setState] = useState<PanelState>(INITIAL);

  useEffect(() => {
    chrome.storage.local.get(Object.values(STORAGE_KEYS)).then((values) => {
      setState((prev) => ({ ...fromStorage(values, prev), loaded: true }));
    });
    // Keys saved by the removed bring-your-own-Gemini-key feature are no longer used.
    chrome.storage.local.remove('geminiApiKey');

    const onChanged = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area !== 'local') return;
      const values: Record<string, any> = {};
      for (const [key, change] of Object.entries(changes)) values[key] = change.newValue;
      setState((prev) => fromStorage(values, prev));
    };
    chrome.storage.onChanged.addListener(onChanged);
    return () => chrome.storage.onChanged.removeListener(onChanged);
  }, []);

  const save = useCallback((values: Record<string, unknown>) => {
    chrome.storage.local.set(values).catch((err) => console.error(`${LOG_PREFIX} Could not save panel state:`, err));
  }, []);

  return {
    state,
    setIntent: (intent: IntentType) => save({ [STORAGE_KEYS.intent]: intent }),
    setTarget: (target: TargetLLM) => save({ [STORAGE_KEYS.target]: target }),
    setFaceConsent: (consent: boolean) => save({ [STORAGE_KEYS.faceConsent]: consent }),
    setSelfie: (selfie: ReferencePhoto | null) =>
      selfie ? save({ [STORAGE_KEYS.selfie]: selfie }) : chrome.storage.local.remove(STORAGE_KEYS.selfie),
    /** Saves the main photo and the extra angles together, so they never get out of step. */
    setPhotos: (selfie: ReferencePhoto | null, extraFaces: ReferencePhoto[]) =>
      selfie
        ? save({ [STORAGE_KEYS.selfie]: selfie, [STORAGE_KEYS.extraFaces]: extraFaces })
        : chrome.storage.local.remove([STORAGE_KEYS.selfie, STORAGE_KEYS.extraFaces]),
    clearImage: () => chrome.storage.local.remove(STORAGE_KEYS.image),
    updateSettings: (patch: Partial<PhotographySettings>) => {
      // Applied locally right away so text fields stay responsive, then persisted.
      const settings = { ...state.settings, ...patch };
      setState((prev) => ({ ...prev, settings }));
      save({ [STORAGE_KEYS.settings]: settings });
    },
    setHistory: (history: PromptHistoryItem[]) => save({ [STORAGE_KEYS.history]: history }),
  };
}
