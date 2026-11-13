import { TargetLLM } from '../types';

export interface TargetInfo {
  id: TargetLLM;
  label: string;
  /** `inject` targets get the prompt typed into their web app; `copy` targets get it on the clipboard. */
  delivery: 'inject' | 'copy';
  appUrl: string;
  tabPattern?: string;
}

export const TARGETS: Record<TargetLLM, TargetInfo> = {
  chatgpt: { id: 'chatgpt', label: 'ChatGPT', delivery: 'inject', appUrl: 'https://chatgpt.com/', tabPattern: '*://chatgpt.com/*' },
  gemini: { id: 'gemini', label: 'Gemini', delivery: 'inject', appUrl: 'https://gemini.google.com/app', tabPattern: '*://gemini.google.com/*' },
  midjourney: { id: 'midjourney', label: 'Midjourney', delivery: 'copy', appUrl: 'https://www.midjourney.com/imagine' },
  flux: { id: 'flux', label: 'Flux', delivery: 'copy', appUrl: '' },
};

export const TARGET_ORDER: TargetLLM[] = ['chatgpt', 'gemini', 'midjourney', 'flux'];

export function isTarget(value: unknown): value is TargetLLM {
  return typeof value === 'string' && value in TARGETS;
}
