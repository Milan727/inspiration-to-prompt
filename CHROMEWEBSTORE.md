# PromptForge — Chrome Web Store Developer Listing

> **Single Source of Truth for Chrome Web Store Developer Dashboard Submission**
> Last Updated: 2026-07-26
> Version: 1.0.0

---

## 1. Store Metadata

* **Extension Name**: `PromptForge - AI Photoshoot & Prompt Builder`
* **Short Name**: `PromptForge`
* **Summary (132 chars max)**: `Transform Pinterest & web photos into detailed AI prompts and inject them directly into ChatGPT & Gemini for instant image generation.`
* **Category**: `Productivity` / `Photos`
* **Language**: `English (United States)`

---

## 2. Detailed Description (Store Copy)

```markdown
Turn any Pinterest or web image into a stunning AI photoshoot — with zero prompt writing and zero API subscription costs.

Found an incredible portrait, fashion editorial, lifestyle shot, or graphic aesthetic on Pinterest or anywhere on the web? PromptForge replaces the tedious manual workflow (save image → open ChatGPT/Gemini → type detailed prompt → upload photo → tweak instructions) with a single click.

✨ KEY FEATURES:

1. 1-Click Hover Badge & Context Menu
   Hover over any image on Pinterest or right-click any image across the web to capture high-resolution source photos instantly.

2. 6 Photography Intent Rule Packs
   • Recreate Scene: Direct match of background, lighting contrast, color palette, camera optics & depth of field.
   • Place My Face: Seamlessly swap your face selfie into the inspiration scene, outfit, and atmosphere.
   • Fashion & Outfit: Transfer garment physics, wool/leather textures, and high-fashion editorial styling.
   • Pro Portrait (LinkedIn): Studio 3-point lighting headshots with clean executive corporate bokeh.
   • Travel & Lifestyle: Filmic Kodak Portra color grading, candid emotion, and wide 35mm environmental framing.
   • Directed Edit: Combine free-text custom directives with reference image aesthetics.

3. Mandatory 8-Point Visual Feature Checklist
   Automatically itemizes split backgrounds, headwear, safety pins, pin badges, floating graphic stickers, shoulder harness buckles, wall art/graffiti, and camera optics into structured prompts.

4. Seamless LLM Injector (ChatGPT & Gemini)
   Directly pastes structured prompts and attaches inspiration + face reference photos into active chatgpt.com or gemini.google.com browser tabs without requiring API keys or paid subscriptions.

5. Fine-Tuning & Typography Control
   Customize aspect ratio (4:5, 9:16, 1:1, 16:9, 3:2), camera lens (35mm, 50mm, 85mm, 135mm), and text overlays (Keep original image text, custom text, or clean photo).

🔒 PRIVACY & ZERO-COST GUARANTEE:
PromptForge runs 100% locally inside your browser. No personal photos, face reference images, or prompt data are ever sent to external servers or logged. PromptForge directly leverages your own existing ChatGPT or Gemini web subscriptions.
```

---

## 3. Permissions Justifications for Chrome Web Store Reviewers

| Permission | Scope | Plain-English Justification for CWS Review Team |
|---|---|---|
| `sidePanel` | Extension UI | Displays the PromptForge interactive side panel where users select photography intents, upload face reference photos, and fine-tune prompt settings. |
| `storage` | Local Browser Storage | Saves user photography preferences (aspect ratio, target LLM) and local reference selfie data URL inside `chrome.storage.local`. |
| `tabs` | Active Browser Tabs | Required to detect open `chatgpt.com` or `gemini.google.com` tabs and focus or inject prompts into the active tab. |
| `scripting` | DOM Scripting | Fallback mechanism to inject structured text prompts into ChatGPT (`#prompt-textarea`) and Gemini (`rich-textarea`) when content scripts are initializing. |
| `contextMenus` | Right-Click Menu | Adds "Send image to PromptForge" item to right-click context menu on images across the web. |
| `host_permissions` (`*://*.pinterest.*`) | Website Access | Enables hover detection badge and high-resolution original image URL extraction (`pinimg.com/originals/`) on Pinterest. |
| `host_permissions` (`*://chatgpt.com/*`, `*://gemini.google.com/*`) | Target AI Sites | Enables automatic text and file injection into ChatGPT and Gemini web composers. |
| `host_permissions` (`<all_urls>`) | Universal Web Access | Allows right-clicking and converting images on any public website into reference base64 data URLs for AI injection. |

---

## 4. Privacy & Data Disclosures

* **Single Purpose**: Transform web images into structured multimodal prompts and inject them into AI model chat interfaces.
* **Data Collection**: `No data collected`. No analytics, no remote server tracking, no user account creation.
* **Data Storage**: All user settings and reference photos remain strictly on the user's device inside Chrome local extension storage (`chrome.storage.local`).
* **Remote Code**: `No remote code`. All JavaScript is bundled locally in compliance with Manifest V3.

---

## 5. Required Store Promotional Assets

* **Extension Icons**:
  - `icons/icon-16.png` (16×16 px)
  - `icons/icon-48.png` (48×48 px)
  - `icons/icon-128.png` (128×128 px)
* **Store Screenshots** (1280×800 px or 640×400 px):
  1. *Screenshot 1*: Pinterest page with "Forge Prompt" hover badge and PromptForge Side Panel active.
  2. *Screenshot 2*: 6 Intent Rule Packs & Photography Fine-Tuning controls.
  3. *Screenshot 3*: ChatGPT / Gemini tab showing injected prompt + attached reference images rendering the final generated photo.
* **Promotional Tile** (Optional): 440×280 px PNG.

---

## 6. Pre-Submission Package Checklist

- [x] Manifest V3 compliance verified.
- [x] All icon PNG files present at exact pixel dimensions.
- [x] No `eval()` or remote script loading.
- [x] `npm test` passing (7/7 unit tests green).
- [x] `npm run zip` command creates `promptforge-v1.0.0.zip` ready for upload.
