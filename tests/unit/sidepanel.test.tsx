import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../../src/sidepanel/App';
import { STORAGE_KEYS } from '../../src/lib/storage';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function mockChrome(initial: Record<string, any>) {
  const store = { ...initial };
  (globalThis as any).chrome = {
    storage: {
      local: {
        get: vi.fn(async (keys: string[]) => Object.fromEntries(keys.filter((k) => k in store).map((k) => [k, store[k]]))),
        set: vi.fn(async (items: Record<string, any>) => Object.assign(store, items)),
        remove: vi.fn(async () => {}),
      },
      onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
    },
    runtime: { sendMessage: vi.fn() },
  };
}

async function render() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    createRoot(container).render(<App />);
  });
  return container;
}

describe('side panel', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should show the welcome screen when no photo is captured', async () => {
    mockChrome({});
    const el = await render();
    expect(el.textContent).toContain('See a look you love?');
    expect(el.textContent).toContain('No photo yet');
  });

  it('should show the main styles and the send bar once a photo is captured', async () => {
    mockChrome({
      [STORAGE_KEYS.image]: { url: 'https://i.pinimg.com/a.jpg', highResUrl: 'https://i.pinimg.com/a.jpg', alt: '', title: 'Amalfi linen suit', sourceUrl: '', timestamp: 1 },
      [STORAGE_KEYS.target]: 'gemini',
    });
    const el = await render();
    expect(el.textContent).toContain('Amalfi linen suit');
    expect(el.textContent).toContain('Put me in this photo');
    expect(el.textContent).toContain('Recreate this look');
    expect(el.textContent).toContain('Try this outfit');
    expect(el.textContent).toContain('Add this effect to my photo');
    expect(el.querySelectorAll('input[type="radio"][name="style"]')).toHaveLength(4);
    expect(el.textContent).toContain('Send to Gemini');
  });
});
