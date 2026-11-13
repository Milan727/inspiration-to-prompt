export type IntentType = 
  | 'recreate_scene'
  | 'place_my_face'
  | 'fashion_transfer'
  | 'pro_portrait'
  | 'travel_lifestyle'
  | 'directed_edit'
  | 'apply_effect';

export type TargetLLM = 'chatgpt' | 'gemini' | 'midjourney' | 'flux';

export type AspectRatio = '4:5' | '9:16' | '1:1' | '16:9' | '3:2';

export interface SelectedImage {
  url: string;
  highResUrl: string;
  alt: string;
  title: string;
  sourceUrl: string;
  timestamp: number;
  width?: number;
  height?: number;
  aspectRatio?: string;
}

export interface ReferencePhoto {
  id: string;
  name: string;
  dataUrl: string;
  timestamp: number;
}

export interface PhotographySettings {
  aspectRatio: AspectRatio;
  cameraLens: string;
  lightingStyle: string;
  customDirective: string;
  textOverlayMode: 'none' | 'original' | 'custom';
  customOverlayText: string;
}

export interface CompiledPrompt {
  intent: IntentType;
  target: TargetLLM;
  promptText: string;
  negativePrompt?: string;
  imageUrls: string[];
  referenceSelfieDataUrl?: string;
  /** More photos of the user's face from other angles, attached after the main photo as Image 3, 4, … */
  extraFaceDataUrls?: string[];
  timestamp: number;
}

export interface PromptHistoryItem {
  id: string;
  intent: IntentType;
  target: TargetLLM;
  title: string;
  promptText: string;
  imageUrl?: string;
  timestamp: number;
  isFavorite?: boolean;
}

export type ExtensionMessageType =
  | 'SELECT_IMAGE'
  | 'GET_SELECTED_IMAGE'
  | 'INJECT_PROMPT'
  | 'INJECTION_RESULT'
  | 'COPY_TO_CLIPBOARD'
  | 'OPEN_SIDE_PANEL'
  | 'FETCH_IMAGE_BASE64'
  | 'SEND_TO_AI';

export interface ExtensionMessage {
  type: ExtensionMessageType;
  payload?: any;
}
