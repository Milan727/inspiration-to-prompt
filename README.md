# ✦ PromptForge — Inspiration to AI Photoshoot Prompt Engine

<div align="center">

![Manifest V3](https://img.shields.io/badge/Manifest-V3-black?style=for-the-badge&logo=googlechrome&logoColor=white)
![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-7%2F7_Passed-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)
![Stitch MCP](https://img.shields.io/badge/Design-Stitch_MCP-FF5252?style=for-the-badge)

<p align="center">
  <b>Convert Pinterest pins and web inspiration photos into structured, zero-cost multimodal photoshoot prompts for ChatGPT, Gemini Advanced, Midjourney, and Flux.1.</b>
</p>

</div>

---

## 🌟 Product Overview

**PromptForge** (formerly *Inspiration to Prompt*) is a Manifest V3 Chrome Extension engineered for creators, photographers, AI artists, and Pinterest inspiration seekers. It bridges web visual discovery with generative AI models without incurring mandatory API costs or subscription fees.

By hovering over any Pinterest pin or web photo, PromptForge extracts image metadata, upscales CDN resolution, applies photography rule packs, enforces an 8-Point Visual Feature Checklist, and injects compiled prompts directly into open **ChatGPT** or **Gemini Advanced** sessions.

---

## 🎨 Dual Neo-Brutalist Design System (Powered by Google Stitch MCP)

PromptForge features a bespoke **Neo-Editorial Brutalist** interface inspired by [YouMind.com/prompts](https://youmind.com/prompts) and crafted using Google's **Stitch MCP** server.

| Theme | Aesthetic Character | Highlights |
| :--- | :--- | :--- |
| ☀️ **Warm Paper Light Mode** | Neo-Editorial Broadside | Warm parchment background (`#FFF8F2`), crisp 2px dark charcoal ink borders (`#211D16`), Sunshine Yellow (`#FFE66A`) status badges, and Coral Red (`#FF6B6B`) CTAs. |
| 🌙 **Obsidian Editorial Dark Mode** | Cyber-Editorial Atelier | Deep matte charcoal canvas (`#121212`), warm obsidian surfaces (`#1C1C1E`), 100% high-contrast crisp white section labels (`#F2F2F7`), and Electric Yellow (`#FFD60A`) accent tags. |

*Switch between light and dark themes seamlessly with the sleek ☀️/🌙 header button.*

---

## 📸 6 Photography Intent Rule Packs

PromptForge structures prompts around professional studio and editorial photography principles:

1. **📸 Recreate Scene**: Replicas visual composition, camera perspective, lighting, color grading, and mood.
2. **👤 Place My Face**: Identity compositing replacing Image 1's subject with the user's reference selfie (Image 2).
3. **👗 Fashion & Outfit Transfer**: Garment tailoring, fabric textures, folds, and high-fashion editorial styling.
4. **🎞️ Pro Portrait (LinkedIn)**: Studio 3-point lighting, 85mm f/1.4 prime lens bokeh, and professional headshots.
5. **🌅 Travel & Outdoor Lifestyle**: 35mm wide lens, golden hour sun flares, and candid natural storytelling.
6. **🎨 Directed Custom Edit**: User-customized modification overlay layer.

---

## 🛠️ Master Architecture & Data Flow

```
[ Pinterest Pin / Web Image ]
              │
              ▼
[ content/pinterestDetector.ts ] ─────── (Floating "Forge Prompt" Badge & High-Res Upscaler)
              │
              ▼
[ background/serviceWorker.ts ] ──────── (State Persistence via chrome.storage.local)
              │
              ▼
[ sidepanel/App.tsx ] ────────────────── (React 19 Side Panel Atelier UI)
   ├── Model Selector (Gemini / ChatGPT / Midjourney / Flux)
   ├── Reference Pin & Face Selfie Input
   ├── Intent Rule Pack & 8-Point Visual Checklist
   └── Fine-Tuning Controls (Aspect Ratio, Lens, Text Overlay, Custom Directive)
              │
              ▼
[ modules/prompt-builder/builder.ts ] ── (Compiles 8-Point Checklist + Public Figure Safeguard)
              │
              ▼
[ content/llmInjector.ts ] ───────────── (Synthetic DOM Injection & Clipboard Paste Event)
```

---

## ⚙️ Target Model Formatting Support

PromptForge formats prompts specifically for each model's prompt parser:

* **Gemini Advanced**: Enforces `[SAFETY & COMPLIANCE NOTICE]` instructing Gemini that attached reference images are for layout/style guidance only, bypassing public figure blocks.
* **ChatGPT (GPT-4o)**: Generates structured multimodal instructions with explicit breakdown of subject, lighting, background, and identity placement.
* **Midjourney v6.0**: Outputs ready-to-run commands: `/imagine prompt: ... --ar 4:5 --v 6.0 --style raw`.
* **Flux.1**: Formats photorealistic master prompts targeting Flux Dev and Schnell models.

---

## 🚀 Quickstart & Installation Guide

### Prerequisites
* Node.js v18+ & `npm`

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Milan727/inspiration-to-prompt.git
cd inspiration-to-prompt
npm install
```

### 2. Run Test Suite
```bash
npm test
```
*Executes Vitest unit tests for Pinterest resolution upscaler & prompt compiler engine (7/7 green).*

### 3. Build Production Extension
```bash
npm run build
```
*Or run `npm run zip` to generate the release bundle `promptforge-v1.0.0.zip`.*

### 4. Load Unpacked Extension in Chrome
1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle switch).
3. Click **Load unpacked**.
4. Select the `dist/` directory inside this project folder.

---

## 📁 Repository Structure

```
.
├── AGENTS.md                            # Global AI agent operating rules & mandatory session logging
├── CONTEXT_WINDOW.md                    # Master project lineage & 18-iteration development logs
├── CHROMEWEBSTORE.md                    # Web Store developer listing, permission justifications, privacy policy
├── PROJECT.md                           # System architecture overview
├── README.md                            # Developer quickstart & documentation (THIS FILE)
├── manifest.json                        # Chrome Extension MV3 manifest configuration
├── package.json                         # Build scripts, Vitest runner, dependencies
├── tailwind.config.js                   # Tailwind CSS configuration
├── tsconfig.json                        # TypeScript compiler config
├── vite.config.ts                       # Vite bundler configuration for MV3 extension
├── src/
│   ├── background/
│   │   └── serviceWorker.ts             # Service worker, side panel toggle & storage listeners
│   ├── content/
│   │   ├── pinterestDetector.ts         # Image hover badge overlay & high-res resolution upscaler
│   │   └── llmInjector.ts               # Synthetic DOM composer injector for chatgpt.com & gemini.google.com
│   ├── lib/
│   │   └── geminiApi.ts                 # Optional Gemini 1.5 Flash Vision feature extraction API
│   ├── modules/
│   │   ├── image-selection/
│   │   │   └── pinterestEnhancer.ts     # Keyless DOM scraper for pin titles, descriptions & tags
│   │   ├── llm-injector/
│   │   │   ├── clipboardPaste.ts        # Synthetic clipboard paste event simulator & image downloader
│   │   │   └── composerSelectors.ts     # DOM input field selectors for ChatGPT & Gemini
│   │   └── prompt-builder/
│   │       ├── builder.ts               # Prompt compiler engine with MJ / Flux / ChatGPT / Gemini formatters
│   │       └── rulePacks.ts             # 6 Photography Rule Packs & Mandatory 8-Point Visual Checklist
│   └── sidepanel/
│       ├── App.tsx                      # React 19 Neo-Brutalist Atelier Side Panel UI
│       ├── main.tsx                     # React DOM root entry point
│       └── index.css                    # Design tokens, light & obsidian dark mode themes, scrollbars
└── tests/
    └── unit/
        ├── pinterestEnhancer.test.ts    # Vitest tests for Pinterest resolution upscaler & metadata extraction
        └── promptBuilder.test.ts        # Vitest tests for prompt compiler engine
```

---

## 🔒 Security & Privacy Guarantee

* **100% Local Execution**: PromptForge operates client-side inside your browser extension sandbox.
* **No Mandatory Paid APIs**: Does not require any API keys or subscription services to operate.
* **Zero Tracking**: Transmits no telemetry or image data to external servers.

---

## 📜 License & Credits

Built with ❤️ by [Milan727](https://github.com/Milan727). Designed with Google Stitch MCP.
