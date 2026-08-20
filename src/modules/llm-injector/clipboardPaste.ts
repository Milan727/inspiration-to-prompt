/**
 * Helper to fetch image URL or Base64 and convert it to a File object.
 * Uses background script message if fetching a remote cross-origin URL to bypass CORS.
 */
export async function urlToFile(urlOrDataUrl: string, filename: string): Promise<File> {
  let dataUrl = urlOrDataUrl;

  if (urlOrDataUrl.startsWith('http://') || urlOrDataUrl.startsWith('https://')) {
    try {
      const response = await new Promise<{ success: boolean; dataUrl?: string }>((resolve) => {
        chrome.runtime.sendMessage(
          { type: 'FETCH_IMAGE_BASE64', payload: { url: urlOrDataUrl } },
          (res) => resolve(res || { success: false })
        );
      });
      if (response.success && response.dataUrl) {
        dataUrl = response.dataUrl;
      } else {
        const res = await fetch(urlOrDataUrl);
        const blob = await res.blob();
        return new File([blob], filename, { type: blob.type || 'image/jpeg' });
      }
    } catch (e) {
      const res = await fetch(urlOrDataUrl);
      const blob = await res.blob();
      return new File([blob], filename, { type: blob.type || 'image/jpeg' });
    }
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

/**
 * Attaches files to composer via file input assignment AND synthetic paste
 */
export function attachFilesToComposer(targetElement: HTMLElement, fileInput: HTMLInputElement | null, files: File[]): boolean {
  if (!files || files.length === 0) return false;

  let attached = false;
  const dataTransfer = new DataTransfer();
  files.forEach((file) => dataTransfer.items.add(file));

  // Find all file inputs on page as backup
  const allFileInputs = Array.from(document.querySelectorAll('input[type="file"]')) as HTMLInputElement[];
  const targetInputs = fileInput ? [fileInput, ...allFileInputs] : allFileInputs;

  for (const input of targetInputs) {
    try {
      input.files = dataTransfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('input', { bubbles: true }));
      attached = true;
    } catch (e) {
      console.warn('[PromptForge] File input assignment error:', e);
    }
  }

  // Strategy B: Clipboard paste simulation on composer text field
  try {
    targetElement.focus();
    const pasteEvent = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: dataTransfer,
    });

    targetElement.dispatchEvent(pasteEvent);
    attached = true;
  } catch (error) {
    console.warn('[PromptForge] Clipboard paste simulation error:', error);
  }

  return attached;
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
