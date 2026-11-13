import { SelectedImage, IntentType, TargetLLM, PhotographySettings, ReferencePhoto, CompiledPrompt } from '../../types';
import { RULE_PACKS } from './rulePacks';

export function buildPrompt(params: {
  selectedImage: SelectedImage | null;
  intent: IntentType;
  target: TargetLLM;
  settings: PhotographySettings;
  referenceSelfie?: ReferencePhoto | null;
  /** More photos of the user's face from other angles. Only used together with `referenceSelfie`. */
  extraFaces?: ReferencePhoto[] | null;
}): CompiledPrompt {
  const { selectedImage, intent, target, settings, referenceSelfie } = params;
  const extraFaces = referenceSelfie ? params.extraFaces ?? [] : [];

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
    extraFaceCount: extraFaces.length,
    target,
  });

  // Midjourney and Flux are text-only targets that never see Image 1, so they get a compact
  // description built from the page metadata plus the rule pack's style keywords.
  if (target === 'midjourney' || target === 'flux') {
    const cleanDesc = imageTitle.replace(/["']/g, '').trim();
    const directive = settings.customDirective.trim();
    const parts = [
      `Photorealistic photo: ${cleanDesc}`,
      rulePack.styleKeywords,
      `${settings.cameraLens} lens`,
      directive,
    ].filter(Boolean);

    if (target === 'midjourney') {
      // A leading image URL is used by Midjourney as an image prompt. No --v flag, so the user's default model version applies.
      const imageRef = selectedImage?.highResUrl || selectedImage?.url || '';
      const imagePrefix = /^https?:\/\//.test(imageRef) ? `${imageRef} ` : '';
      promptText = `${imagePrefix}${parts.join(', ')} --ar ${settings.aspectRatio} --style raw`;
    } else {
      promptText = `${parts.join(', ')}, sharp focus, natural skin texture, cinematic colour grading. Aspect ratio ${settings.aspectRatio}.`;
    }
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
    extraFaceDataUrls: extraFaces.map((face) => face.dataUrl),
    timestamp: Date.now(),
  };
}
