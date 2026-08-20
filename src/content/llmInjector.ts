import { COMPOSER_SELECTORS, findElementBySelectors } from '../modules/llm-injector/composerSelectors';
import { simulateTextInput, attachFilesToComposer, urlToFile, copyTextToClipboard } from '../modules/llm-injector/clipboardPaste';
import { ExtensionMessage, CompiledPrompt } from '../types';

console.log('[PromptForge] LLM Injector content script active on:', window.location.hostname);

chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  if (message.type === 'INJECT_PROMPT') {
    handlePromptInjection(message.payload.prompt)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ success: false, error: err.message, fallbackTriggered: true }));
    return true; // async return
  }
});

async function handlePromptInjection(prompt: CompiledPrompt): Promise<{ success: boolean; fallbackTriggered?: boolean; error?: string }> {
  const isChatGPT = window.location.hostname.includes('chatgpt.com');
  const isGemini = window.location.hostname.includes('gemini.google.com');

  const targetConfig = isChatGPT ? COMPOSER_SELECTORS.chatgpt : isGemini ? COMPOSER_SELECTORS.gemini : null;

  if (!targetConfig) {
    return { success: false, error: 'Current page is not ChatGPT or Gemini', fallbackTriggered: true };
  }

  // Step 1: Locate Composer & File Input Elements
  let composerEl = findElementBySelectors(targetConfig.textareaSelectors);
  
  if (!composerEl) {
    for (let i = 0; i < 5; i++) {
      await new Promise((r) => setTimeout(r, 300));
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

  // Step 3: Convert Image URLs & User Selfie to File objects (Bypassing CORS via SW)
  const filesToAttach: File[] = [];

  try {
    if (prompt.imageUrls && prompt.imageUrls.length > 0) {
      for (let i = 0; i < prompt.imageUrls.length; i++) {
        const file = await urlToFile(prompt.imageUrls[i], `inspiration_image_${i + 1}.jpg`);
        filesToAttach.push(file);
      }
    }

    if (prompt.referenceSelfieDataUrl) {
      const selfieFile = await urlToFile(prompt.referenceSelfieDataUrl, 'user_reference_selfie.jpg');
      filesToAttach.push(selfieFile);
    }

    if (filesToAttach.length > 0) {
      attachFilesToComposer(composerEl, fileInputEl, filesToAttach);
    }
  } catch (imgErr) {
    console.warn('[PromptForge] Could not attach images automatically:', imgErr);
    return {
      success: true,
      fallbackTriggered: true,
      error: 'Text prompt injected! Please click Download Images button to attach photos manually if needed.',
    };
  }

  // Highlighting effect on composer
  composerEl.style.outline = '2px solid #6366f1';
  composerEl.style.boxShadow = '0 0 12px rgba(99, 102, 241, 0.5)';
  setTimeout(() => {
    if (composerEl) {
      composerEl.style.outline = 'none';
      composerEl.style.boxShadow = 'none';
    }
  }, 2500);

  return { success: true };
}
