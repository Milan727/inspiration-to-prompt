# Lookshot — Manifest V3 Chrome Extension

## Product Vision
Lookshot allows users to discover inspiration images anywhere on the web (starting with Pinterest), analyze their photographic qualities (lighting, camera lens, composition, mood), select from 6 intent rule packs, and inject structured prompts directly into their own ChatGPT or Gemini web sessions — with zero API costs for developer and user alike.

## Zero-Cost Core Architecture
- **No Paid APIs**: Never calls OpenAI, Gemini, or Stability paid endpoints.
- **Client-Side Rule Engine**: Prompts are compiled locally using rule-based photography templates.
- **DOM & Clipboard Injection**: Hand-delivers structured text prompts + inspiration images (+ optional selfie reference) straight into the user's existing `chatgpt.com` or `gemini.google.com` tab.
- **Guaranteed Fallback**: If browser DOM or CORS restrictions block direct injection, Lookshot seamlessly falls back to 1-click prompt copying and reference image downloading.

```
Pinterest / Web Image
        │
        ▼
Content Script (pinterestDetector.ts)
        │
        ▼
Background Service Worker (serviceWorker.ts) & chrome.storage.local
        │
        ▼
React Side Panel UI (App.tsx)
  ├── 6 Intent Rule Packs (Recreate scene, Place my face, Fashion, Pro portrait, Travel, Directed edit)
  ├── Photography Fine-Tuning (Aspect ratio, Lens, Lighting, Custom directive)
  └── Live Prompt Preview
        │
        ▼
LLM Injector (llmInjector.ts)
  └── Injects text + simulated clipboard image paste into ChatGPT/Gemini composer
```

## Module Structure
- `src/background/serviceWorker.ts`: MV3 background worker, side panel behavior, and context menu handler.
- `src/content/pinterestDetector.ts`: Hover overlay, Pinterest high-res pin resolution enhancer (`originals/` / `736x/`), image metadata extractor.
- `src/content/llmInjector.ts`: DOM composer locator, synthetic input & clipboard paste simulator for `chatgpt.com` and `gemini.google.com`.
- `src/modules/image-selection/pinterestEnhancer.ts`: Pinterest image URL regex enhancer.
- `src/modules/prompt-builder/`: 6 photography rule packs and prompt compiler engine.
- `src/modules/llm-injector/`: Composer selectors, simulated paste events, and fallback engine.
- `src/sidepanel/`: React 19 + Tailwind CSS Side Panel interface.

## Milestones Status
- [x] **M1**: Manifest V3 extension skeleton + React Side Panel UI shell.
- [x] **M2**: Pinterest image detector, pin card enhancer, message passing & context menu.
- [x] **M3**: 6 intent prompt rule packs + Vitest unit test suite.
- [x] **M4**: ChatGPT & Gemini DOM composer injection + clipboard paste simulation & fallbacks.
- [x] **M5**: UX polish, selfie reference storage, and live prompt preview.
- [x] **M6**: Automated test execution.
- [x] **M7**: Project documentation & build setup.

## Building & Unpacked Testing Instructions
1. Install dependencies: `npm install`
2. Run test suite: `npm test`
3. Build unpacked extension: `npm run build`
4. Load into Chrome:
   - Open `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist/` directory.
