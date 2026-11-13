import { IntentType, TargetLLM, PhotographySettings } from '../../types';
import { INSPIRATION_FILENAME, SELFIE_FILENAME, extraFaceFilename } from './attachments';

export interface TemplateContext {
  imageTitle: string;
  imageAlt: string;
  sourceUrl: string;
  settings: PhotographySettings;
  hasSelfie: boolean;
  /** How many more photos of the user's face are attached after Image 2 (as Image 3, 4, …). */
  extraFaceCount?: number;
  target: TargetLLM;
}

export interface RulePack {
  id: IntentType;
  title: string;
  shortDesc: string;
  iconName: string;
  systemInstruction: string;
  /** Short style phrase used by text-only targets (Midjourney, Flux) that cannot see the reference image. */
  styleKeywords: string;
  /** True when the style only makes sense with the user's own photo attached. */
  needsSelfie?: boolean;
  template: (context: TemplateContext) => string;
}

function buildTextOverlayInstruction(settings: PhotographySettings): string {
  if (settings.textOverlayMode === 'original') {
    return 'Text and graphics: keep every word of text, typography, sticker, shape and graphic overlay from Image 1 exactly as it is, in the same place, size and style.';
  } else if (settings.textOverlayMode === 'custom' && settings.customOverlayText.trim()) {
    return `Text: replace any text from Image 1 with this text, in a similar style: "${settings.customOverlayText.trim()}". Keep the other graphic elements.`;
  }
  return 'Text: remove all words, captions, logos and watermarks. Keep any non-text graphic elements from Image 1.';
}

/**
 * How the user's own photo may be used. The model must take only facial identity from it: copying its
 * accessories, expression or lighting is the most common way results drift (e.g. sunglasses carried over).
 */
/** `face`: Image 2 only supplies the user's identity. `base`: Image 2 is the photo being edited. */
type SelfieRole = 'face' | 'base';

/** "Image 3", or "Images 3–5". */
function imageRange(from: number, to: number): string {
  return from === to ? `Image ${from}` : `Images ${from}–${to}`;
}

/** The attachments that show the user's face: Image 2, plus any extra angles. */
function myFaceImages(context: TemplateContext): string {
  return imageRange(2, 2 + (context.extraFaceCount ?? 0));
}

function buildIdentityRule(hasSelfie: boolean, selfieRole: SelfieRole, extraFaceCount: number): string {
  const extras = hasSelfie ? extraFaceCount : 0;
  if (hasSelfie && selfieRole === 'base') {
    const extraNote = extras ? ` ${imageRange(3, 2 + extras)}: more photos of me, used only to keep my face accurate.` : '';
    return `Identity: keep me exactly as I am in Image 2: same face, expression, pose, body, clothes and accessories. Do not reproduce the person from Image 1. Image 2 is a photo of myself, shared with my consent.${extraNote}`;
  }
  if (!hasSelfie) {
    return 'Identity: do not reproduce the face or identity of anyone shown in Image 1; if it shows a person, depict a different, fictional person with the same expression, pose and styling.';
  }
  // Several angles of the same face give the model a far better likeness than a single selfie.
  const faces = imageRange(2, 2 + extras);
  const source = extras ? `${faces} (all photos of me from different angles; combine them for the most accurate likeness)` : `Image 2 (${SELFIE_FILENAME})`;
  const them = extras ? 'these photos' : 'Image 2';
  return `Identity: the person in the final image is me. Take ONLY my identity from ${source}: face shape, eyes, nose, mouth, skin tone, facial hair and hair. Do NOT copy anything else from ${them}: not ${extras ? 'their' : 'its'} glasses or sunglasses, jewellery, clothing, background, lighting, expression or head angle. Glasses: wear the same glasses as the person in Image 1, or none if they have none; never the glasses from ${extras ? 'my photos' : 'Image 2'}. Do not reproduce the face of the person in Image 1. ${extras ? `${faces} are photos of myself` : 'Image 2 is a photo of myself'}, shared with my consent.`;
}

/** Expression and pose always come from the inspiration photo, never from the user's selfie. */
const EXPRESSION_FROM_IMAGE_1 =
  'Expression and pose: exactly the facial expression of the person in Image 1 (eyes, eyebrows, mouth, teeth, tongue), with the same head angle, gaze direction and posture.';

/**
 * Assembles the shared prompt structure used by every rule pack for ChatGPT / Gemini.
 * Checklist entries that are `false` or empty are dropped and the rest are numbered in order.
 */
function composePrompt(params: {
  heading: string;
  /** One-line instruction stated before the checklist, e.g. framing the task as an edit of Image 1. */
  lead: string;
  imageLabel: string;
  context: TemplateContext;
  checklist: (string | false)[];
  defaultRatio: string;
  defaultLens: string;
  selfieRole?: SelfieRole;
}): string {
  const { heading, lead, imageLabel, context, checklist, defaultRatio, defaultLens, selfieRole = 'face' } = params;
  const { settings, hasSelfie } = context;
  const extraFaceCount = hasSelfie ? context.extraFaceCount ?? 0 : 0;
  const editsMyPhoto = hasSelfie && selfieRole === 'base';

  const references = [
    `- Image 1 (${INSPIRATION_FILENAME}): ${imageLabel}`,
    hasSelfie &&
      `- Image 2 (${SELFIE_FILENAME}): ${editsMyPhoto ? 'my own photo, the base image to edit' : 'a photo of me, used only for my face'}`,
    ...Array.from(
      { length: extraFaceCount },
      (_, i) => `- Image ${i + 3} (${extraFaceFilename(i)}): another photo of me from a different angle, used only for my face`,
    ),
  ].filter(Boolean);

  const items = checklist.filter((item): item is string => Boolean(item && item.trim()));
  const numbered = items.map((item, i) => `${i + 1}. ${item}`);

  const output = editsMyPhoto
    ? [
        'Aspect ratio: the same as Image 2. Do not crop, zoom or reframe my photo.',
        buildTextOverlayInstruction(settings),
        buildIdentityRule(hasSelfie, selfieRole, extraFaceCount),
      ]
    : [
        `Aspect ratio: ${settings.aspectRatio || defaultRatio}.`,
        `Camera: ${settings.cameraLens || defaultLens} lens.`,
        buildTextOverlayInstruction(settings),
        buildIdentityRule(hasSelfie, selfieRole, extraFaceCount),
      ];

  const sections = [
    `[${heading}]`,
    `Attached images:\n${references.join('\n')}`,
    lead,
    `Checklist:\n${numbered.join('\n')}`,
    settings.customDirective.trim() && `Extra direction: ${settings.customDirective.trim()}`,
    `Output:\n${output.map((line) => `- ${line}`).join('\n')}`,
    'Generate the image now. Reply with the finished image, not a written prompt.',
  ].filter(Boolean);

  return sections.join('\n\n');
}

/** The styles shown up front for casual creators; the rest live under "More styles". */
export const MAIN_INTENTS: IntentType[] = ['place_my_face', 'apply_effect', 'recreate_scene', 'fashion_transfer'];
export const MORE_INTENTS: IntentType[] = ['pro_portrait', 'travel_lifestyle', 'directed_edit'];

export const RULE_PACKS: Record<IntentType, RulePack> = {
  apply_effect: {
    id: 'apply_effect',
    title: 'Add this effect to my photo',
    shortDesc: 'Its doodles, text and colour, on your own photo',
    needsSelfie: true,
    iconName: 'Sparkles',
    systemInstruction: "Apply the graphic overlays and photo treatment of the reference image to the user's own photo without changing the photo itself.",
    styleKeywords: 'photo with hand-drawn doodle and sticker overlays, editorial colour treatment',
    template: (context) =>
      composePrompt({
        heading: 'ADD THIS EFFECT TO MY PHOTO',
        lead: context.hasSelfie
          ? 'Edit Image 2 (my photo): add the effects and graphics from Image 1 on top of it. Keep my photo itself unchanged. Image 1 is only a reference for the effect.'
          : 'Add the effects and graphics from Image 1 to my photo (attach your own photo as Image 2).',
        imageLabel: `effect reference ("${context.imageTitle || 'Inspiration Photo'}"): copy only its graphics and photo treatment`,
        context,
        defaultRatio: '4:5',
        defaultLens: '35mm wide',
        selfieRole: 'base',
        checklist: [
          'Keep unchanged from Image 2: me (face, expression, pose and body), my clothes, the background, the framing and the composition.',
          'Add from Image 1: every hand-drawn doodle, sticker, shape, scribble and graphic overlay, in the same drawing style, colours, line thickness and amount, placed around me in the same way they are placed around the person in Image 1 (behind, beside and partly overlapping).',
          'Photo treatment from Image 1: the same colour grading, contrast, grain, flash or film look, and any border or frame.',
          'Do not copy the person, clothes, pose or background from Image 1.',
        ],
      }),
  },

  recreate_scene: {
    id: 'recreate_scene',
    title: 'Recreate this look',
    shortDesc: 'Same scene, light and mood',
    iconName: 'Camera',
    systemInstruction: 'Analyze reference image composition, environment, camera perspective, lighting, color grade, and depth of field.',
    styleKeywords: 'editorial photograph, faithful composition, natural colour grading',
    template: (context) =>
      composePrompt({
        heading: 'PHOTO RECREATION',
        lead: context.hasSelfie
          ? 'Recreate Image 1 as a new photo with me as the person in it. Match Image 1 as closely as possible in everything except who the person is.'
          : 'Recreate Image 1 as a new photo. Match it as closely as possible.',
        imageLabel: `inspiration photo ("${context.imageTitle || context.imageAlt || 'Inspiration Photo'}"): the reference for everything except the face`,
        context,
        defaultRatio: '4:5',
        defaultLens: '85mm portrait prime',
        checklist: [
          'Composition: the same framing, layout, subject placement and background.',
          'Styling: the same clothing, accessories and props.',
          'Setting: the same location, surfaces, materials and textures.',
          EXPRESSION_FROM_IMAGE_1,
          'Light and colour: the same light direction, contrast, colour temperature, colour grading, grain and wear.',
          'Mood: the same overall feeling and atmosphere.',
        ],
      }),
  },

  place_my_face: {
    id: 'place_my_face',
    title: 'Put me in this photo',
    shortDesc: 'You, in this exact shot',
    needsSelfie: true,
    iconName: 'UserCheck',
    systemInstruction: 'Place the user from their own reference photo into the reference image composition, keeping clothing, lighting & environment.',
    styleKeywords: 'portrait photograph, natural skin texture, true-to-life likeness',
    template: (context) =>
      composePrompt({
        heading: 'PUT ME IN THIS PHOTO',
        lead: context.hasSelfie
          ? `Edit Image 1: replace the person in it with me (${myFaceImages(context)}). Keep everything else in Image 1 exactly as it is. This is an edit of Image 1, not a new photo.`
          : 'Edit Image 1: replace the person in it with a different, fictional person. Keep everything else exactly as it is.',
        imageLabel: `inspiration photo ("${context.imageTitle || 'Inspiration Scene'}"): the base image to edit`,
        context,
        defaultRatio: '4:5',
        defaultLens: '85mm portrait prime',
        checklist: [
          'Keep unchanged from Image 1: framing, crop, background, clothing, props, every text and graphic element, lighting, colours, grain, scratches and wear.',
          EXPRESSION_FROM_IMAGE_1,
          context.hasSelfie
            ? `Face: mine, from ${myFaceImages(context)}, clearly recognisable, lit by the light of Image 1 and blended naturally at the hairline, jaw and neck.`
            : 'Face: a fictional person, blended naturally into the scene.',
        ],
      }),
  },

  fashion_transfer: {
    id: 'fashion_transfer',
    title: 'Try this outfit',
    shortDesc: 'The clothes and styling, on you',
    iconName: 'Shirt',
    systemInstruction: 'Focus on outfit details, garment tailoring, fabric texture, accessories, color palette, and high-fashion editorial lighting.',
    styleKeywords: 'fashion editorial photograph, detailed fabric texture, styled outfit',
    template: (context) =>
      composePrompt({
        heading: 'OUTFIT & STYLING',
        lead: context.hasSelfie
          ? 'Create a new photo of me wearing the outfit and styling from Image 1.'
          : 'Create a new fashion photo of the outfit and styling in Image 1.',
        imageLabel: `fashion inspiration photo ("${context.imageTitle || 'Fashion Inspiration'}") — the reference for the outfit and styling`,
        context,
        defaultRatio: '4:5',
        defaultLens: '85mm portrait prime',
        checklist: [
          'Outfit: the same garments, layering, cut and fit.',
          'Fabrics: the same materials, textures and colours.',
          'Accessories: the same shoes, bags, jewellery, headwear and other accessories.',
          'Styling: a similar hair, make-up and overall look.',
          'Light: editorial lighting and colour grading in the spirit of Image 1.',
          context.hasSelfie && `Subject: me, from ${myFaceImages(context)}, wearing this outfit — keep my face, skin tone and hair recognisable.`,
        ],
      }),
  },

  pro_portrait: {
    id: 'pro_portrait',
    title: 'Pro headshot',
    shortDesc: 'Studio light, clean backdrop, LinkedIn-ready',
    iconName: 'Briefcase',
    systemInstruction: 'Create professional corporate/LinkedIn headshot with 85mm lens, shallow depth of field, soft key light, crisp hair light, confident expression.',
    styleKeywords: 'professional studio headshot, soft key light, clean softly blurred backdrop, shallow depth of field',
    template: (context) =>
      composePrompt({
        heading: 'PROFESSIONAL HEADSHOT',
        lead: context.hasSelfie
          ? 'Create a professional headshot of me in the style of Image 1.'
          : 'Create a professional headshot in the style of Image 1.',
        imageLabel: `headshot style reference ("${context.imageTitle || 'Professional Headshot'}") — the reference for lighting, backdrop and framing`,
        context,
        defaultRatio: '1:1',
        defaultLens: '85mm f/1.4 portrait',
        checklist: [
          'Lighting: soft studio lighting (key, fill and rim light) in the style of Image 1.',
          'Backdrop: a clean, softly blurred backdrop in colours that match Image 1.',
          'Framing: head and shoulders, eye-level camera, sharp focus on the eyes, shallow depth of field.',
          'Expression: confident, approachable and natural.',
          context.hasSelfie && `Subject: me, from ${myFaceImages(context)} — keep my face, skin tone and hair recognisable.`,
        ],
      }),
  },

  travel_lifestyle: {
    id: 'travel_lifestyle',
    title: 'Travel shot',
    shortDesc: 'Wide, candid and full of the place',
    iconName: 'Compass',
    systemInstruction: 'Capture authentic travel lifestyle moment with wide-angle 35mm lens, natural light, candid emotion, filmic color grade.',
    styleKeywords: 'candid travel lifestyle photograph, natural light, wide environmental framing, filmic colour',
    template: (context) =>
      composePrompt({
        heading: 'TRAVEL & LIFESTYLE PHOTO',
        lead: context.hasSelfie
          ? 'Create a new travel photo of me in the place shown in Image 1.'
          : 'Create a new travel photo in the place shown in Image 1.',
        imageLabel: `travel inspiration photo ("${context.imageTitle || 'Travel Scene'}") — the reference for the place, light and atmosphere`,
        context,
        defaultRatio: '9:16',
        defaultLens: '35mm wide',
        checklist: [
          'Place: the same destination, landmarks and surroundings.',
          'Light: the same time of day, natural light and weather.',
          'Framing: wide environmental framing with the person part of the scene.',
          'Feel: candid and natural, with a filmic colour grade in the spirit of Image 1.',
          context.hasSelfie && `Subject: me, from ${myFaceImages(context)} — keep my face, skin tone and hair recognisable.`,
        ],
      }),
  },

  directed_edit: {
    id: 'directed_edit',
    title: 'Your own edit',
    shortDesc: 'Describe the change, keep the style',
    iconName: 'Edit3',
    systemInstruction: 'Merge explicit user custom edit instructions with the photographic style, lighting, camera angle, and mood of the inspiration image.',
    styleKeywords: 'photograph',
    template: (context) =>
      composePrompt({
        heading: 'DIRECTED EDIT',
        lead: 'Edit Image 1 following my instructions below. Keep everything I do not mention as it is.',
        imageLabel: `reference photo ("${context.imageTitle || 'Reference Photo'}")`,
        context: {
          ...context,
          // The directive is the main instruction here, so it moves into the checklist instead of "Extra direction".
          settings: { ...context.settings, customDirective: '' },
        },
        defaultRatio: '4:5',
        defaultLens: '85mm portrait',
        checklist: [
          `My instructions: ${context.settings.customDirective.trim() || 'change the subject and atmosphere while keeping the lighting and framing.'}`,
          'Style: keep the camera angle, lighting, colour grading, textures and mood of Image 1.',
          context.hasSelfie && `Subject: me, from ${myFaceImages(context)} — keep my face, skin tone and hair recognisable.`,
        ],
      }),
  },
};
