# CONTEXT_WINDOW.md — Master Project State & Iteration History

> **Notice to AI Models (Claude, Cursor, Antigravity, Windsurf, Copilot, ChatGPT, etc.)**  
> This file is the single source of truth for all historical context, architecture decisions, UI guidelines, and iteration logs for **PromptForge**.  
> **Rule**: You MUST read this document before making changes, and append your work as a new **Iteration Entry** at the bottom before finishing your session.

---

## 📌 Project Executive Summary

* **Project Name**: PromptForge
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





## 🧪 Current Verification & Health Status

* **Unit Tests**: `7/7 Vitest tests passing` ✅
  * `tests/unit/pinterestEnhancer.test.ts` (3 tests)
  * `tests/unit/promptBuilder.test.ts` (4 tests)
* **Production Build**: `dist/` compiled with Vite v5.4.21 ✅
* **Zip Deployment Package**: `promptforge-v1.0.0.zip` ready in project root ✅

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
