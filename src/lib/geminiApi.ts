import { PhotographySettings } from '../types';

export interface VisualFeatures {
  lightingStyle: string;
  cameraLens: string;
  suggestedDirective: string;
  description: string;
}

export async function analyzeImageWithGeminiApi(
  imageBase64OrUrl: string,
  apiKey: string
): Promise<VisualFeatures> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  let mimeType = 'image/jpeg';
  let base64Data = imageBase64OrUrl;

  if (imageBase64OrUrl.startsWith('data:')) {
    const parts = imageBase64OrUrl.split(',');
    mimeType = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    base64Data = parts[1];
  } else {
    const res = await fetch(imageBase64OrUrl);
    const blob = await res.blob();
    mimeType = blob.type || 'image/jpeg';
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    base64Data = btoa(binary);
  }

  const payload = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data,
            },
          },
          {
            text: `Analyze this inspiration photo as a master cinematographer and art director.
Extract EVERY SINGLE visual feature, prop, accessory, sticker, texture, layout, and color detail.

Output a JSON object with the following schema:
{
  "lightingStyle": "concise description of key light, shadows, contrast, and color palette",
  "cameraLens": "35mm wide | 50mm prime | 85mm portrait | 135mm portrait",
  "suggestedDirective": "Detailed list of ALL extracted elements: headwear/caps, safety pins, pin badges, floating stickers (e.g. yellow stars around face), shoulder harness straps/metal buckles, split background colors, brick/elevator textures, earphones, pose & angle",
  "description": "one sentence visual summary of scene"
}`,
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawJsonStr = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const parsed = JSON.parse(rawJsonStr);

  return {
    lightingStyle: parsed.lightingStyle || 'natural ambient lighting',
    cameraLens: parsed.cameraLens || '85mm portrait',
    suggestedDirective: parsed.suggestedDirective || '',
    description: parsed.description || '',
  };
}
