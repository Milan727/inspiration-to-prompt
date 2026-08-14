import { ExtensionMessage, SelectedImage } from '../types';

// Configure Side Panel behavior on action icon click
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((err) => console.error('Failed to set side panel behavior:', err));

// Set up Context Menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'send_to_promptforge',
    title: 'Send image to PromptForge',
    contexts: ['image'],
  });
});

// Handle Context Menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'send_to_promptforge' && info.srcUrl) {
    const selectedImage: SelectedImage = {
      url: info.srcUrl,
      highResUrl: info.srcUrl,
      alt: tab?.title || 'Selected Image',
      title: tab?.title || 'Web Image',
      sourceUrl: info.pageUrl || tab?.url || '',
      timestamp: Date.now(),
    };

    await chrome.storage.local.set({ activeSelectedImage: selectedImage });

    if (tab?.windowId) {
      try {
        await chrome.sidePanel.open({ windowId: tab.windowId });
      } catch (e) {
        console.warn('Could not open sidepanel automatically:', e);
      }
    }

    chrome.runtime.sendMessage({
      type: 'SELECT_IMAGE',
      payload: { image: selectedImage },
    }).catch(() => {});
  }
});

// Inline DOM Injector function for scripting fallback
function injectPromptDirectlyToDOM(promptText: string) {
  const isChatGPT = window.location.hostname.includes('chatgpt.com');
  const isGemini = window.location.hostname.includes('gemini.google.com');

  const selectors = isChatGPT
    ? ['#prompt-textarea', 'textarea[tabindex="0"]', 'div[contenteditable="true"]#prompt-textarea', 'div[contenteditable="true"]', 'textarea']
    : ['rich-textarea div[contenteditable="true"]', 'div.aria-textarea[contenteditable="true"]', 'div[contenteditable="true"].input-area', 'div[contenteditable="true"]', 'textarea'];

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

  composer.style.outline = '2px solid #6366f1';
  composer.style.boxShadow = '0 0 12px rgba(99, 102, 241, 0.5)';
  setTimeout(() => {
    if (composer) {
      composer.style.outline = 'none';
      composer.style.boxShadow = 'none';
    }
  }, 2500);

  return { success: true };
}

// Message Passing Listener
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  (async () => {
    try {
      if (message.type === 'SELECT_IMAGE') {
        const image: SelectedImage = message.payload.image;
        await chrome.storage.local.set({ activeSelectedImage: image });
        sendResponse({ success: true });
      } else if (message.type === 'GET_SELECTED_IMAGE') {
        const data = await chrome.storage.local.get('activeSelectedImage');
        sendResponse({ image: data.activeSelectedImage || null });
      } else if (message.type === 'OPEN_SIDE_PANEL') {
        if (sender.tab?.windowId) {
          await chrome.sidePanel.open({ windowId: sender.tab.windowId });
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'No active window found' });
        }
      } else if (message.type === 'FETCH_IMAGE_BASE64') {
        const url = message.payload.url;
        const res = await fetch(url);
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          sendResponse({ success: true, dataUrl: reader.result as string });
        };
        reader.onerror = () => {
          sendResponse({ success: false, error: 'Failed to read blob as base64' });
        };
        reader.readAsDataURL(blob);
      } else if (message.type === 'INJECT_PROMPT') {
        const { tabId, prompt } = message.payload;
        if (!tabId) {
          sendResponse({ success: false, error: 'No tabId provided' });
          return;
        }

        // Send to content script first
        chrome.tabs.sendMessage(tabId, { type: 'INJECT_PROMPT', payload: { prompt } }, async (response) => {
          if (chrome.runtime.lastError || !response || !response.success) {
            console.log('[PromptForge SW] Content script response failed, running inline DOM scripting...');
            try {
              const [res] = await chrome.scripting.executeScript({
                target: { tabId },
                func: injectPromptDirectlyToDOM,
                args: [prompt.promptText],
              });
              sendResponse(res?.result || { success: true });
            } catch (err: any) {
              sendResponse({ success: false, error: err.message });
            }
          } else {
            sendResponse(response);
          }
        });
      }
    } catch (error: any) {
      console.error('Error in serviceWorker message listener:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();
  return true;
});
