/**
 * File names given to the images attached in ChatGPT / Gemini. The prompt refers to the images by
 * these names as well as by number, so the model can't mix up which is the inspiration and which is
 * the user's face even if the upload order changes.
 */
export const INSPIRATION_FILENAME = '1-inspiration.jpg';
export const SELFIE_FILENAME = '2-my-photo.jpg';

/** Extra photos of the user's face (other angles) follow as Image 3, 4, … */
export function extraFaceFilename(index: number): string {
  return `${index + 3}-my-face.jpg`;
}
