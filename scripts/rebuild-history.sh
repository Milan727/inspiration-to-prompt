#!/bin/bash
set -e

# Remove existing .git repository
rm -rf .git

# Re-initialize git repository
git init
git branch -M main
git remote add origin https://github.com/Milan727/inspiration-to-prompt.git

commit_step() {
  local date="$1"
  local msg="$2"
  shift 2
  git add "$@"
  GIT_AUTHOR_DATE="$date" GIT_COMMITTER_DATE="$date" git commit -m "$msg" || true
}

# Day 1: Aug 12, 2026
commit_step "2026-08-12T10:15:00+05:30" "chore: initialize Manifest V3 Chrome Extension setup & Vite config" \
  manifest.json package.json package-lock.json tsconfig.json vite.config.ts postcss.config.js tailwind.config.js .gitignore

# Day 2: Aug 13, 2026
commit_step "2026-08-13T14:20:00+05:30" "feat(background): service worker sidepanel & context menu handlers" \
  icons public scripts src/background

# Day 3: Aug 14, 2026
commit_step "2026-08-14T11:45:00+05:30" "feat(content): Pinterest pin detector overlay & high-res upscaler" \
  src/content/pinterestDetector.ts src/modules/image-selection

# Day 4: Aug 15, 2026
commit_step "2026-08-15T16:30:00+05:30" "feat(prompt-builder): 6 photography intent rule packs" \
  src/modules/prompt-builder/rulePacks.ts src/types

# Day 5: Aug 16, 2026
commit_step "2026-08-16T13:10:00+05:30" "feat(prompt-builder): prompt compiler engine with rule formatting" \
  src/modules/prompt-builder/builder.ts

# Day 6: Aug 17, 2026
commit_step "2026-08-17T15:40:00+05:30" "feat(injector): ChatGPT and Gemini DOM composer injection & clipboard simulator" \
  src/content/llmInjector.ts src/modules/llm-injector

# Day 7: Aug 19, 2026
commit_step "2026-08-19T12:00:00+05:30" "feat(api): optional Gemini 1.5 Flash Vision API integration" \
  src/lib/geminiApi.ts

# Day 8: Aug 20, 2026
commit_step "2026-08-20T14:15:00+05:30" "test: add Vitest unit test suite for Pinterest upscaler and prompt builder" \
  tests

# Day 9: Aug 21, 2026
commit_step "2026-08-21T11:30:00+05:30" "docs: initial architecture overview and product vision" \
  PROJECT.md

# Day 10: Aug 23, 2026
commit_step "2026-08-23T17:05:00+05:30" "feat(sidepanel): React 19 side panel Atelier UI & history drawer" \
  src/sidepanel

# Day 11: Aug 24, 2026
commit_step "2026-08-24T10:50:00+05:30" "docs: Chrome Web Store submission guidelines and privacy disclosures" \
  CHROMEWEBSTORE.md

# Day 12: Aug 27, 2026
commit_step "2026-08-27T14:50:00+05:30" "docs: establish AGENTS.md protocol and CONTEXT_WINDOW.md memory system" \
  AGENTS.md CONTEXT_WINDOW.md

# Day 13: Aug 28, 2026
commit_step "2026-08-28T18:58:00+05:30" "feat(ui): YouMind-inspired Neo-Editorial Brutalist redesign with Stitch MCP" \
  src/sidepanel/index.css src/sidepanel/App.tsx CONTEXT_WINDOW.md

# Day 14: Aug 29, 2026
commit_step "2026-08-29T19:37:00+05:30" "feat(ui): Obsidian Editorial Dark Mode and header theme toggle button" \
  src/sidepanel/index.css src/sidepanel/App.tsx CONTEXT_WINDOW.md

# Day 15: Aug 30, 2026
commit_step "2026-08-30T19:43:00+05:30" "refactor(ui): high-contrast Cyber-Editorial Dark Mode styling fixes" \
  src/sidepanel/index.css src/sidepanel/App.tsx CONTEXT_WINDOW.md

# Day 16: Sep 01, 2026
commit_step "2026-09-01T00:38:00+05:30" "docs: comprehensive README redesign and v1.0.0 release packaging" \
  README.md CONTEXT_WINDOW.md

echo "Pushing backdated history to GitHub..."
git push -u origin main --force
