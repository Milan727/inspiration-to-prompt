import { LOG_PREFIX } from '../../brand';
/**
 * Converts an image URL or data URL to a File. Remote URLs are downloaded by the service worker,
 * which has host permission for the image's site; a fetch from the ChatGPT / Gemini page itself
 * would be blocked by CORS, so there is no in-page fallback.
 */
export async function urlToFile(urlOrDataUrl: string, filename: string): Promise<File> {
  let dataUrl = urlOrDataUrl;

  if (urlOrDataUrl.startsWith('http://') || urlOrDataUrl.startsWith('https://')) {
    const response = await new Promise<{ success: boolean; dataUrl?: string; error?: string }>((resolve) => {
      chrome.runtime.sendMessage({ type: 'FETCH_IMAGE_BASE64', payload: { url: urlOrDataUrl } }, (res) =>
        resolve(chrome.runtime.lastError ? { success: false, error: chrome.runtime.lastError.message } : res ?? { success: false }),
      );
    });
    if (!response.success || !response.dataUrl) throw new Error(response.error || 'Image download failed');
    dataUrl = response.dataUrl;
  }

  // Convert base64 dataUrl to File
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  const blob = new Blob([u8arr], { type: mime });
  return new File([blob], filename, { type: mime });
}

function waitFor(condition: () => boolean, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const started = Date.now();
    const tick = () => {
      if (condition()) return resolve(true);
      if (Date.now() - started >= timeoutMs) return resolve(false);
      setTimeout(tick, 150);
    };
    tick();
  });
}

/**
 * Attaches files to the composer and verifies it worked by waiting for preview thumbnails to appear.
 * Tries the page's file input first; only if no previews show up does it try a synthetic paste, so a
 * working upload is never duplicated.
 */
export async function attachFilesToComposer(
  targetElement: HTMLElement,
  fileInput: HTMLInputElement | null,
  files: File[],
  timeoutMs = 2500,
): Promise<boolean> {
  if (!files || files.length === 0) return false;

  const scope = targetElement.closest('form') ?? targetElement.parentElement?.parentElement ?? document.body;
  const previewCount = () => scope.querySelectorAll('img').length;
  const before = previewCount();
  const appeared = () => waitFor(() => previewCount() > before, timeoutMs);

  const dataTransfer = new DataTransfer();
  files.forEach((file) => dataTransfer.items.add(file));

  const input =
    fileInput instanceof HTMLInputElement && fileInput.type === 'file'
      ? fileInput
      : document.querySelector<HTMLInputElement>('input[type="file"][accept*="image"]') ??
        document.querySelector<HTMLInputElement>('input[type="file"]');

  if (input) {
    try {
      input.files = dataTransfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      if (await appeared()) return true;
      console.warn(`${LOG_PREFIX} No previews after using the file input, trying paste instead.`);
    } catch (e) {
      console.warn(`${LOG_PREFIX} File input assignment failed, trying paste instead:`, e);
    }
  }

  try {
    targetElement.focus();
    targetElement.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dataTransfer }));
    if (await appeared()) return true;
    console.warn(`${LOG_PREFIX} No previews after paste either; the page did not accept the images.`);
    return false;
  } catch (error) {
    console.warn(`${LOG_PREFIX} Clipboard paste simulation error:`, error);
    return false;
  }
}

/**
 * Simulates text input into contenteditable div (ChatGPT/Gemini) or textarea
 * Uses document.execCommand('insertText') for native Lexical/ProseMirror compatibility.
 */
export function simulateTextInput(targetElement: HTMLElement, text: string): void {
  targetElement.focus();

  if (targetElement instanceof HTMLTextAreaElement || targetElement instanceof HTMLInputElement) {
    targetElement.value = text;
    targetElement.dispatchEvent(new Event('input', { bubbles: true }));
    targetElement.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    // For ContentEditable div (ChatGPT #prompt-textarea, Gemini rich-textarea)
    // Select existing contents first
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(targetElement);
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }

    // Use document.execCommand('insertText') which triggers native React/Lexical listeners cleanly
    const success = document.execCommand('insertText', false, text);

    if (!success || !targetElement.innerText.trim()) {
      // Fallback if execCommand is restricted
      targetElement.innerText = text;
      targetElement.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
    }
  }
}

/**
 * Copies text to system clipboard as fallback
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
}

/**
 * Triggers browser download for an image URL or Data URL
 */
export function triggerImageDownload(imageUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.href = imageUrl;
  a.download = filename;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
