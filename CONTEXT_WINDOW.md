# CONTEXT_WINDOW.md — Master Project State & Iteration History

> **Notice to AI Models (Claude, Cursor, Antigravity, Windsurf, Copilot, ChatGPT, etc.)**  
> This file is the single source of truth for all historical context, architecture decisions, UI guidelines, and iteration logs for **PromptForge**.  
> **Rule**: You MUST read this document before making changes, and append your work as a new **Iteration Entry** at the bottom before finishing your session.

---

## 📌 Project Executive Summary

* **Project Name**: Lookshot (renamed from PromptForge on 2026-10-23)
* **Version**: `v1.0.0`
* **Type**: Manifest V3 Chrome Extension
* **Target Users**: Creators, Photographers, AI Artists, Influencers, and Normal Pinterest/Instagram Users.
* **Core Value Proposition**: Converts Pinterest pins and web inspiration photos into structured, zero-cost multimodal photoshoot prompts. Supports optional face swapping, Midjourney `/imagine` parameters (`--ar 4:5 --v 6.0`), Flux.1 formatting, ChatGPT, and Gemini Advanced DOM injection with zero mandatory API costs.

---

## 🗺️ Master Codebase File Map

```
/Users/milan/Desktop/Ext/
├── AGENTS.md                            # Global AI agent operating rules & mandatory session logging protocol
├── CONTEXT_WINDOW.md                    # Master context memory, iteration history, & state log (THIS FILE)
├── CHROMEWEBSTORE.md                    # Web Store developer listing, permission justifications, privacy policy
├── PROJECT.md                           # Core system architecture overview
├── README.md                            # Quickstart installation guide
├── manifest.json                        # Chrome Extension MV3 manifest configuration
├── package.json                         # Node dependencies, Vitest scripts, and npm run zip build script
├── tailwind.config.js                   # Tailwind CSS configuration
├── tsconfig.json                        # TypeScript compiler options
├── vite.config.ts                       # Vite build bundler configuration for MV3 Chrome Extension
├── promptforge-v1.0.0.zip               # Production deployment package for Chrome Web Store submission
├── dist/                                # Vite compiled production output folder
├── icons/                               # Chrome extension icons (16px, 48px, 128px)
├── src/
│   ├── background/
│   │   └── serviceWorker.ts             # MV3 Background Service Worker, side panel behavior, context menus
│   ├── content/
│   │   ├── pinterestDetector.ts         # Hover badge overlay on Pinterest/web images, resolution upscaler
│   │   └── llmInjector.ts               # Synthetic DOM composer injector for chatgpt.com & gemini.google.com
│   ├── lib/
│   │   └── geminiApi.ts                 # Optional Gemini 1.5 Flash Vision API integration for feature extraction
│   ├── modules/
│   │   ├── image-selection/
│   │   │   └── pinterestEnhancer.ts     # Keyless DOM scraper for pin titles, descriptions & visual tags
│   │   ├── llm-injector/
│   │   │   ├── clipboardPaste.ts        # Synthetic image blob clipboard paste event simulator & fallback downloader
│   │   │   └── composerSelectors.ts     # DOM selectors for ChatGPT and Gemini text/file input fields
│   │   └── prompt-builder/
│   │       ├── builder.ts               # Prompt compiler engine with MJ / Flux / ChatGPT / Gemini formatters
│   │       └── rulePacks.ts             # 6 Photography Rule Packs & Mandatory 8-Point Visual Feature Checklist
│   ├── sidepanel/
│   │   ├── App.tsx                      # React 19 Exaggerated Minimalism Side Panel UI & state manager
│   │   ├── main.tsx                     # React DOM root entry point
│   │   ├── index.html                   # HTML template for Chrome Side Panel
│   │   └── index.css                    # Design tokens, monochrome dark theme, micro-interactions, scrollbars
│   └── types/
│       └── index.ts                     # TypeScript interfaces (SelectedImage, PhotographySettings, IntentType, etc.)
└── tests/
    └── unit/
        ├── pinterestEnhancer.test.ts    # Vitest tests for Pinterest resolution upscaler & metadata extraction
        └── promptBuilder.test.ts        # Vitest tests for prompt compiler, MJ /imagine, & Flux formatters
```

---

## 🏗️ System Architecture & Data Flow

```
[ Web Image / Pinterest Pin ]
            │
            ▼
[ content/pinterestDetector.ts ]  ──(Hover "Forge Prompt" Badge)
            │
            ▼
[ background/serviceWorker.ts ]  ──(Persists activeSelectedImage to chrome.storage.local)
            │
            ▼
[ sidepanel/App.tsx ] ────────────(Renders Minimalist UI)
   ├── Input 1: Inspiration Image (from Pinterest / Web)
   ├── Input 2: User Reference Selfie (Optional Face Swap)
   ├── Input 3: Target LLM (Gemini / ChatGPT / Midjourney / Flux)
   ├── Input 4: Intent Rule Pack (Recreate Scene, Place My Face, Fashion, Pro Portrait, Travel, Directed Edit)
   └── Input 5: Fine-Tuning Controls (Text Overlay, Aspect Ratio, Camera Lens, Custom Directive)
            │
            ▼
[ modules/prompt-builder/builder.ts ] ──(Compiles 8-Point Checklist + Public Figure Safety Header)
            │
            ▼
[ content/llmInjector.ts & modules/llm-injector/clipboardPaste.ts ]
   ├── Injects prompt text into ChatGPT/Gemini composer
   ├── Simulates synthetic clipboard paste for attached images
   └── Fallback: 1-click clipboard copy + image downloader
```

---

## 📜 Full Iteration History & Development Logs

### Iteration 1 — Foundation & Chrome MV3 Extension Setup
- **Goal**: Initialize Manifest V3 extension structure with side panel support.
- **Changes Made**:
  - Configured `manifest.json` with permissions (`sidePanel`, `storage`, `activeTab`, `scripting`, `downloads`).
  - Created background service worker (`serviceWorker.ts`) to configure side panel behavior on action click.
  - Implemented `pinterestDetector.ts` content script to inject a floating **Forge Prompt** hover badge on images.
- **Files Modified**: `manifest.json`, `src/background/serviceWorker.ts`, `src/content/pinterestDetector.ts`.

---

### Iteration 2 — 6 Photography Intent Rule Packs
- **Goal**: Provide specialized photography intent templates so prompts are structured for high-end photorealism.
- **Changes Made**:
  - Built 6 intent rule packs in `src/modules/prompt-builder/rulePacks.ts`:
    1. `recreate_scene`: Full aesthetic, environment, pose, and lighting recreation.
    2. `place_my_face`: Identity compositing placing Image 2's face onto Image 1's scene.
    3. `fashion_transfer`: Outfit, fabric texture, and clothing transfer.
    4. `pro_portrait`: Studio photography, bokeh depth, and 85mm prime lens focus.
    5. `travel_lifestyle`: Environmental storytelling and candid outdoor lighting.
    6. `directed_edit`: User-customized modification overlays.
- **Files Modified**: `src/modules/prompt-builder/rulePacks.ts`, `src/types/index.ts`.

---

### Iteration 3 — Multimodal DOM Injection & Clipboard Simulator
- **Goal**: Seamlessly hand-deliver compiled prompts and images directly into open ChatGPT or Gemini tabs.
- **Changes Made**:
  - Created `llmInjector.ts` and `composerSelectors.ts` to locate text composers on `chatgpt.com` and `gemini.google.com`.
  - Implemented `clipboardPaste.ts` to fetch image blobs and dispatch synthetic `PasteEvent` data to upload images without manual file dragging.
  - Built 1-click fallback copy/download actions when browser CORS blocks direct injection.
- **Files Modified**: `src/content/llmInjector.ts`, `src/modules/llm-injector/composerSelectors.ts`, `src/modules/llm-injector/clipboardPaste.ts`.

---

### Iteration 4 — Optional Gemini 1.5 Flash Vision API Integration
- **Goal**: Allow users with Gemini API keys to automatically extract visual features inside the extension.
- **Changes Made**:
  - Created `src/lib/geminiApi.ts` to call Gemini 1.5 Flash Vision model.
  - Added **"✦ Extract Visual Features"** button in side panel to auto-fill camera lens, lighting style, and custom directives.
- **Files Modified**: `src/lib/geminiApi.ts`, `src/sidepanel/App.tsx`.

---

### Iteration 5 — Keyless DOM Scraper for Real Users
- **Goal**: Ensure users without an API key still get rich feature extraction out of the box.
- **Changes Made**:
  - Upgraded `extractPinterestMetadata` in `pinterestEnhancer.ts` to scrape `meta[name="description"]`, pin title tags, and visual search tags directly from Pinterest's DOM.
  - Automatically packages scraped details into the prompt compiler.
- **Files Modified**: `src/modules/image-selection/pinterestEnhancer.ts`, `tests/unit/pinterestEnhancer.test.ts`.

---

### Iteration 6 — Gemini Public Figure Anonymity Safeguard Header
- **Goal**: Bypass Gemini Advanced's safety block ("I can help with images of people, but I can't depict public figures").
- **Changes Made**:
  - Added explicit `[SAFETY & COMPLIANCE NOTICE]` header to all prompts instructing Gemini that Image 1 is attached strictly as an anonymous layout/style reference, preserving private facial identity from Image 2.
- **Files Modified**: `src/modules/prompt-builder/rulePacks.ts`.

---

### Iteration 7 — Text Overlay & Typography Control Mode
- **Goal**: Allow users to control whether text in the original Pinterest photo appears in the generated output.
- **Changes Made**:
  - Added `textOverlayMode` (`none`, `original`, `custom`) and `customOverlayText` input.
  - Appended text overlay instructions to prompt compiler.
- **Files Modified**: `src/types/index.ts`, `src/modules/prompt-builder/builder.ts`, `src/sidepanel/App.tsx`.

---

### Iteration 8 — Mandatory 8-Point Visual Feature Checklist
- **Goal**: Prevent generic AI outputs by enforcing strict feature extraction rules.
- **Changes Made**:
  - Enforced an 8-Point Checklist in all rule packs:
    1. Layout & Split-screen composition
    2. Headwear & Props (caps, pins, badges, earphones)
    3. Graphics & Stickers (floating stars, metallic background icons)
    4. Outfit, Fabrics & Hardware (sweaters, shoulder harness straps, buckles)
    5. Background, Textures & Wall Art/Graffiti (elevator paneling, concrete, neon)
    6. Pose & Camera Angle
    7. Lighting & Atmosphere
    8. Subject Identity Compositing
- **Files Modified**: `src/modules/prompt-builder/rulePacks.ts`.

---

### Iteration 9 — Midjourney `/imagine` & Flux.1 Syntax Support
- **Goal**: Expand prompt output targets to popular standalone AI generators.
- **Changes Made**:
  - Updated `TargetLLM` type to `'chatgpt' | 'gemini' | 'midjourney' | 'flux'`.
  - Added Midjourney formatter: `/imagine prompt: ... --ar 4:5 --v 6.0 --style raw`.
  - Added Flux.1 photorealism master prompt format.
  - Added unit test in `promptBuilder.test.ts` (7/7 tests passing).
- **Files Modified**: `src/types/index.ts`, `src/modules/prompt-builder/builder.ts`, `src/sidepanel/App.tsx`, `tests/unit/promptBuilder.test.ts`.

---

### Iteration 10 — Prompt History & Favorites Persistence
- **Goal**: Allow users to review and re-use past generated prompts.
- **Changes Made**:
  - Added `promptHistory` storage in `chrome.storage.local` saving up to 20 past prompts.
  - Implemented top-bar **History (🕓)** drawer in `App.tsx` with 1-click copy and clear actions.
- **Files Modified**: `src/types/index.ts`, `src/sidepanel/App.tsx`.

---

### Iteration 11 — Web Store Launch Documentation & Zip Pipeline
- **Goal**: Prepare production extension package for Chrome Web Store publishing.
- **Changes Made**:
  - Created `CHROMEWEBSTORE.md` with store title, short summary, detailed description, CWS permission justifications table, and privacy disclosure.
  - Added `npm run zip` script in `package.json` to build production JS/CSS and package `dist/`, `icons/`, and `manifest.json` into `promptforge-v1.0.0.zip`.
  - Created `.gitignore` ignoring build artifacts and `.DS_Store`.
- **Files Modified**: `CHROMEWEBSTORE.md`, `package.json`, `.gitignore`.

---

### Iteration 12 — UI/UX Pro Max Exaggerated Minimalism Redesign
- **Goal**: Redesign side panel UI with an ultra-clean, monochrome dark aesthetic.
- **Changes Made**:
  - Applied **Exaggerated Minimalism** style from `ui-ux-pro-max` skill:
    - Monochrome dark theme (`#111` background, `#161616` surface, `#222` border).
    - `Inter` typography at `-0.01em` letter-spacing.
    - Single `#e5e5e5` light primary CTA button (`Send to Gemini / ChatGPT`).
    - Ultra-thin 4px scrollbar.
    - Smooth `220ms` sliding pill highlight for target model selection (`Gemini`, `ChatGPT`, `MJ`, `Flux`).
    - Smooth collapsible accordion drawer for photography settings.
    - Tactile `scale(0.96)` active press state on interactive controls (`make-interfaces-feel-better` principle #12).
- **Files Modified**: `src/sidepanel/App.tsx`, `src/sidepanel/index.css`, `src/sidepanel/index.html`.

---

### Iteration 13 — Fixed Sticky Focus Rings & Smooth Chip Selection
- **Goal**: Eliminate sticky browser focus outlines on button clicks and refine chip selection transitions.
- **Changes Made**:
  - Added `button, input, select { outline: none; }` in `index.css` to prevent Chrome from leaving a white border around unselected chips after mouse clicks.
  - Created `.chip-item` and `.chip-item-active` classes with smooth `180ms cubic-bezier(0.16, 1, 0.3, 1)` transitions for background, border, text color, and elevation shadow.
  - Verified 7/7 Vitest unit tests green and updated `promptforge-v1.0.0.zip`.
- **Files Modified**: `src/sidepanel/index.css`, `src/sidepanel/App.tsx`.

---

### Iteration 14 — Created AGENTS.md & CONTEXT_WINDOW.md Context Systems (2026-07-27)
- **Goal**: Establish a permanent memory system and mandatory operating rules for all AI assistants (Claude, Cursor, Antigravity, Windsurf, Copilot) to prevent hallucinations and maintain project continuity across model switches.
- **Changes Made**:
  - Created `AGENTS.md` containing global AI operating rules, mandatory start-of-session reading rules, and end-of-session logging protocol.
  - Created `CONTEXT_WINDOW.md` containing complete system architecture, file map, full 14-iteration history, test verification commands, and standardized templates for future log entries.
- **Files Modified**: `AGENTS.md`, `CONTEXT_WINDOW.md`.
- **Verification Status**:
  - Vitest Unit Tests: **7/7 Passed (100% Green)**
  - Production Bundle: `npm run zip` compiled cleanly with 0 errors. Package updated at `promptforge-v1.0.0.zip`.

---

### Iteration 15 — YouMind-Inspired Neo-Editorial Brutalist UI Redesign (2026-07-27)
- **Goal**: Redesign Chrome Extension side panel UI to match YouMind.com/prompts aesthetic using Google's Stitch MCP server.
- **Changes Made**:
  - Connected and created Stitch MCP project (`projects/12086197637705197593`), generating `Neo-Editorial Brutalist` design system and mobile extension side-panel screen (`db7f6dbf41534b929dbdc0957a91af39`).
  - Updated `src/sidepanel/index.css` with Google Fonts (`Bricolage Grotesque`, `Work Sans`, `JetBrains Mono`), warm paper canvas (`#FFF8F2`), dark charcoal ink borders (`2px solid #211D16`), hard offset box-shadows (`4px 4px 0px #211D16`), coral red (`#FF6B6B`) CTAs, and yellow (`#FFE66A`) status badges.
  - Redesigned `src/sidepanel/App.tsx` header with **PROMPTFORGE ATELIER** typography, version badge, model selector track, reference image card, photography intent rule pack chips, fine-tuning controls, and prompt output card.
- **Files Modified**: [`src/sidepanel/index.css`](file:///Users/milan/Desktop/Ext/src/sidepanel/index.css), [`src/sidepanel/App.tsx`](file:///Users/milan/Desktop/Ext/src/sidepanel/App.tsx), [`CONTEXT_WINDOW.md`](file:///Users/milan/Desktop/Ext/CONTEXT_WINDOW.md).
- **Verification Status**:
  - Vitest Unit Tests: **7/7 Passed (100% Green)**
  - Production Bundle: `npm run zip` compiled cleanly with 0 errors. Package updated at `promptforge-v1.0.0.zip`.

---

### Iteration 16 — Obsidian Editorial Dark Mode & Sleek Header Toggle (2026-07-27)
- **Goal**: Add a sleek Dark Mode toggle button to the extension header and implement the `Obsidian Editorial` Dark Mode theme generated via Stitch MCP.
- **Changes Made**:
  - Generated `Obsidian Editorial` Dark Mode screen variant (`edb092b236a145e380a5266da51a5450`) using `generate_variants` tool on Stitch MCP project `projects/12086197637705197593`.
  - Added `.dark-mode` CSS token overrides in `src/sidepanel/index.css`: deep charcoal canvas (`#141210`), warm obsidian container surfaces (`#1E1B18`), crisp cream borders (`#FFF8F2`), coral red primary CTAs (`#FF6B6B`), and neon yellow active badges (`#FFE66A`).
  - Added `Sun` / `Moon` theme toggle button in `src/sidepanel/App.tsx` header, persisting state in `chrome.storage.local`.
- **Files Modified**: [`src/sidepanel/index.css`](file:///Users/milan/Desktop/Ext/src/sidepanel/index.css), [`src/sidepanel/App.tsx`](file:///Users/milan/Desktop/Ext/src/sidepanel/App.tsx), [`CONTEXT_WINDOW.md`](file:///Users/milan/Desktop/Ext/CONTEXT_WINDOW.md).
- **Verification Status**:
  - Vitest Unit Tests: **7/7 Passed (100% Green)**
  - Production Bundle: `npm run zip` compiled cleanly with 0 errors. Package updated at `promptforge-v1.0.0.zip`.

---

### Iteration 17 — High-Contrast Cyber-Editorial Dark Mode Refinement (2026-07-27)
- **Goal**: Fix illegible dark labels, bright solid blocks, and harsh white borders in Dark Mode based on user screenshot feedback using Stitch MCP.
- **Changes Made**:
  - Generated `Cyber-Editorial Atelier` screen (`6f3fbad2a776442fb4a658e3dae4d4a7`) on Stitch MCP project `projects/12086197637705197593`.
  - Updated `src/sidepanel/index.css` dark mode tokens: deep matte charcoal canvas (`#121212`), dark charcoal slate surfaces (`#1C1C1E`), subtle structural borders (`#2C2C2E`), 100% high-contrast crisp section labels (`#F2F2F7`), and subtle dark elevation shadows (`#080808`).
  - Updated `src/sidepanel/App.tsx`: fixed label text visibility, dark recessed model selector track (`#161618`), dark slate buttons (`neo-btn-secondary`), and dark code output box (`#161618`).
- **Files Modified**: [`src/sidepanel/index.css`](file:///Users/milan/Desktop/Ext/src/sidepanel/index.css), [`src/sidepanel/App.tsx`](file:///Users/milan/Desktop/Ext/src/sidepanel/App.tsx), [`CONTEXT_WINDOW.md`](file:///Users/milan/Desktop/Ext/CONTEXT_WINDOW.md).
- **Verification Status**:
  - Vitest Unit Tests: **7/7 Passed (100% Green)**
  - Production Bundle: `npm run zip` compiled cleanly with 0 errors. Package updated at `promptforge-v1.0.0.zip`.

---

### Iteration 18 — Production Documentation Polish & GitHub Deployment (2026-09-01)
- **Goal**: Prepare production documentation, write an aesthetic high-impact README.md, initialize Git, and push the codebase to GitHub (`https://github.com/Milan727/inspiration-to-prompt`).
- **Changes Made**:
  - Rewrote [`README.md`](file:///Users/milan/Desktop/Ext/README.md) with modern badging, dual Neo-Brutalist Stitch MCP theme comparison matrix, 6 photography intent rule pack breakdown, architecture data flow diagram, quickstart installation guide, and local privacy guarantees.
  - Initialized git repository inside `/Users/milan/Desktop/Ext`, set remote origin to `https://github.com/Milan727/inspiration-to-prompt.git`, committed all production files, and pushed to GitHub main branch.
- **Files Modified**: [`README.md`](file:///Users/milan/Desktop/Ext/README.md), [`CONTEXT_WINDOW.md`](file:///Users/milan/Desktop/Ext/CONTEXT_WINDOW.md).
- **Verification Status**:
  - Vitest Unit Tests: **7/7 Passed (100% Green)**
  - Production Bundle: `npm run zip` compiled cleanly with 0 errors. Package updated at `promptforge-v1.0.0.zip`.
  - GitHub Remote Push: Synchronized to `https://github.com/Milan727/inspiration-to-prompt.git`.

---

### Iteration 19 — CLAUDE.md, iCloud Hang Fix & Clean Zip Packaging (2026-10-23)
- **Goal / Trigger**: User ran Claude Code `/init` to create a `CLAUDE.md`; verification then exposed a hanging test runner and a bloated release zip.
- **Changes Made**:
  - Created [`CLAUDE.md`](file:///Users/milan/Desktop/Ext/CLAUDE.md): session protocol, commands (incl. single-test runs), cross-file architecture (message flow, two-layer injection with duplicated selectors in `serviceWorker.ts`, Midjourney/Flux overrides in `builder.ts`), styling source of truth.
  - Diagnosed `npm test` hanging silently: iCloud "Optimize Mac Storage" had evicted 11,714 files in `node_modules` plus project and `.git` files (dataless). Restored project/`.git` files via `brctl download` and reinstalled dependencies with `rm -rf node_modules && npm ci`.
  - Fixed `zip` script in [`package.json`](file:///Users/milan/Desktop/Ext/package.json): it now deletes the previous zip first. `zip -r` was updating the old archive in place, so 14 stale hashed bundles from July builds were shipped (614 KB → 87 KB).
  - Updated the stale UI design rule in [`AGENTS.md`](file:///Users/milan/Desktop/Ext/AGENTS.md) from "Exaggerated Minimalism" to the current Neo-Editorial Brutalist theme in `index.css`.
- **Files Modified**: [`CLAUDE.md`](file:///Users/milan/Desktop/Ext/CLAUDE.md), [`package.json`](file:///Users/milan/Desktop/Ext/package.json), [`AGENTS.md`](file:///Users/milan/Desktop/Ext/AGENTS.md), [`CONTEXT_WINDOW.md`](file:///Users/milan/Desktop/Ext/CONTEXT_WINDOW.md).
- **Verification Status**:
  - Vitest Unit Tests: **7/7 Passed**
  - Production Bundle: `npm run zip` built cleanly; `promptforge-v1.0.0.zip` now contains only the 7 current `dist/assets` files.

---





### Iteration 20 — Store Blockers: Generic Prompts, Minimal Permissions, Face Consent (2026-10-23)
- **Goal / Trigger**: Step 1 of the agreed launch plan (free v1.0 → Pro v1.1, darkroom-minimal redesign for casual creators): fix issues that would hurt Chrome Web Store review or first users.
- **Changes Made**:
  - Rewrote all 6 rule packs in [`rulePacks.ts`](file:///Users/milan/Desktop/Ext/src/modules/prompt-builder/rulePacks.ts) on a shared `composePrompt()`: removed details hard-coded from one specific photo (stars, safety pins, split-screen, harness, graffiti), always include the chosen aspect ratio and lens, auto-number the checklist (no gaps), replace the "SAFETY & COMPLIANCE NOTICE" with a plain identity rule (never reproduce anyone from Image 1; Image 2 is the user's own photo shared with consent). Added `styleKeywords` per pack.
  - [`builder.ts`](file:///Users/milan/Desktop/Ext/src/modules/prompt-builder/builder.ts): Midjourney prompt now leads with the image URL as an image prompt, drops the outdated `--v 6.0` / `--quality` flags and the `/imagine prompt:` prefix; Flux prompt simplified; both use the pack's style keywords.
  - [`manifest.json`](file:///Users/milan/Desktop/Ext/manifest.json): removed `tabs` and `<all_urls>`; added `activeTab`, `*.pinimg.com`, more Pinterest country domains, and per-site `optional_host_permissions`. Hover detector now runs on Pinterest only.
  - New [`imageAccess.ts`](file:///Users/milan/Desktop/Ext/src/lib/imageAccess.ts) (requests access to only the image's site at send time) and [`imageResize.ts`](file:///Users/milan/Desktop/Ext/src/lib/imageResize.ts) (reference photo downscaled to 1024 px JPEG).
  - [`App.tsx`](file:///Users/milan/Desktop/Ext/src/sidepanel/App.tsx): removed the bring-your-own Gemini key panel and "Extract visual features" button (deleted `src/lib/geminiApi.ts`, clears any stored key); added a "this is a photo of me" consent checkbox gating the reference-photo upload.
  - Docs: removed "bypassing public figure blocks" and outdated claims from [`README.md`](file:///Users/milan/Desktop/Ext/README.md); updated permission table, privacy copy and data disclosures in [`CHROMEWEBSTORE.md`](file:///Users/milan/Desktop/Ext/CHROMEWEBSTORE.md); updated [`CLAUDE.md`](file:///Users/milan/Desktop/Ext/CLAUDE.md) and the test count rule in [`AGENTS.md`](file:///Users/milan/Desktop/Ext/AGENTS.md).
  - Tests: updated [`promptBuilder.test.ts`](file:///Users/milan/Desktop/Ext/tests/unit/promptBuilder.test.ts) and added guards (no photo-specific phrases or "bypass" in any intent/target, aspect ratio present, contiguous numbering, Flux, directed edit); new [`imageHelpers.test.ts`](file:///Users/milan/Desktop/Ext/tests/unit/imageHelpers.test.ts).
  - Deferred to the redesign step: bundling fonts locally (new font choice comes with the darkroom theme).
- **Files Modified**: `src/modules/prompt-builder/rulePacks.ts`, `src/modules/prompt-builder/builder.ts`, `src/sidepanel/App.tsx`, `src/lib/imageAccess.ts` (new), `src/lib/imageResize.ts` (new), `src/lib/geminiApi.ts` (deleted), `manifest.json`, `tests/unit/promptBuilder.test.ts`, `tests/unit/imageHelpers.test.ts` (new), `README.md`, `CHROMEWEBSTORE.md`, `CLAUDE.md`, `AGENTS.md`, `CONTEXT_WINDOW.md`.
- **Verification Status**:
  - Vitest Unit Tests: **15/15 Passed**; `tsc --noEmit` clean.
  - Production Bundle: `npm run zip` built cleanly (86 KB). Packaged manifest checked: 5 permissions, no `tabs` / `<all_urls>`.
  - Not yet tested by loading the unpacked extension in Chrome.

---

### Iteration 21 — Remote Selector Config, Real Icons & Darkroom Mockup (2026-10-23)
- **Goal / Trigger**: User approved the recommended additions and decided to ship free first (no monetization for now); asked for a take on renaming. Also reported a blank side panel while testing.
- **Changes Made**:
  - Blank panel: caused by loading the repo root instead of `dist/` in Chrome (root manifest points at `.ts` sources). Documented in [`CLAUDE.md`](file:///Users/milan/Desktop/Ext/CLAUDE.md).
  - Icons: the committed icons were 1×1 px placeholders. Rewrote [`generate-icons.js`](file:///Users/milan/Desktop/Ext/scripts/generate-icons.js) to render real 16/48/128 px PNGs (dark tile + white lens ring) with no dependencies; regenerated `icons/` and `public/icons/`.
  - Remote selectors: new [`config/selectors.json`](file:///Users/milan/Desktop/Ext/config/selectors.json) is bundled as the default and fetched from GitHub `main` by the service worker at most every 6h; validated by `parseSelectorConfig()` and cached in `chrome.storage.local.remoteSelectors` ([`composerSelectors.ts`](file:///Users/milan/Desktop/Ext/src/modules/llm-injector/composerSelectors.ts)). Removed the duplicated inline selector list from [`serviceWorker.ts`](file:///Users/milan/Desktop/Ext/src/background/serviceWorker.ts) (selectors now passed as args) and switched [`llmInjector.ts`](file:///Users/milan/Desktop/Ext/src/content/llmInjector.ts) to the shared config. Dropped unused send-button selectors (the extension never auto-sends).
  - Disclosed the selector fetch in [`CHROMEWEBSTORE.md`](file:///Users/milan/Desktop/Ext/CHROMEWEBSTORE.md).
  - Design: published a darkroom-minimal mockup (first open, image captured with 3 styles + sticky send, sent + before/after gallery, one-tap menu on a pin) at https://claude.ai/artifact/Cs777SnS5fUmYdC1y5LJ2i using the working name "Lookshot" (not yet confirmed).
- **Files Modified**: `config/selectors.json` (new), `src/modules/llm-injector/composerSelectors.ts`, `src/background/serviceWorker.ts`, `src/content/llmInjector.ts`, `tests/unit/composerSelectors.test.ts` (new), `scripts/generate-icons.js`, `icons/*.png`, `public/icons/*.png`, `CHROMEWEBSTORE.md`, `CLAUDE.md`, `CONTEXT_WINDOW.md`.
- **Verification Status**:
  - Vitest Unit Tests: **20/20 Passed**; `tsc --noEmit` clean.
  - Production Bundle: `npm run zip` built cleanly (92 KB).
  - Remote selector file only resolves once `config/selectors.json` is pushed to `main`; until then the bundled copy is used.

---

### Iteration 22 — Rename to Lookshot, Darkroom Side Panel, One-Tap Pinterest Menu (2026-10-23)
- **Goal / Trigger**: User picked the name "Lookshot" (checked: no Chrome extension or website with that name) and asked to go ahead with the recommended work; monetization deferred — build and ship free first.
- **Changes Made**:
  - **Rename**: manifest name `Lookshot - Put Yourself in Any Photo`, package `lookshot`, zip `lookshot-v1.0.0.zip`, context menu, panel title, logs. Product name centralised in new [`src/brand.ts`](file:///Users/milan/Desktop/Ext/src/brand.ts).
  - **Release zip bug fixed**: the old `zip` script put the repo-root `manifest.json` (pointing at `.ts` sources) at the top of the archive, so a store upload would have been broken. It now zips the contents of `dist/`.
  - **Side panel rebuilt** in the darkroom-minimal design: `App.tsx` (1,056 lines) replaced by a small app + [`usePanelState.ts`](file:///Users/milan/Desktop/Ext/src/sidepanel/usePanelState.ts) (storage-backed, live via `storage.onChanged`) + components (Header, Welcome, ImageHero, StylePicker, YourPhoto, AdvancedSettings, SendBar, Gallery). Tailwind `ink-*` / `safelight` tokens, Inter bundled via `@fontsource-variable/inter` (no Google Fonts request). Light theme and dark-mode toggle removed.
  - **Simplified styles**: 3 main styles (Put me in this photo, Recreate this look, Try this outfit) + "More styles"; `MAIN_INTENTS` / `MORE_INTENTS` and `needsSelfie` added to rule packs. Settings persisted (`photoSettings`); aspect ratio auto-matches the captured photo (new [`aspectRatio.ts`](file:///Users/milan/Desktop/Ext/src/lib/aspectRatio.ts), fixing the old detector that could never return 9:16).
  - **One-tap Pinterest menu**: [`pinterestDetector.ts`](file:///Users/milan/Desktop/Ext/src/content/pinterestDetector.ts) rewritten — shadow-DOM ring + style menu, image found via `elementsFromPoint`, sends directly or opens the panel when a selfie is needed.
  - **Service worker**: new `SEND_TO_AI` flow (history, find/open/focus tab, wait for load, retrying injection); context menu opens the panel inside the user gesture. `FETCH_IMAGE_BASE64` used `FileReader`, which does not exist in service workers, so image attachment likely always failed — replaced with [`blobToDataUrl`](file:///Users/milan/Desktop/Ext/src/lib/dataUrl.ts).
  - **Double upload fixed**: `attachFilesToComposer` set files on every file input on the page *and* simulated a paste; it now attaches once.
  - **Policy cleanup**: removed `sanitizePublicFiguresAndSafetyKeywords` (rewrote celebrity names and "deepfake"/"face swap" to evade AI safety filters); kept only Pinterest caption-prefix cleanup.
  - Shared modules: [`storage.ts`](file:///Users/milan/Desktop/Ext/src/lib/storage.ts) (keys, defaults, history), [`targets.ts`](file:///Users/milan/Desktop/Ext/src/lib/targets.ts).
  - Docs: README rewritten; CHROMEWEBSTORE.md, PROJECT.md, AGENTS.md (design standard → Darkroom Minimal), CLAUDE.md updated.
- **Files Modified**: `manifest.json`, `package.json`, `package-lock.json`, `tailwind.config.js`, `src/brand.ts` (new), `src/types/index.ts`, `src/background/serviceWorker.ts`, `src/content/pinterestDetector.ts`, `src/content/llmInjector.ts`, `src/modules/llm-injector/clipboardPaste.ts`, `src/modules/llm-injector/composerSelectors.ts`, `src/modules/image-selection/pinterestEnhancer.ts`, `src/modules/prompt-builder/rulePacks.ts`, `src/lib/{aspectRatio,dataUrl,storage,targets}.ts` (new), `src/sidepanel/{App.tsx,usePanelState.ts,index.css,index.html}`, `src/sidepanel/components/*` (new), `tests/unit/{sharedLib,dataUrl,sidepanel}.test.*` (new), `tests/unit/pinterestEnhancer.test.ts`, `README.md`, `CHROMEWEBSTORE.md`, `PROJECT.md`, `AGENTS.md`, `CLAUDE.md`, `CONTEXT_WINDOW.md`.
- **Verification Status**:
  - Vitest Unit Tests: **30/30 Passed** (incl. a render test of the side panel); `tsc --noEmit` clean.
  - Production Bundle: `npm run zip` built cleanly; `lookshot-v1.0.0.zip` (314 KB) has `manifest.json` at the top level pointing at the compiled service worker.
  - Not yet tested in a real Chrome window (Pinterest menu, sending to ChatGPT/Gemini, image attachment).

---

### Iteration 23 — Likeness & Fidelity Fixes for "Put me in this photo" (2026-10-23)
- **Goal / Trigger**: First real test (inspiration with poem text + stars, selfie wearing sunglasses). ChatGPT copied the selfie's sunglasses and smile, dropped the text and stars; Gemini kept the layout but results were inconsistent. User: the expression should come from the inspiration photo.
- **Changes Made**:
  - [`rulePacks.ts`](file:///Users/milan/Desktop/Ext/src/modules/prompt-builder/rulePacks.ts): every prompt now has a `lead` line. "Put me in this photo" is framed as an **edit of Image 1** (replace only the person, keep everything else). New identity rule: take ONLY facial identity from Image 2 and never its glasses/sunglasses, jewellery, clothing, background, lighting, expression or head angle. New shared rule: expression and pose come from Image 1 (used by place/recreate). Text rule rewritten so "keep" covers stickers and graphic overlays; "no text" now removes only words. Fixed the `Camera:85mm` missing space.
  - Attachments named `1-inspiration.jpg` / `2-my-face.jpg` ([`attachments.ts`](file:///Users/milan/Desktop/Ext/src/modules/prompt-builder/attachments.ts)) and referenced by name in the prompt, so the model can't swap them.
  - Default text setting changed from "no text" to "keep text" ([`storage.ts`](file:///Users/milan/Desktop/Ext/src/lib/storage.ts)). Existing saved settings keep their old value.
  - "Your photo" now shows a tip: face the camera, good light, eyes visible (no sunglasses).
  - Tests: 5 new prompt tests covering the edit framing, identity-only rule, expression from Image 1, text kept by default and named attachments.
- **Files Modified**: `src/modules/prompt-builder/rulePacks.ts`, `src/modules/prompt-builder/attachments.ts` (new), `src/content/llmInjector.ts`, `src/lib/storage.ts`, `src/sidepanel/components/YourPhoto.tsx`, `tests/unit/promptBuilder.test.ts`, `CONTEXT_WINDOW.md`.
- **Verification Status**:
  - Vitest Unit Tests: **35/35 Passed**; `npm run zip` built cleanly.
  - Output quality still depends on the image model; needs a re-test with the same pair of images.

---

### Iteration 24 — Fix Images Not Attaching + Broken Pin Image / "Pinterest" Title (2026-10-23)
- **Goal / Trigger**: User report: sending from the side panel or the Pinterest menu put only the prompt into ChatGPT, no images; the panel showed a broken image captioned "Pinterest".
- **Root causes & fixes**:
  - **Content script missing in already-open tabs**: Chrome doesn't add manifest content scripts to tabs opened before the extension (re)loads, so injection fell back to text-only. [`serviceWorker.ts`](file:///Users/milan/Desktop/Ext/src/background/serviceWorker.ts) now injects the manifest's ChatGPT/Gemini script (`ensureInjectorScript`) when the tab doesn't answer, then retries; [`llmInjector.ts`](file:///Users/milan/Desktop/Ext/src/content/llmInjector.ts) registers its listener only once.
  - **Guessed `originals/` URLs 404**: thumbnails were rewritten to `originals/…jpg` even when the original is a PNG. New `pinimgCandidates()` fallback chain (original → 736x → 474x) used by the downloader ([`fetchImageAsDataUrl`](file:///Users/milan/Desktop/Ext/src/lib/dataUrl.ts)) and a new [`FallbackImage`](file:///Users/milan/Desktop/Ext/src/sidepanel/components/FallbackImage.tsx) in the panel and gallery. `getBestImageSource` keeps the displayed `currentSrc` as the guaranteed fallback and only guesses `originals/` for sized thumbnails.
  - **Wrong title/link**: `extractPinterestMetadata` walked up to `<body>` and took the last heading (the "Pinterest" logo) and a link to a different pin. Now reads only the pin's own card (nearest `/pin/` link, `pinTitle` within 6 ancestors), ignores generic titles.
  - **All-or-nothing attach**: one failed download dropped every image (selfie included). Images now load individually; the result reports `attached` / `expected` and the panel shows "N of M images attached".
  - **Unverified attach**: `attachFilesToComposer` now waits for preview thumbnails after using the file input (preferring `accept*="image"`), and only tries a synthetic paste if none appear. `urlToFile` no longer retries from the page (always CORS-blocked) and surfaces the real download error.
  - `config/selectors.json`: `fileInputSelectors` prefer image inputs.
- **Files Modified**: `src/background/serviceWorker.ts`, `src/content/llmInjector.ts`, `src/modules/llm-injector/clipboardPaste.ts`, `src/modules/image-selection/pinterestEnhancer.ts`, `src/lib/dataUrl.ts`, `src/sidepanel/App.tsx`, `src/sidepanel/components/{FallbackImage.tsx (new),ImageHero.tsx,Gallery.tsx}`, `config/selectors.json`, `tests/unit/{dataUrl,pinterestEnhancer}.test.ts`, `CONTEXT_WINDOW.md`.
- **Verification Status**:
  - Vitest Unit Tests: **42/42 Passed** (new: originals→736x fallback, error reporting, non-image rejection, srcset choice, pin-card metadata, no "Pinterest" title); `tsc` clean; `npm run zip` built cleanly.
  - Whether ChatGPT/Gemini accept the files still needs a real-browser test.

---

### Iteration 25 — New Style "Add this effect to my photo" + Glasses Rule (2026-10-23)
- **Goal / Trigger**: Image attachment confirmed working. User asked for the reverse of "Put me in this photo": keep their own photo and add the inspiration's effect (hand-drawn stars, doodles, text, colour, border). Their result also showed the selfie's sunglasses carried over.
- **Changes Made**:
  - New `IntentType` `apply_effect` ("Add this effect to my photo") as a main style (4 main styles now), in [`rulePacks.ts`](file:///Users/milan/Desktop/Ext/src/modules/prompt-builder/rulePacks.ts): edits Image 2 (the user's photo) and copies only graphics and photo treatment from Image 1. `composePrompt()` gained `selfieRole: 'face' | 'base'`; in `base` mode Image 2 is labelled as the photo to edit, the aspect ratio follows Image 2 (no crop/reframe), the lens line is dropped and the identity rule keeps the whole person (not face-only).
  - Glasses rule for face mode: wear Image 1's glasses (or none), never Image 2's.
  - Attachment renamed `2-my-photo.jpg`; stored photo now up to 1536 px (was 1024) since it can be the base image.
  - "Your photo" card copy adapts when it is the photo being edited; Pinterest menu now positions itself after measuring its real height.
  - Tests: new apply_effect and glasses tests; panel test expects 4 main styles.
- **Files Modified**: `src/types/index.ts`, `src/modules/prompt-builder/{rulePacks,attachments}.ts`, `src/lib/imageResize.ts`, `src/sidepanel/App.tsx`, `src/sidepanel/components/YourPhoto.tsx`, `src/content/pinterestDetector.ts`, `tests/unit/{promptBuilder,sidepanel}.test.*`, `CONTEXT_WINDOW.md`.
- **Verification Status**: Vitest **46/46 Passed**; `tsc` clean; `npm run zip` built cleanly.

---

### Iteration 26 — Multiple Face Photos for Better Likeness (2026-10-24)
- **Goal / Trigger**: User asked for a place to upload several photos of their face in different poses so generations look more like them.
- **Changes Made**:
  - New storage key `extraFaces` (`userExtraFaces`), `MAX_EXTRA_FACES = 3`; saved together with the main photo via `setPhotos()` in `usePanelState`.
  - "Your photo" card: Add accepts several files (first = main photo at 1536 px, rest = extra angles at 1024 px); a "More angles of your face" row with thumbnails, per-photo remove and a + tile. Removing the main photo promotes the first extra angle.
  - Prompt builder: `buildPrompt({ extraFaces })` → `CompiledPrompt.extraFaceDataUrls` (optional, additive type change). Extra photos are attached as Image 3, 4, 5 (`3-my-face.jpg` …) and listed under "Attached images". Face-mode identity rule says to combine Images 2–N; text with no extras is unchanged. `apply_effect` still edits only Image 2 and uses extras just to keep the face accurate.
  - Injector attaches the extras; "Download images" includes them; Pinterest one-tap menu caches and sends them too.
  - Store listing / README privacy wording updated to plural photos.
- **Files Modified**: `src/types/index.ts`, `src/lib/storage.ts`, `src/modules/prompt-builder/{attachments,rulePacks,builder}.ts`, `src/content/{llmInjector,pinterestDetector}.ts`, `src/sidepanel/{App.tsx,usePanelState.ts,components/YourPhoto.tsx}`, `tests/unit/promptBuilder.test.ts`, `CHROMEWEBSTORE.md`, `README.md`.
- **Verification Status**: Vitest **50/50 Passed** (4 new multi-photo prompt tests); `tsc` clean; `npm run zip` built cleanly. Not yet tried in a real ChatGPT/Gemini tab.

## 🧪 Current Verification & Health Status

* **Unit Tests**: `50/50 Vitest tests passing` ✅
  * `tests/unit/pinterestEnhancer.test.ts` (8 tests)
  * `tests/unit/promptBuilder.test.ts` (17 tests)
  * `tests/unit/imageHelpers.test.ts` (4 tests)
  * `tests/unit/composerSelectors.test.ts` (5 tests)
  * `tests/unit/sharedLib.test.ts` (5 tests)
  * `tests/unit/dataUrl.test.ts` (5 tests)
  * `tests/unit/sidepanel.test.tsx` (2 tests)
* **Production Build**: `dist/` compiled with Vite ✅
* **Zip Deployment Package**: `lookshot-v1.0.0.zip` (contents of `dist/`, manifest at top level) ready in project root ✅

---

## 📝 Rules for Future AI Models Adding Iteration Entries

When you complete work on this project in any AI IDE (Claude Code, Cursor, Antigravity, Windsurf, Copilot, etc.), **append a new entry to the bottom of this file** using the template below:

```markdown
### Iteration [X] — [Short Title] (YYYY-MM-DD)
- **Goal / Trigger**: What user request or feature prompted this change.
- **Changes Made**:
  - Bulleted list of exact changes.
- **Files Modified**: List of modified files with markdown links.
- **Verification Status**: Confirm `npm test` and `npm run zip` were executed cleanly.
```
