import { SelectedImage, IntentType, TargetLLM, PhotographySettings, ReferencePhoto, CompiledPrompt } from '../../types';
import { RULE_PACKS } from './rulePacks';

export function buildPrompt(params: {
  selectedImage: SelectedImage | null;
  intent: IntentType;
  target: TargetLLM;
  settings: PhotographySettings;
  referenceSelfie?: ReferencePhoto | null;
}): CompiledPrompt {
  const { selectedImage, intent, target, settings, referenceSelfie } = params;

  const rulePack = RULE_PACKS[intent] || RULE_PACKS.recreate_scene;

  const imageTitle = selectedImage?.title || selectedImage?.alt || 'Inspiration Photo';
  const imageAlt = selectedImage?.alt || '';
  const sourceUrl = selectedImage?.sourceUrl || '';

  let promptText = rulePack.template({
    imageTitle,
    imageAlt,
    sourceUrl,
    settings,
    hasSelfie: !!referenceSelfie,
    target,
  });

  // Target-specific formatting
  if (target === 'midjourney') {
    const cleanDesc = imageTitle.replace(/["']/g, '');
    const selfieNote = referenceSelfie ? ' featuring the subject identity and facial features from attached Image 2' : '';
    const ratio = settings.aspectRatio.replace(':', ':');
    promptText = `/imagine prompt: High-end photorealistic 8k photoshoot of ${cleanDesc}${selfieNote}, shot on ${settings.cameraLens}, ${settings.lightingStyle}, split-screen aesthetic composition, metallic and graphic star overlays, exact fabric textures and background materials --ar ${ratio} --v 6.0 --style raw --quality 2`;
  } else if (target === 'flux') {
    const cleanDesc = imageTitle.replace(/["']/g, '');
    promptText = `Flux.1 Schnell / Dev Masterpiece: Photorealistic photoshoot recreation of "${cleanDesc}", 8k resolution, raw photography, shot on ${settings.cameraLens}, f/1.8 aperture, ${settings.lightingStyle}, shallow depth of field, sharp focus, natural skin pores, cinematic color grading, exact background environment and props. Aspect ratio ${settings.aspectRatio}.`;
  }

  const negativePrompt = 'blur, low resolution, distorted faces, extra fingers, oversaturated, plastic skin, CGI render, watermarks, signature, bad anatomy';

  const imageUrls: string[] = [];
  if (selectedImage?.highResUrl) {
    imageUrls.push(selectedImage.highResUrl);
  } else if (selectedImage?.url) {
    imageUrls.push(selectedImage.url);
  }

  return {
    intent,
    target,
    promptText,
    negativePrompt,
    imageUrls,
    referenceSelfieDataUrl: referenceSelfie?.dataUrl,
    timestamp: Date.now(),
  };
}
