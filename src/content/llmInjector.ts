import { LOG_PREFIX } from '../brand';
import { INSPIRATION_FILENAME, SELFIE_FILENAME, extraFaceFilename } from '../modules/prompt-builder/attachments';
import { getSelectorConfig, findElementBySelectors } from '../modules/llm-injector/composerSelectors';
import { simulateTextInput, attachFilesToComposer, urlToFile, copyTextToClipboard } from '../modules/llm-injector/clipboardPaste';
import { ExtensionMessage, CompiledPrompt } from '../types';

interface InjectionResult {
  success: boolean;
  fallbackTriggered?: boolean;
  error?: string;
  attached?: number;
  expected?: number;
}

// The service worker may inject this script into a tab that already has it; register only once.
const marker = window as unknown as { __lookshotInjector?: boolean };
if (!marker.__lookshotInjector) {
  marker.__lookshotInjector = true;
  console.log(`${LOG_PREFIX} LLM Injector content script active on:`, window.location.hostname);

  chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
    if (message.type === 'INJECT_PROMPT') {
      handlePromptInjection(message.payload.prompt)
        .then((result) => sendResponse(result))
        .catch((err) => {
          console.error(`${LOG_PREFIX} Injection failed:`, err);
          sendResponse({ success: false, error: err.message, fallbackTriggered: true });
        });
      return true; // async return
    }
  });
}

async function handlePromptInjection(prompt: CompiledPrompt): Promise<InjectionResult> {
  const isChatGPT = window.location.hostname.includes('chatgpt.com');
  const isGemini = window.location.hostname.includes('gemini.google.com');

  const selectors = await getSelectorConfig();
  const targetConfig = isChatGPT ? selectors.chatgpt : isGemini ? selectors.gemini : null;

  if (!targetConfig) {
    return { success: false, error: 'Current page is not ChatGPT or Gemini', fallbackTriggered: true };
  }

  // Step 1: Locate Composer & File Input Elements
  let composerEl = findElementBySelectors(targetConfig.textareaSelectors);
  
  if (!composerEl) {
    // ChatGPT / Gemini render the composer late on a fresh page load, so wait up to ~4s.
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 400));
      composerEl = findElementBySelectors(targetConfig.textareaSelectors);
      if (composerEl) break;
    }
  }

  if (!composerEl) {
    await copyTextToClipboard(prompt.promptText);
    return {
      success: false,
      error: 'Composer input field not found. Prompt copied to clipboard!',
      fallbackTriggered: true,
    };
  }

  const fileInputEl = findElementBySelectors(targetConfig.fileInputSelectors) as HTMLInputElement | null;

  // Step 2: Inject Structured Text Prompt into Composer
  simulateTextInput(composerEl, prompt.promptText);

  // Step 3: Download each image (via the service worker, which avoids page CORS) and attach what worked.
  const sources = [
    ...(prompt.imageUrls ?? []).map((url, i) => ({ url, name: i === 0 ? INSPIRATION_FILENAME : `${i + 1}-inspiration.jpg` })),
    ...(prompt.referenceSelfieDataUrl ? [{ url: prompt.referenceSelfieDataUrl, name: SELFIE_FILENAME }] : []),
    ...(prompt.extraFaceDataUrls ?? []).map((url, i) => ({ url, name: extraFaceFilename(i) })),
  ];
  const files: File[] = [];
  const failures: string[] = [];
  for (const source of sources) {
    try {
      files.push(await urlToFile(source.url, source.name));
    } catch (err) {
      console.warn(`${LOG_PREFIX} Could not load ${source.name}:`, err);
      failures.push(`${source.name}: ${(err as Error).message}`);
    }
  }

  // Attach the images in a separate step from the text so a slow upload can't swallow it.
  const attached = files.length > 0 && (await attachFilesToComposer(composerEl, fileInputEl, files)) ? files.length : 0;
  if (attached < sources.length) {
    return {
      success: true,
      fallbackTriggered: true,
      attached,
      expected: sources.length,
      error: failures.length ? failures.join('; ') : 'The page did not accept the images',
    };
  }

  // Highlighting effect on composer
  composerEl.style.outline = '2px solid #FFB547';
  composerEl.style.boxShadow = '0 0 12px rgba(255, 181, 71, 0.5)';
  setTimeout(() => {
    if (composerEl) {
      composerEl.style.outline = 'none';
      composerEl.style.boxShadow = 'none';
    }
  }, 2500);

  return { success: true, attached, expected: sources.length };
}
