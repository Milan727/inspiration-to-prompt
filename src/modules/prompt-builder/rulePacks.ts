import { IntentType, TargetLLM, PhotographySettings } from '../../types';

export interface RulePack {
  id: IntentType;
  title: string;
  shortDesc: string;
  iconName: string;
  systemInstruction: string;
  template: (context: {
    imageTitle: string;
    imageAlt: string;
    sourceUrl: string;
    settings: PhotographySettings;
    hasSelfie: boolean;
    target: TargetLLM;
  }) => string;
}

function buildTextOverlayInstruction(settings: PhotographySettings): string {
  if (settings.textOverlayMode === 'original') {
    return `- TEXT OVERLAY: Include and render the exact typography text overlay / quotes from Image 1 onto the photo.`;
  } else if (settings.textOverlayMode === 'custom' && settings.customOverlayText.trim()) {
    return `- TEXT OVERLAY: Render the following custom typography text overlay on the photo: "${settings.customOverlayText.trim()}".`;
  }
  return `- TEXT OVERLAY: Clean photograph without text overlay.`;
}

export const RULE_PACKS: Record<IntentType, RulePack> = {
  recreate_scene: {
    id: 'recreate_scene',
    title: 'Recreate Scene',
    shortDesc: 'Match composition, lighting, camera angle, mood & environment',
    iconName: 'Camera',
    systemInstruction: 'Analyze reference image composition, environment, camera perspective, lighting, color grade, and depth of field.',
    template: ({ imageTitle, imageAlt, settings, hasSelfie }) => {
      const titleText = imageTitle || imageAlt || 'Inspiration Photo';
      const lens = settings.cameraLens || '85mm portrait prime';
      const ratio = settings.aspectRatio || '4:5';
      const textInstruction = buildTextOverlayInstruction(settings);

      return `[PHOTOSHOOT IMAGE RECREATION & FEATURE EXTRACTION]

[SAFETY & COMPLIANCE NOTICE: Image 1 is attached strictly as an anonymous style, layout, prop, texture, clothing, and background reference. DO NOT attempt to depict or reproduce any real public figure or celebrity from Image 1. Render ONLY the private facial features of the person in Image 2.]

Attached Reference Files:
- Image 1 (First attached image): Inspiration photo (Master Reference for layout, headwear, props, accessories, stickers, lighting, textures, and environment: "${titleText}")
${hasSelfie ? '- Image 2 (Second attached image): Subject face photo (Master Reference for facial features, skin tone, jawline, and identity)' : ''}

MANDATORY VISUAL FEATURE CHECKLIST (Extract & Recreate ALL from Image 1):
1. LAYOUT & COMPOSITION: Recreate exact split-screen composition, background colors, framing, and layout from Image 1.
2. HEADWEAR & PROPS: Recreate exact headwear (hats, caps, helmets), safety pins, pin badges, patches, earphones, and eyewear/glasses from Image 1.
3. GRAPHICS, STICKERS & OVERLAYS: Recreate all floating stickers, graphic overlays (e.g. yellow stars around face, metallic stars in background), and text/typography from Image 1.
4. OUTFIT, FABRICS & HARDWARE: Recreate exact clothing (jacket/t-shirt/sweater), fabric textures (denim, knit, leather), shoulder harness straps, metal buckles, and jewelry from Image 1.
5. BACKGROUND, TEXTURES & GRAFFITI: Recreate exact background setting, materials (stainless steel, brick, stone archways), wall art, murals, and graffiti from Image 1.
6. POSE & CAMERA ANGLE: Match exact head angle, gaze direction, posture, camera height, and lens focal length (${lens}) from Image 1.
7. LIGHTING & ATMOSPHERE: Match lighting, highlight placement, shadow contrast, and color temperature from Image 1.
${hasSelfie ? `8. SUBJECT IDENTITY (Image 2): Render the main subject using the facial features, eye shape, nose, mouth, skin tone, and facial hair of the person in Image 2, seamlessly compositing Image 2's face under Image 1's headwear, lighting, and graphic star overlays.` : ''}

${textInstruction}
${settings.customDirective ? `CUSTOM DIRECTIVE: ${settings.customDirective}` : ''}

COMMAND: CREATE AND RENDER THIS EXACT PHOTOGRAPH DIRECTLY NOW. DO NOT WRITE A TEXT PROMPT; OUTPUT THE FINAL GENERATED IMAGE.`;
    },
  },

  place_my_face: {
    id: 'place_my_face',
    title: 'Place My Face',
    shortDesc: 'Swap identity/face reference into the inspiration scene',
    iconName: 'UserCheck',
    systemInstruction: 'Swap face and identity from user reference selfie into reference image composition, keeping clothing, lighting & environment.',
    template: ({ imageTitle, settings, hasSelfie }) => {
      const titleText = imageTitle || 'Inspiration Scene';
      const lens = settings.cameraLens || '85mm portrait prime';
      const ratio = settings.aspectRatio || '4:5';
      const textInstruction = buildTextOverlayInstruction(settings);

      return `[PHOTOSHOOT IMAGE RECREATION & IDENTITY SWAP]

[SAFETY & COMPLIANCE NOTICE: Image 1 is attached strictly as an anonymous style, layout, prop, texture, clothing, and background reference. DO NOT attempt to depict or reproduce any real public figure or celebrity from Image 1. Render ONLY the private facial features of the person in Image 2.]

Attached Reference Files:
- Image 1 (First attached image): Inspiration photo (Master Reference for layout, headwear, props, accessories, stickers, lighting, textures, and environment: "${titleText}")
${hasSelfie ? '- Image 2 (Second attached image): Subject face photo (Master Reference for facial features, skin tone, jawline, and identity)' : ''}

MANDATORY VISUAL FEATURE CHECKLIST (Extract & Recreate ALL from Image 1):
1. LAYOUT & COMPOSITION: Recreate exact split-screen composition, background colors, framing, and layout from Image 1.
2. HEADWEAR & PROPS: Recreate exact headwear (hats, caps, helmets), safety pins, pin badges, patches, earphones, and eyewear/glasses from Image 1.
3. GRAPHICS, STICKERS & OVERLAYS: Recreate all floating stickers, graphic overlays (e.g. yellow stars around face, metallic stars in background), and text/typography from Image 1.
4. OUTFIT, FABRICS & HARDWARE: Recreate exact clothing (jacket/t-shirt/sweater), fabric textures (denim, knit, leather), shoulder harness straps, metal buckles, and jewelry from Image 1.
5. BACKGROUND, TEXTURES & GRAFFITI: Recreate exact background setting, materials (stainless steel, brick, stone archways), wall art, murals, and graffiti from Image 1.
6. POSE & CAMERA ANGLE: Match exact head angle, gaze direction, posture, camera height, and lens focal length (${lens}) from Image 1.
7. LIGHTING & ATMOSPHERE: Match lighting, highlight placement, shadow contrast, and color temperature from Image 1.
${hasSelfie ? `8. SUBJECT IDENTITY (Image 2): Render the main subject using the facial features, eye shape, nose, mouth, skin tone, and facial hair of the person in Image 2, seamlessly compositing Image 2's face under Image 1's headwear, lighting, and graphic star overlays.` : ''}

${textInstruction}
${settings.customDirective ? `CUSTOM DIRECTIVE: ${settings.customDirective}` : ''}

COMMAND: CREATE AND RENDER THIS EXACT PHOTOGRAPH DIRECTLY NOW. DO NOT WRITE A TEXT PROMPT; OUTPUT THE FINAL GENERATED IMAGE.`;
    },
  },

  fashion_transfer: {
    id: 'fashion_transfer',
    title: 'Fashion & Outfit',
    shortDesc: 'Transfer outfit styling, fabric texture & fashion editorial vibe',
    iconName: 'Shirt',
    systemInstruction: 'Focus on outfit details, garment tailoring, fabric texture, accessories, color palette, and high-fashion editorial lighting.',
    template: ({ imageTitle, settings, hasSelfie }) => {
      const titleText = imageTitle || 'Fashion Inspiration';
      const ratio = settings.aspectRatio || '4:5';
      const textInstruction = buildTextOverlayInstruction(settings);

      return `[PHOTOSHOOT FASHION & STYLING RECREATION]

[SAFETY & COMPLIANCE NOTICE: Image 1 is attached strictly as an anonymous style, garment, texture, and prop reference.]

Attached Reference Files:
- Image 1 (First attached image): Fashion inspiration photo ("${titleText}")
${hasSelfie ? '- Image 2 (Second attached image): Subject face photo' : ''}

MANDATORY VISUAL FEATURE CHECKLIST (Extract & Recreate ALL from Image 1):
1. OUTFIT & TAILORING: Recreate exact garments, layering, cut, and fit from Image 1.
2. FABRICS & TEXTURES: Recreate denim, knit weave, leather grain, silk, and background textures from Image 1.
3. PROPS & HARDWARE: Recreate headwear, pin badges, harness straps, metal buckles, and accessories from Image 1.
4. LIGHTING & EDITORIAL VIBE: Match high-fashion lighting contrast, rim highlights, and color grading from Image 1.
${hasSelfie ? `5. SUBJECT IDENTITY (Image 2): Render this outfit and styling on the person from Image 2 using their facial features, hair, and skin tone from Image 2.` : ''}

${textInstruction}
${settings.customDirective ? `CUSTOM DIRECTIVE: ${settings.customDirective}` : ''}

COMMAND: CREATE AND RENDER THIS FASHION PHOTOGRAPH DIRECTLY NOW. DO NOT WRITE A TEXT PROMPT; OUTPUT THE FINAL GENERATED IMAGE.`;
    },
  },

  pro_portrait: {
    id: 'pro_portrait',
    title: 'Pro Portrait (LinkedIn)',
    shortDesc: 'Professional headshot with studio lighting & clean corporate backdrop',
    iconName: 'Briefcase',
    systemInstruction: 'Create professional corporate/LinkedIn headshot with 85mm lens, shallow depth of field, soft key light, crisp hair light, confident expression.',
    template: ({ imageTitle, settings, hasSelfie }) => {
      const ratio = settings.aspectRatio || '1:1';
      const textInstruction = buildTextOverlayInstruction(settings);

      return `[PHOTOSHOOT EXECUTIVE PORTRAIT RECREATION]

Attached Reference Files:
- Image 1 (First attached image): Headshot style & lighting reference ("${imageTitle || 'Professional Headshot'}")
${hasSelfie ? '- Image 2 (Second attached image): Subject face photo' : ''}

MANDATORY VISUAL FEATURE CHECKLIST:
1. LIGHTING & BACKDROP: Studio 3-point lighting setup (soft key light, subtle fill light, crisp rim light), clean blurred corporate backdrop inspired by Image 1.
${hasSelfie ? `2. SUBJECT IDENTITY (Image 2): Render the headshot using the facial features, skin tone, and hair of the person from Image 2.` : ''}
3. OPTICS & QUALITY: Shot on 85mm f/1.4 portrait lens, shallow depth of field, eye-level contact, sharp focus on eyes. Aspect ratio: ${ratio}.
${textInstruction}
${settings.customDirective ? `CUSTOM DIRECTIVE: ${settings.customDirective}` : ''}

COMMAND: CREATE AND RENDER THIS PROFESSIONAL HEADSHOT DIRECTLY NOW. DO NOT WRITE A TEXT PROMPT; OUTPUT THE FINAL GENERATED IMAGE.`;
    },
  },

  travel_lifestyle: {
    id: 'travel_lifestyle',
    title: 'Travel & Lifestyle',
    shortDesc: 'Golden hour ambient light, wide environmental framing & candid vibe',
    iconName: 'Compass',
    systemInstruction: 'Capture authentic travel lifestyle moment with wide-angle 35mm lens, natural sun flare, candid emotion, filmic Kodak Portra color grade.',
    template: ({ imageTitle, settings, hasSelfie }) => {
      const ratio = settings.aspectRatio || '9:16';
      const textInstruction = buildTextOverlayInstruction(settings);

      return `[PHOTOSHOOT TRAVEL & LIFESTYLE RECREATION]

Attached Reference Files:
- Image 1 (First attached image): Travel destination reference ("${imageTitle || 'Travel Scene'}")
${hasSelfie ? '- Image 2 (Second attached image): Subject face photo' : ''}

MANDATORY VISUAL FEATURE CHECKLIST:
1. ENVIRONMENT, TEXTURE & GRAFFITI: Scenic destination background, street art, graffiti murals, golden hour sunlight, subtle sun flare, and filmic color grade from Image 1.
${hasSelfie ? `2. SUBJECT PLACEMENT: Render the person from Image 2 in this travel scene.` : ''}
3. OPTICS & QUALITY: Shot on Leica 35mm wide lens, environmental framing, natural grain. Aspect ratio: ${ratio}.
${textInstruction}
${settings.customDirective ? `CUSTOM DIRECTIVE: ${settings.customDirective}` : ''}

COMMAND: CREATE AND RENDER THIS TRAVEL PHOTOGRAPH DIRECTLY NOW. DO NOT WRITE A TEXT PROMPT; OUTPUT THE FINAL GENERATED IMAGE.`;
    },
  },

  directed_edit: {
    id: 'directed_edit',
    title: 'Directed Edit',
    shortDesc: 'Custom free-text instructions combined with visual style analysis',
    iconName: 'Edit3',
    systemInstruction: 'Merge explicit user custom edit instructions with the photographic style, lighting, camera angle, and mood of the inspiration image.',
    template: ({ imageTitle, settings, hasSelfie }) => {
      const directive = settings.customDirective || 'Modify the subject and atmosphere while preserving the reference lighting and framing.';
      const ratio = settings.aspectRatio || '4:5';
      const textInstruction = buildTextOverlayInstruction(settings);

      return `[PHOTOSHOOT DIRECTED EDIT RECREATION]

Attached Reference Files:
- Image 1 (First attached image): Master Reference photo ("${imageTitle || 'Reference Photo'}")
${hasSelfie ? '- Image 2 (Second attached image): Subject face photo' : ''}

MANDATORY VISUAL FEATURE CHECKLIST:
1. CUSTOM INSTRUCTIONS: ${directive}
2. STYLE & TEXTURES: Match camera perspective, lighting contrast, textures, props, stickers, graffiti/wall art, and mood from Image 1.
${hasSelfie ? '3. SUBJECT IDENTITY: Use the facial features and identity of the person from Image 2.' : ''}
4. OPTICS & QUALITY: Aspect ratio: ${ratio}, Lens: ${settings.cameraLens || '85mm portrait'}.
${textInstruction}

COMMAND: CREATE AND RENDER THIS PHOTOGRAPH DIRECTLY NOW. DO NOT WRITE A TEXT PROMPT; OUTPUT THE FINAL GENERATED IMAGE.`;
    },
  },
};
