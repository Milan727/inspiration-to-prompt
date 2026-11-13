import { CompiledPrompt, ExtensionMessage, IntentType, SelectedImage } from '../types';
import { BRAND_NAME, LOG_PREFIX } from '../brand';
import { getSelectorConfig, refreshRemoteSelectors } from '../modules/llm-injector/composerSelectors';
import { appendHistory, createHistoryItem, saveCapturedImage } from '../lib/storage';
import { fetchImageAsDataUrl } from '../lib/dataUrl';
import { TARGETS } from '../lib/targets';

// Pick up ChatGPT / Gemini selector fixes published to config/selectors.json (throttled to every 6h).
refreshRemoteSelectors();

// Configure Side Panel behavior on action icon click
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((err) => console.error(`${LOG_PREFIX} Failed to set side panel behavior:`, err));

const CONTEXT_MENU_ID = 'send_to_lookshot';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: `Send image to ${BRAND_NAME}`,
    contexts: ['image'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !info.srcUrl) return;

  // sidePanel.open must run before any await so it still counts as part of the user's click.
  if (tab?.windowId !== undefined) {
    chrome.sidePanel.open({ windowId: tab.windowId }).catch((err) => console.warn(`${LOG_PREFIX} Could not open side panel:`, err));
  }

  const selectedImage: SelectedImage = {
    url: info.srcUrl,
    highResUrl: info.srcUrl,
    alt: tab?.title || 'Selected Image',
    title: tab?.title || 'Web Image',
    sourceUrl: info.pageUrl || tab?.url || '',
    timestamp: Date.now(),
  };
  saveCapturedImage(selectedImage).catch((err) => console.error(`${LOG_PREFIX} Could not save captured image:`, err));
});

// Runs inside the page via chrome.scripting, so it must be self-contained; selectors are passed in.
function injectPromptDirectlyToDOM(promptText: string, chatgptSelectors: string[], geminiSelectors: string[]) {
  const isChatGPT = window.location.hostname.includes('chatgpt.com');
  const selectors = isChatGPT ? chatgptSelectors : geminiSelectors;

  let composer: HTMLElement | null = null;
  for (const s of selectors) {
    const el = document.querySelector(s);
    if (el && el instanceof HTMLElement) {
      composer = el;
      break;
    }
  }

  if (!composer) return { success: false, error: 'Composer input field not found on page' };

  composer.focus();

  if (composer instanceof HTMLTextAreaElement || composer instanceof HTMLInputElement) {
    composer.value = promptText;
    composer.dispatchEvent(new Event('input', { bubbles: true }));
    composer.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(composer);
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
    const success = document.execCommand('insertText', false, promptText);
    if (!success || !composer.innerText.trim()) {
      const p = composer.querySelector('p') || composer;
      p.textContent = promptText;
      composer.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: promptText }));
    }
  }

  return { success: true };
}

interface SendResult {
  success: boolean;
  error?: string;
  fallbackTriggered?: boolean;
}

function waitForTabComplete(tabId: number, timeoutMs = 15000): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(done, timeoutMs);
    function listener(id: number, change: chrome.tabs.TabChangeInfo) {
      if (id === tabId && change.status === 'complete') done();
    }
    function done() {
      clearTimeout(timer);
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    }
    chrome.tabs.onUpdated.addListener(listener);
    chrome.tabs.get(tabId).then((tab) => tab.status === 'complete' && done(), done);
  });
}

function messageContentScript(tabId: number, prompt: CompiledPrompt): Promise<SendResult | null> {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { type: 'INJECT_PROMPT', payload: { prompt } }, (response?: SendResult) => {
      resolve(chrome.runtime.lastError ? null : response ?? null);
    });
  });
}

/**
 * Injects the ChatGPT / Gemini content script into a tab that doesn't have it. Chrome only adds
 * manifest content scripts to pages loaded after the extension (re)loads, so a ChatGPT tab that was
 * already open would otherwise silently fall back to text-only injection with no images.
 */
async function ensureInjectorScript(tabId: number): Promise<void> {
  const entry = chrome.runtime.getManifest().content_scripts?.find((cs) => cs.matches?.some((m) => m.includes('chatgpt.com')));
  if (!entry?.js?.length) return;
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: entry.js });
  } catch (err) {
    console.warn(`${LOG_PREFIX} Could not inject the content script:`, err);
  }
}

async function injectIntoTab(tabId: number, prompt: CompiledPrompt): Promise<SendResult> {
  // A freshly opened tab may not have its content script listening yet, so retry briefly; if it still
  // doesn't answer, inject the script ourselves (covers tabs opened before the extension was reloaded).
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await messageContentScript(tabId, prompt);
    if (response?.success) return response;
    if (response) break; // the content script answered but failed: fall through to the text-only fallback
    if (attempt === 1) await ensureInjectorScript(tabId);
    await new Promise((r) => setTimeout(r, 700));
  }

  console.log(`${LOG_PREFIX} Content script injection failed, running inline DOM scripting...`);
  const selectors = await getSelectorConfig();
  const [res] = await chrome.scripting.executeScript({
    target: { tabId },
    func: injectPromptDirectlyToDOM,
    args: [prompt.promptText, selectors.chatgpt.textareaSelectors, selectors.gemini.textareaSelectors],
  });
  const result = (res?.result as SendResult | undefined) ?? { success: false, error: 'Injection script returned nothing' };
  // Text went in but images could not be attached: tell the caller so it can offer the download fallback.
  return result.success ? { ...result, fallbackTriggered: true } : result;
}

/** Opens (or focuses) the ChatGPT / Gemini tab, fills in the prompt and records it in history. Never presses send. */
async function sendToAi(prompt: CompiledPrompt, image: SelectedImage | null): Promise<SendResult> {
  const target = TARGETS[prompt.target];
  if (target.delivery !== 'inject' || !target.tabPattern) {
    return { success: false, error: `${target.label} prompts are copied, not sent` };
  }

  await appendHistory(createHistoryItem(prompt, image));

  const [existing] = await chrome.tabs.query({ url: target.tabPattern });
  let tabId: number | undefined;
  if (existing?.id !== undefined) {
    tabId = existing.id;
    await chrome.tabs.update(tabId, { active: true });
    if (existing.windowId !== undefined) await chrome.windows.update(existing.windowId, { focused: true });
  } else {
    tabId = (await chrome.tabs.create({ url: target.appUrl, active: true })).id;
  }
  if (tabId === undefined) return { success: false, error: `Could not open ${target.label}` };

  await waitForTabComplete(tabId);
  return injectIntoTab(tabId, prompt);
}

chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  if (message.type === 'OPEN_SIDE_PANEL') {
    // Open first, while the click from the content script still counts as a user gesture.
    const windowId = sender.tab?.windowId;
    if (windowId === undefined) {
      sendResponse({ success: false, error: 'No active window found' });
      return false;
    }
    const opening = chrome.sidePanel.open({ windowId });
    const { image, intent } = (message.payload ?? {}) as { image?: SelectedImage; intent?: IntentType };
    Promise.all([opening, image ? saveCapturedImage(image, intent) : null])
      .then(() => sendResponse({ success: true }))
      .catch((err) => {
        console.error(`${LOG_PREFIX} Could not open side panel:`, err);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }

  if (message.type === 'SEND_TO_AI') {
    const { prompt, image } = message.payload as { prompt: CompiledPrompt; image: SelectedImage | null };
    sendToAi(prompt, image)
      .then(sendResponse)
      .catch((err) => {
        console.error(`${LOG_PREFIX} Send failed:`, err);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }

  if (message.type === 'FETCH_IMAGE_BASE64') {
    fetchImageAsDataUrl(message.payload.url)
      .then((dataUrl) => sendResponse({ success: true, dataUrl }))
      .catch((err) => {
        console.warn(`${LOG_PREFIX} Could not fetch image for attachment:`, err);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }

  return false;
});
