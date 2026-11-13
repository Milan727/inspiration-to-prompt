# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Lookshot (formerly PromptForge) is a Manifest V3 Chrome extension (React 19 + TypeScript + Tailwind 3, bundled with Vite 5 + `@crxjs/vite-plugin`) for casual creators: capture a Pinterest/web photo, pick a style, and it fills a prompt plus images into the user's own ChatGPT / Gemini tab. No paid API, no accounts, no Lookshot server. Shipping free first; monetization is deliberately out of scope for now.

## Session protocol (from AGENTS.md — mandatory)

- **Start**: read `CONTEXT_WINDOW.md` (iteration history, decisions) before changing code.
- **End**: run `npm test` and `npm run zip`, then add a new numbered `### Iteration N — Title (YYYY-MM-DD)` entry to `CONTEXT_WINDOW.md` (Goal / Trigger, Changes Made, Files Modified, Verification Status). Never delete earlier entries. Note: entries sit *above* the "Current Verification & Health Status" section, not at the literal end of the file.
- Don't break the shared types in `src/types/index.ts` or the prompt compilation in `src/modules/prompt-builder/`.
- Don't silence errors with empty try/catch or delete failing tests.

## Commands

```bash
npm install
npm test                                   # vitest run (jsdom, globals)
npx vitest run tests/unit/promptBuilder.test.ts   # single file
npx vitest run -t "midjourney"             # tests matching a name
npm run test:watch
npm run build                              # tsc (type-check only, noEmit) && vite build → dist/
npm run zip                                # build + zip the *contents* of dist/ as lookshot-v1.0.0.zip
node scripts/generate-icons.js             # regenerate icons/ and public/icons/
```

There is no lint script; `tsc` in `npm run build` is the type check. To try the extension, load **`dist/`** (not the repo root — its `manifest.json` points at `.ts` sources Chrome can't run, giving a blank panel) via `chrome://extensions` → Developer mode → Load unpacked; after rebuilding, click reload on the card. The store zip must have `manifest.json` at its top level, which is why `zip` runs from inside `dist/`. Version `1.0.0` is hard-coded in `package.json`, `manifest.json`, and the `zip` script.

**If `npm test` / `vite` hang with no output and ~0% CPU**: the repo lives in `~/Desktop`, which is iCloud-synced, and macOS may have offloaded files (`find node_modules -flags +dataless | wc -l`). Fix with `rm -rf node_modules && npm ci`; restore other offloaded files with `brctl download <path>`.

## Architecture

Entry points are declared in `manifest.json` (crxjs reads it via `vite.config.ts`). **`chrome.storage.local` is the shared state bus**: every key is listed in `STORAGE_KEYS` (`src/lib/storage.ts`), and the side panel subscribes to `storage.onChanged` (`src/sidepanel/usePanelState.ts`), so anything written by the Pinterest menu or context menu shows up live in an open panel.

- **`src/content/pinterestDetector.ts`** (Pinterest domains only): the one-tap ring + style menu, rendered in a shadow root. Finds the image under the pointer with `elementsFromPoint` (Pinterest overlays its images). Picking a style builds the prompt in the page and sends `SEND_TO_AI`; Midjourney/Flux targets copy to the clipboard instead. It keeps a synchronous cache of selfie/target/settings so a "Put me in this photo" click without a selfie can still send `OPEN_SIDE_PANEL` inside the user gesture.
- **`src/background/serviceWorker.ts`**: context menu (any image → saved, panel opened), `OPEN_SIDE_PANEL` (opens first, then saves; `sidePanel.open` must run before any await), `SEND_TO_AI` (records history, finds/opens and focuses the ChatGPT/Gemini tab, waits for load, injects), `FETCH_IMAGE_BASE64` (fetch in the worker to avoid page CORS; uses `blobToDataUrl` because `FileReader` does not exist in service workers).
- **`src/content/llmInjector.ts`** (ChatGPT/Gemini only): finds the composer, types the text, attaches images once (file input if present, else synthetic paste — never both, that double-uploads). Never auto-clicks send.
- **`src/sidepanel/`**: `App.tsx` wires `usePanelState()` to small components in `components/` (Header, Welcome, ImageHero, StylePicker, YourPhoto, AdvancedSettings, SendBar, Gallery).

**Injection has two layers.** The worker messages the content script (retrying while a fresh tab loads); if that fails it runs `chrome.scripting.executeScript` with the inline, self-contained `injectPromptDirectlyToDOM` (text only, selectors passed as args) and reports `fallbackTriggered` so the panel offers "Download images".

**ChatGPT / Gemini selectors are remote data.** `config/selectors.json` is bundled as the default and also fetched from the repo's `main` branch on GitHub (`REMOTE_SELECTORS_URL` in `composerSelectors.ts`) by the service worker at most every 6h, validated by `parseSelectorConfig()`, and cached in `chrome.storage.local.remoteSelectors`. When those sites change their DOM, edit `config/selectors.json` and push to `main`: users pick it up without a store release. Bump `schemaVersion` (and `SELECTOR_SCHEMA_VERSION`) only for incompatible format changes. If the repo is renamed, update `REMOTE_SELECTORS_URL`.

**Permissions are deliberately minimal** (Chrome Web Store review): host access only for Pinterest domains, `pinimg.com`, ChatGPT and Gemini; no `tabs`, no `<all_urls>`. Images from other sites arrive via the right-click menu, and access to that image's host is requested at send time through `optional_host_permissions` (`src/lib/imageAccess.ts`). That `chrome.permissions.request` call must stay the first `await` in the send handler or Chrome drops the user gesture. Keep `CHROMEWEBSTORE.md`'s permission table in sync with the manifest.

**Prompt compilation** (`src/modules/prompt-builder/`): `RULE_PACKS` in `rulePacks.ts` maps each of the 6 `IntentType`s to UI copy (`title`, `shortDesc`, `needsSelfie`), `styleKeywords`, and a `template()`; `MAIN_INTENTS` (3, shown up front) and `MORE_INTENTS` (behind "More styles") split them for the UI. All templates go through `composePrompt()` (auto-numbered checklist, aspect ratio, lens, text rule, identity rule). `builder.ts` **replaces** that text for the text-only `midjourney` (leading image URL as image prompt, `--ar … --style raw`, no `--v`) and `flux` targets. Templates must stay generic: a test fails if photo-specific phrases (stars, safety pins, split-screen, graffiti…) or "bypass" wording reappear. Don't add text that tries to get around AI safety filters (the old celebrity-name / "deepfake" keyword rewriting was removed on purpose).

Targets (labels, inject vs copy, tab URL patterns) live in `src/lib/targets.ts`. The product name for UI and logs is `BRAND_NAME` / `LOG_PREFIX` in `src/brand.ts`; the store name is in `manifest.json`. Messages are typed by `ExtensionMessageType` in `src/types/index.ts`.

## UI / styling

"Darkroom minimal": Tailwind tokens in `tailwind.config.js` — `ink-*` near-black grounds (`ink-950` `#0E0E0F` page, `ink-900` surfaces, `ink-800` borders, `ink-300` muted text) and one `safelight` accent (`#FFB547`). Shared component classes (`.press`, `.focus-ring`, `.field`, `.chip`, `.section-label`) are in `src/sidepanel/index.css`. Inter is bundled via `@fontsource-variable/inter` (no remote fonts). Dark only. The approved mockup: https://claude.ai/artifact/Cs777SnS5fUmYdC1y5LJ2i

## Other docs

- `CHROMEWEBSTORE.md`: store listing copy, permission justifications and privacy disclosures.
- `scripts/`: dev utilities (icon generation, git history rebuild). Not part of the build.
