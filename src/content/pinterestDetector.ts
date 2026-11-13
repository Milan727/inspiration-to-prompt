import { getBestImageSource, extractPinterestMetadata } from '../modules/image-selection/pinterestEnhancer';
import { buildPrompt } from '../modules/prompt-builder/builder';
import { MAIN_INTENTS, RULE_PACKS } from '../modules/prompt-builder/rulePacks';
import { IntentType, PhotographySettings, ReferencePhoto, SelectedImage, TargetLLM } from '../types';
import { BRAND_NAME, LOG_PREFIX } from '../brand';
import { STORAGE_KEYS, withDefaults, appendHistory, createHistoryItem, saveCapturedImage } from '../lib/storage';
import { closestAspectRatio } from '../lib/aspectRatio';
import { TARGETS, isTarget } from '../lib/targets';

const MIN_IMAGE_SIDE = 150;

/* ── cached extension state (kept in sync so clicks can act synchronously and keep the user gesture) ── */

const state: { selfie: ReferencePhoto | null; extraFaces: ReferencePhoto[]; target: TargetLLM; settings: PhotographySettings } = {
  selfie: null,
  extraFaces: [],
  target: 'chatgpt',
  settings: withDefaults(undefined),
};

function applyStored(values: Record<string, any>) {
  if (STORAGE_KEYS.selfie in values) state.selfie = values[STORAGE_KEYS.selfie] ?? null;
  if (STORAGE_KEYS.extraFaces in values) state.extraFaces = values[STORAGE_KEYS.extraFaces] ?? [];
  if (isTarget(values[STORAGE_KEYS.target])) state.target = values[STORAGE_KEYS.target];
  if (STORAGE_KEYS.settings in values) state.settings = withDefaults(values[STORAGE_KEYS.settings]);
}

chrome.storage.local.get([STORAGE_KEYS.selfie, STORAGE_KEYS.extraFaces, STORAGE_KEYS.target, STORAGE_KEYS.settings]).then(applyStored);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  const values: Record<string, any> = {};
  for (const [key, change] of Object.entries(changes)) values[key] = change.newValue;
  applyStored(values);
});

/* ── overlay UI, isolated from Pinterest's CSS in a shadow root ── */

const host = document.createElement('div');
host.setAttribute('data-lookshot-ui', 'true');
host.style.cssText = 'position: fixed; inset: 0 auto auto 0; z-index: 2147483647; pointer-events: none;';
const root = host.attachShadow({ mode: 'open' });

root.innerHTML = `
<style>
  :host { all: initial; }
  * { box-sizing: border-box; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  .ring { position: fixed; width: 40px; height: 40px; border-radius: 20px; border: none; background: #0E0E0F; color: #EDEDEF;
    display: none; align-items: center; justify-content: center; cursor: pointer; pointer-events: auto;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3); transition: transform 120ms ease; }
  .ring:hover { transform: scale(1.06); }
  .ring:active { transform: scale(0.96); }
  .ring:focus-visible, .item:focus-visible { outline: 2px solid #FFB547; outline-offset: 2px; }
  .menu { position: fixed; width: 236px; padding: 6px; border-radius: 14px; background: #0E0E0F; color: #EDEDEF;
    box-shadow: 0 10px 30px rgba(0,0,0,0.35); display: none; flex-direction: column; pointer-events: auto; }
  .item { display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 0 10px; border-radius: 10px; border: none;
    background: transparent; color: #EDEDEF; font-size: 14px; font-weight: 500; text-align: left; cursor: pointer; }
  .item:hover { background: #1C1C20; }
  .dot { width: 8px; height: 8px; border-radius: 4px; background: #4A4A52; flex-shrink: 0; }
  .item:hover .dot { background: #FFB547; }
  .muted { color: #9A9AA2; font-size: 13px; min-height: 40px; }
  .rule { height: 1px; background: #26262A; margin: 4px 6px; }
  .toast { position: fixed; right: 20px; bottom: 20px; max-width: 320px; padding: 12px 16px; border-radius: 12px; background: #0E0E0F;
    color: #EDEDEF; font-size: 13px; line-height: 1.4; box-shadow: 0 10px 30px rgba(0,0,0,0.35); display: none; pointer-events: none; }
</style>
<button class="ring" type="button" aria-label="${BRAND_NAME}: choose a style" aria-haspopup="menu">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <circle cx="12" cy="12" r="8"></circle><circle cx="12" cy="12" r="2.5" fill="currentColor"></circle>
  </svg>
</button>
<div class="menu" role="menu"></div>
<div class="toast" role="status" aria-live="polite"></div>
`;

const ring = root.querySelector<HTMLButtonElement>('.ring')!;
const menu = root.querySelector<HTMLDivElement>('.menu')!;
const toast = root.querySelector<HTMLDivElement>('.toast')!;

function addMenuItem(label: string, onSelect: () => void, withDot: boolean, extraClass = '') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `item ${extraClass}`.trim();
  button.setAttribute('role', 'menuitem');
  if (withDot) {
    const dot = document.createElement('span');
    dot.className = 'dot';
    button.appendChild(dot);
  }
  button.appendChild(document.createTextNode(label));
  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect();
  });
  menu.appendChild(button);
}

for (const intent of MAIN_INTENTS) {
  addMenuItem(RULE_PACKS[intent].title, () => quickSend(intent), true);
}
menu.appendChild(Object.assign(document.createElement('div'), { className: 'rule' }));
addMenuItem('Open in side panel', () => openInPanel(), false, 'muted');

document.documentElement.appendChild(host);

/* ── hover tracking ── */

let hoveredImg: HTMLImageElement | null = null;
let menuOpen = false;
let frameRequested = false;

function imageUnderPointer(x: number, y: number): HTMLImageElement | null {
  for (const el of document.elementsFromPoint(x, y)) {
    if (el === host) return hoveredImg; // pointer is over our own UI: keep the current image
    if (el instanceof HTMLImageElement && el.src) {
      const rect = el.getBoundingClientRect();
      if (rect.width >= MIN_IMAGE_SIDE && rect.height >= MIN_IMAGE_SIDE) return el;
    }
  }
  return null;
}

function placeRing(img: HTMLImageElement) {
  const rect = img.getBoundingClientRect();
  ring.style.top = `${Math.max(8, rect.top + 12)}px`;
  ring.style.left = `${Math.min(window.innerWidth - 52, rect.right - 52)}px`;
  ring.style.display = 'flex';
}

function hideAll() {
  ring.style.display = 'none';
  closeMenu();
  hoveredImg = null;
}

function openMenu() {
  // Show first so the menu has a real height, then keep it inside the viewport.
  menu.style.display = 'flex';
  const ringRect = ring.getBoundingClientRect();
  menu.style.top = `${Math.max(8, Math.min(ringRect.bottom + 8, window.innerHeight - menu.offsetHeight - 12))}px`;
  menu.style.left = `${Math.max(8, ringRect.right - 236)}px`;
  ring.setAttribute('aria-expanded', 'true');
  menuOpen = true;
}

function closeMenu() {
  menu.style.display = 'none';
  ring.setAttribute('aria-expanded', 'false');
  menuOpen = false;
}

document.addEventListener(
  'mousemove',
  (e) => {
    if (menuOpen || frameRequested) return;
    frameRequested = true;
    requestAnimationFrame(() => {
      frameRequested = false;
      const img = imageUnderPointer(e.clientX, e.clientY);
      if (img) {
        hoveredImg = img;
        placeRing(img);
      } else {
        hideAll();
      }
    });
  },
  { passive: true },
);

ring.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (menuOpen) closeMenu();
  else openMenu();
});

document.addEventListener('click', (e) => {
  if (menuOpen && !e.composedPath().includes(host)) closeMenu();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menuOpen) closeMenu();
});
window.addEventListener('scroll', () => hideAll(), { passive: true });

/* ── actions ── */

let toastTimer: ReturnType<typeof setTimeout> | undefined;
function showToast(message: string) {
  toast.textContent = message;
  toast.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.style.display = 'none'), 3200);
}

function captureImage(img: HTMLImageElement): SelectedImage {
  const { url, highResUrl } = getBestImageSource(img);
  const metadata = extractPinterestMetadata(img);
  const width = img.naturalWidth || img.clientWidth || 0;
  const height = img.naturalHeight || img.clientHeight || 0;
  return {
    url,
    highResUrl,
    alt: metadata.alt,
    title: metadata.title,
    sourceUrl: metadata.sourceUrl,
    timestamp: Date.now(),
    width,
    height,
    aspectRatio: width && height ? closestAspectRatio(width, height) : undefined,
  };
}

function openInPanel(intent?: IntentType) {
  if (!hoveredImg) return;
  const image = captureImage(hoveredImg);
  closeMenu();
  // Sent synchronously from the click so the service worker may still open the side panel.
  chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL', payload: { image, intent } }, (res) => {
    if (chrome.runtime.lastError || !res?.success) showToast(`Saved. Click the ${BRAND_NAME} icon in the toolbar to continue.`);
  });
}

function quickSend(intent: IntentType) {
  if (!hoveredImg) return;

  if (RULE_PACKS[intent].needsSelfie && !state.selfie) {
    showToast('Add your photo in the side panel first');
    openInPanel(intent);
    return;
  }

  const image = captureImage(hoveredImg);
  closeMenu();
  const aspectRatio = image.width && image.height ? closestAspectRatio(image.width, image.height) : state.settings.aspectRatio;
  const settings = { ...state.settings, aspectRatio };
  const prompt = buildPrompt({ selectedImage: image, intent, target: state.target, settings, referenceSelfie: state.selfie, extraFaces: state.extraFaces });
  const target = TARGETS[state.target];

  saveCapturedImage(image, intent).catch((err) => console.error(`${LOG_PREFIX} Could not save image:`, err));

  if (target.delivery === 'copy') {
    navigator.clipboard
      .writeText(prompt.promptText)
      .then(() => {
        showToast(`${target.label} prompt copied. Paste it into ${target.label}.`);
        return appendHistory(createHistoryItem(prompt, image));
      })
      .catch((err) => {
        console.error(`${LOG_PREFIX} Could not copy prompt:`, err);
        showToast('Could not copy. Open the side panel to copy the prompt.');
      });
    return;
  }

  showToast(`Opening ${target.label}…`);
  chrome.runtime.sendMessage({ type: 'SEND_TO_AI', payload: { prompt, image } }, (res) => {
    if (chrome.runtime.lastError || !res?.success) {
      console.warn(`${LOG_PREFIX} Quick send failed:`, chrome.runtime.lastError?.message ?? res?.error);
      showToast(`Could not fill in ${target.label}. Open the side panel to copy the prompt instead.`);
    }
  });
}

console.log(`${LOG_PREFIX} Pinterest one-tap menu ready.`);
