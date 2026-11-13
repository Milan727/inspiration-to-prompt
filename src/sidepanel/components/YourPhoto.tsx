import { useId, useState } from 'react';
import { Plus, UserRound, X } from 'lucide-react';
import { ReferencePhoto } from '../../types';
import { fileToResizedDataUrl } from '../../lib/imageResize';
import { MAX_EXTRA_FACES } from '../../lib/storage';
import { LOG_PREFIX } from '../../brand';

/** Extra angles are only used for the face, so they don't need the main photo's full size. */
const EXTRA_FACE_SIDE = 1024;

interface YourPhotoProps {
  selfie: ReferencePhoto | null;
  /** More photos of the user's face from other angles. */
  extraFaces: ReferencePhoto[];
  required: boolean;
  /** `face`: used for likeness only. `base`: the photo the AI will edit. */
  role: 'face' | 'base';
  consent: boolean;
  onConsentChange: (consent: boolean) => void;
  onPhotosChange: (selfie: ReferencePhoto | null, extraFaces: ReferencePhoto[], message?: string) => void;
  onError: (message: string) => void;
}

async function readPhotos(files: File[], maxSide?: number): Promise<ReferencePhoto[]> {
  const photos: ReferencePhoto[] = [];
  for (const [i, file] of files.entries()) {
    const now = Date.now();
    photos.push({ id: `s_${now}_${i}`, name: file.name, dataUrl: await fileToResizedDataUrl(file, maxSide), timestamp: now });
  }
  return photos;
}

const photoCount = (n: number) => (n === 1 ? 'Photo added' : `${n} photos added`);

export function YourPhoto({ selfie, extraFaces, required, role, consent, onConsentChange, onPhotosChange, onError }: YourPhotoProps) {
  const inputId = useId();
  const extraInputId = useId();
  const [askingConsent, setAskingConsent] = useState(false);

  const takeFiles = (e: React.ChangeEvent<HTMLInputElement>): File[] => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    return consent ? files : [];
  };

  const reportError = (err: unknown) => {
    console.error(`${LOG_PREFIX} Could not read reference photo:`, err);
    onError('Could not read that image. Try a JPG or PNG.');
  };

  // Picking several photos at once: the first becomes the main photo, the rest become extra angles.
  const handleMainFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const [first, ...rest] = takeFiles(e);
    if (!first) return;
    try {
      const [main] = await readPhotos([first]);
      const extras = await readPhotos(rest.slice(0, MAX_EXTRA_FACES), EXTRA_FACE_SIDE);
      onPhotosChange(main, extras, photoCount(1 + extras.length));
    } catch (err) {
      reportError(err);
    }
  };

  const handleExtraFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = takeFiles(e).slice(0, MAX_EXTRA_FACES - extraFaces.length);
    if (!files.length || !selfie) return;
    try {
      const added = await readPhotos(files, EXTRA_FACE_SIDE);
      onPhotosChange(selfie, [...extraFaces, ...added], photoCount(added.length));
    } catch (err) {
      reportError(err);
    }
  };

  // Removing the main photo promotes the first extra angle, so the other photos aren't lost.
  const removeMain = () => {
    const [next = null, ...rest] = extraFaces;
    onPhotosChange(next, next ? rest : []);
  };

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-ink-800 bg-ink-900 p-3">
      <div className="flex items-center gap-3">
        {selfie ? (
          <img src={selfie.dataUrl} alt="Your photo" className="h-11 w-11 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink-700 text-ink-300">
            <UserRound size={20} aria-hidden="true" />
          </span>
        )}
        <div className="flex min-w-0 flex-grow flex-col gap-0.5">
          <span className="text-sm font-semibold">Your photo</span>
          <span className={`text-xs ${required && !selfie ? 'text-safelight' : 'text-ink-300'}`}>
            {role === 'base'
              ? selfie
                ? 'This photo gets the effect'
                : 'Add the photo you want to edit'
              : selfie
                ? 'Stored only on this device'
                : required
                  ? 'Needed for this style'
                  : 'Optional: puts you in the result'}
          </span>
        </div>
        {selfie ? (
          <button
            type="button"
            onClick={removeMain}
            className="press focus-ring min-h-9 shrink-0 rounded-full border border-ink-600 px-3.5 text-[13px] font-medium text-ink-100"
          >
            Remove
          </button>
        ) : consent ? (
          <label
            htmlFor={inputId}
            className="press min-h-9 shrink-0 cursor-pointer rounded-full border border-ink-600 px-3.5 text-[13px] font-medium leading-9 text-ink-100 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-safelight"
          >
            Add
            <input id={inputId} type="file" accept="image/*" multiple onChange={handleMainFiles} className="sr-only" />
          </label>
        ) : (
          <button
            type="button"
            onClick={() => setAskingConsent(true)}
            className="press focus-ring min-h-9 shrink-0 rounded-full border border-ink-600 px-3.5 text-[13px] font-medium text-ink-100"
          >
            Add
          </button>
        )}
      </div>

      {(!selfie || required) && (
        <p className="m-0 text-xs leading-snug text-ink-300">
          {role === 'base'
            ? 'Your photo is kept as it is; only the effect is added. Swap it any time with Remove → Add.'
            : 'For the best likeness: face the camera, good light, eyes visible (no sunglasses), nothing covering your face. You can pick up to 4 photos at once.'}
        </p>
      )}

      {selfie && (
        <div className="flex flex-col gap-2 border-t border-ink-800 pt-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-semibold text-ink-100">More angles of your face</span>
            <span className="text-[11px] text-ink-300">
              {extraFaces.length}/{MAX_EXTRA_FACES} · optional
            </span>
          </div>
          <ul className="m-0 flex list-none gap-2 p-0">
            {extraFaces.map((face, i) => (
              <li key={face.id} className="relative">
                <img src={face.dataUrl} alt={`Extra photo ${i + 1} of you`} className="h-14 w-14 rounded-xl object-cover" />
                <button
                  type="button"
                  aria-label={`Remove extra photo ${i + 1}`}
                  onClick={() => onPhotosChange(selfie, extraFaces.filter((f) => f.id !== face.id))}
                  className="press focus-ring absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-ink-700 bg-ink-950 text-ink-100"
                >
                  <X size={12} strokeWidth={2.6} aria-hidden="true" />
                </button>
              </li>
            ))}
            {extraFaces.length < MAX_EXTRA_FACES && (
              <li>
                <label
                  htmlFor={extraInputId}
                  aria-label="Add more photos of your face"
                  className="press flex h-14 w-14 cursor-pointer items-center justify-center rounded-xl border border-dashed border-ink-600 text-ink-300 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-safelight"
                >
                  <Plus size={18} aria-hidden="true" />
                  <input id={extraInputId} type="file" accept="image/*" multiple onChange={handleExtraFiles} className="sr-only" />
                </label>
              </li>
            )}
          </ul>
          {extraFaces.length === 0 && (
            <p className="m-0 text-xs leading-snug text-ink-300">
              Add 2–3 more photos of your face from other angles (side, smiling, different light) for a closer likeness.
            </p>
          )}
        </div>
      )}

      {!selfie && !consent && askingConsent && (
        <label className="flex cursor-pointer items-start gap-2.5 rounded-xl bg-ink-850 p-3 text-xs leading-snug text-ink-100 animate-fade-in">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => onConsentChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#FFB547]"
          />
          <span>
            These are photos of <b>me</b>. I'm OK with them being stored on this device and attached to my ChatGPT / Gemini prompt.
          </span>
        </label>
      )}
    </section>
  );
}
