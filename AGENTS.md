# AGENTS.md — Global AI Agent Operating Rules & Instructions

> **MANDATORY DIRECTIVE FOR ALL AI ASSISTANTS (Claude, Cursor, Antigravity, Windsurf, Copilot, ChatGPT, etc.)**  
> Read this file AND `CONTEXT_WINDOW.md` at the start of EVERY session before reading or modifying code.

---

## 🛑 REQUIRED AGENT PROTOCOL

Whenever working on this codebase, you **MUST** strictly adhere to the following workflow:

### 1. START OF SESSION (Context Restoration)
1. **Read `CONTEXT_WINDOW.md` FIRST**: Inspect the latest iteration entry and project status in [CONTEXT_WINDOW.md](file:///Users/milan/Desktop/Ext/CONTEXT_WINDOW.md) to understand current progress, active state, architectural decisions, and recent changes.
2. **Never Infer or Hallucinate**: Verify exact symbol definitions, types, component props, and file paths against active source code before writing or editing code.

### 2. DURING DEVELOPMENT (Execution Rules)
1. **Preserve Architectural Contracts**: Do not break existing types in `src/types/index.ts` or prompt compilation logic in `src/modules/prompt-builder/`.
2. **UI Design Standards**: Adhere to the established **Exaggerated Minimalism** theme (monochrome dark `#111` background, `#161616` surface, `#222` border, Inter font, no gradients, tactile `scale(0.96)` press states).
3. **No Symptom Masking**: Never suppress errors, wrap broken functions in silent try/catches without tracebacks, or delete failing tests.

### 3. END OF SESSION (Mandatory History & Context Update)
Before concluding your turn or declaring a task complete, you **MUST**:
1. **Run Verification Commands**:
   ```bash
   npm test
   npm run zip
   ```
   Confirm that all unit tests pass (7/7 green) and `promptforge-v1.0.0.zip` compiles cleanly.
2. **Update `CONTEXT_WINDOW.md`**:
   Append a new numbered **Iteration Entry** to the bottom of [CONTEXT_WINDOW.md](file:///Users/milan/Desktop/Ext/CONTEXT_WINDOW.md) using the required format:
   ```markdown
   ### Iteration [X] — [Title / Summary of Changes] (YYYY-MM-DD)
   - **Goal / Trigger**: User request or feature requirement.
   - **Changes Made**: Detailed breakdown of modifications across files.
   - **Files Modified**: Bulleted list of clickable file paths.
   - **Verification Status**: Test suite & build execution results.
   ```
3. **Preserve Past History**: Never delete previous iteration logs in `CONTEXT_WINDOW.md` — only append new entries to maintain complete project lineage.

---

## 📁 Quick Reference Links
* 📜 **Master Context & Iteration History**: [CONTEXT_WINDOW.md](file:///Users/milan/Desktop/Ext/CONTEXT_WINDOW.md)
* 🚀 **Chrome Web Store Listing Copy**: [CHROMEWEBSTORE.md](file:///Users/milan/Desktop/Ext/CHROMEWEBSTORE.md)
* 🛠️ **Project System Architecture**: [PROJECT.md](file:///Users/milan/Desktop/Ext/PROJECT.md)
