export interface LLMSelectorConfig {
  target: 'chatgpt' | 'gemini';
  domain: string;
  textareaSelectors: string[];
  sendButtonSelectors: string[];
  fileInputSelectors: string[];
}

export const COMPOSER_SELECTORS: Record<'chatgpt' | 'gemini', LLMSelectorConfig> = {
  chatgpt: {
    target: 'chatgpt',
    domain: 'chatgpt.com',
    textareaSelectors: [
      '#prompt-textarea',
      'textarea[tabindex="0"]',
      'div[contenteditable="true"]#prompt-textarea',
      'div[contenteditable="true"]',
    ],
    sendButtonSelectors: [
      'button[data-testid="send-button"]',
      'button[aria-label="Send prompt"]',
      'button[aria-label="Send message"]',
    ],
    fileInputSelectors: [
      'input[type="file"]',
      'button[aria-label="Attach files"]',
    ],
  },
  gemini: {
    target: 'gemini',
    domain: 'gemini.google.com',
    textareaSelectors: [
      'rich-textarea div[contenteditable="true"]',
      'div.aria-textarea[contenteditable="true"]',
      'div[contenteditable="true"].input-area',
      'div[contenteditable="true"]',
      'textarea',
    ],
    sendButtonSelectors: [
      'button.send-button',
      'button[aria-label="Send message"]',
      'button[mattooltip="Send message"]',
      'button.send-button-container',
    ],
    fileInputSelectors: [
      'input[type="file"]',
      'button[aria-label="Upload image"]',
      'button[aria-label="Upload file"]',
    ],
  },
};

/**
 * Utility to find the first matching element from a selector list
 */
export function findElementBySelectors(selectors: string[], parent: Document | Element = document): HTMLElement | null {
  for (const selector of selectors) {
    try {
      const el = parent.querySelector(selector);
      if (el && el instanceof HTMLElement) {
        return el;
      }
    } catch (e) {
      // Ignore invalid selector errors during fallback search
    }
  }
  return null;
}
