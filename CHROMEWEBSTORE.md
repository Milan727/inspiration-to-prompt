# Lookshot — Chrome Web Store Developer Listing

> **Single Source of Truth for Chrome Web Store Developer Dashboard Submission**
> Last Updated: 2026-07-26
> Version: 1.0.0

---

## 1. Store Metadata

* **Extension Name**: `Lookshot - Put Yourself in Any Photo`
* **Short Name**: `Lookshot`
* **Summary (132 chars max)**: `Transform Pinterest & web photos into detailed AI prompts and inject them directly into ChatGPT & Gemini for instant image generation.`
* **Category**: `Productivity` / `Photos`
* **Language**: `English (United States)`

---

## 2. Detailed Description (Store Copy)

```markdown
Turn any Pinterest or web image into a stunning AI photoshoot — with zero prompt writing and zero API subscription costs.

Found an incredible portrait, fashion editorial, lifestyle shot, or graphic aesthetic on Pinterest or anywhere on the web? Lookshot replaces the tedious manual workflow (save image → open ChatGPT/Gemini → type detailed prompt → upload photo → tweak instructions) with a single click.

✨ KEY FEATURES:

1. One Tap on Pinterest, Right-Click Anywhere
   Hover any Pinterest pin and tap the ring to pick a style, or right-click any image on the web.

2. Simple Styles
   • Put me in this photo: you, in the exact shot you found.
   • Recreate this look: same scene, light and mood.
   • Try this outfit: the clothes and styling, on you.
   • More styles: Pro headshot, Travel shot, and Your own edit.

3. Structured Visual Checklist
   Every prompt walks the AI through composition, styling, setting, pose, light and mood, so the result actually looks like your inspiration.

4. Seamless LLM Injector (ChatGPT & Gemini)
   Directly pastes structured prompts and attaches inspiration + face reference photos into active chatgpt.com or gemini.google.com browser tabs without requiring API keys or paid subscriptions.

5. Fine-Tuning & Typography Control
   Customize aspect ratio (4:5, 9:16, 1:1, 16:9, 3:2), camera lens (35mm, 50mm, 85mm, 135mm), and text overlays (Keep original image text, custom text, or clean photo).

🔒 PRIVACY & ZERO-COST GUARANTEE:
Lookshot builds prompts locally inside your browser and has no servers of its own. Your photos and prompts are only sent where you send them: into the ChatGPT or Gemini tab you choose, using your own account. Your reference photos stay on your device until you remove them.
```

---

## 3. Permissions Justifications for Chrome Web Store Reviewers

| Permission | Scope | Plain-English Justification for CWS Review Team |
|---|---|---|
| `sidePanel` | Extension UI | Displays the Lookshot interactive side panel where users select photography intents, upload face reference photos, and fine-tune prompt settings. |
| `storage` | Local Browser Storage | Saves user preferences (aspect ratio, target AI), prompt history, and the user's own reference photos (one main photo downscaled to 1536 px, plus up to 3 extra face angles at 1024 px) inside `chrome.storage.local`. |
| `scripting` | DOM Scripting | Fallback mechanism to insert the prompt text into the ChatGPT / Gemini message box when the content script has not finished loading. |
| `contextMenus` | Right-Click Menu | Adds a "Send image to Lookshot" item to the right-click menu on images, so users can capture images from any site without Lookshot needing access to every site. |
| `activeTab` | Current Tab Only | Lets the right-click capture read the current tab's title and URL (used as the image's caption and source link) only after the user invokes the menu item. |
| `host_permissions` (Pinterest domains) | Website Access | Shows the "Forge Prompt" hover button on Pinterest images and finds the highest-resolution version of a pin. |
| `host_permissions` (`*://*.pinimg.com/*`) | Pinterest Image CDN | Downloads the selected Pinterest image so it can be attached to the user's ChatGPT / Gemini message. |
| `host_permissions` (`chatgpt.com`, `gemini.google.com`) | Target AI Sites | Inserts the prompt text and attaches the images in the ChatGPT and Gemini message box. |
| `optional_host_permissions` (`https://*/*`, `http://*/*`) | Requested Per Site, At Runtime | Not granted at install. When a user sends an image captured from a non-Pinterest site, Lookshot asks for access to **that image's site only** so it can download and attach it. If declined, only the text prompt is sent. |

---

## 4. Privacy & Data Disclosures

* **Single Purpose**: Transform web images into structured multimodal prompts and inject them into AI model chat interfaces.
* **Data Collection**: `No data collected` by the developer. No analytics, no developer servers, no user accounts. Images and prompts are transferred only to the ChatGPT / Gemini tab the user chooses, at the user's request.
* **Data Storage**: All user settings and the reference photos remain on the user's device inside Chrome local extension storage (`chrome.storage.local`). Uploading reference photos requires the user to confirm they are photos of themselves.
* **Remote Code**: `No remote code`. All JavaScript is bundled locally in compliance with Manifest V3. The only remote fetch is a JSON list of CSS selectors for the ChatGPT / Gemini message box (`config/selectors.json` on GitHub, checked at most every 6 hours). It is validated as plain data, never executed, and the bundled copy is used if it is missing or invalid.

---

## 5. Required Store Promotional Assets

* **Extension Icons**:
  - `icons/icon-16.png` (16×16 px)
  - `icons/icon-48.png` (48×48 px)
  - `icons/icon-128.png` (128×128 px)
* **Store Screenshots** (1280×800 px or 640×400 px):
  1. *Screenshot 1*: Pinterest page with ring button with style menu and Lookshot Side Panel active.
  2. *Screenshot 2*: 6 Intent Rule Packs & Photography Fine-Tuning controls.
  3. *Screenshot 3*: ChatGPT / Gemini tab showing injected prompt + attached reference images rendering the final generated photo.
* **Promotional Tile** (Optional): 440×280 px PNG.

---

## 6. Pre-Submission Package Checklist

- [x] Manifest V3 compliance verified.
- [x] All icon PNG files present at exact pixel dimensions.
- [x] No `eval()` or remote script loading.
- [x] `npm test` passing (7/7 unit tests green).
- [x] `npm run zip` command creates `lookshot-v1.0.0.zip` ready for upload.
