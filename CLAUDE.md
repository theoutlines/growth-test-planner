# growth-test-planner — project memory

The live Growth Test Planner: https://planner.theoutlines.xyz. Author: Ivan Polushin (theoutlines). Public repo; code MIT.
Design source of truth: the Claude Design canvas https://claude.ai/artifact/FDAgypvxoZ6MnD4w8D3urr (page "System (v4)"), and the design notes in the owner's paywall-test-planner project memory.

## Layout
- Static site, no build: `index.html`, `styles.css`, `js/math.js` (plan + read, pure), `js/data.js` (ideas, chips, trial tiles), `js/app.js` (hash router, screens, sliders, sheet/rail, share).
- `assets/character.png` (owner's character, not MIT), `fonts/` (Uncut Sans variable, Geist Mono 400; OFL in `LICENSES/`), `_headers` (CSP etc. for Cloudflare Pages).

## Rules
- Nothing typed leaves the browser: no backend, no runtime AI, no third-party requests except Cloudflare Web Analytics (page views only). Last inputs in localStorage (try/catch); share links put inputs after `#`.
- Public sources only; never employer data. Every benchmark keeps its source.
- Mobile-first (390). Desktop (≥1200): the mobile column centred, controls in a 320 rail fixed to the right edge (max height = window − 120 px, scrolls inside); share is a modal. The top bar is sticky on every screen: only the content scrolls. Above 1440 the whole page scales (body zoom = width/1440).
- Interface explains itself: no helper notes for obvious controls. Graphics sharp, interface soft. Icons filled.
- Math must match the canvas reference: 50,000 views, 2.75%, 50/50 $6.99/$39.99 → 2/4/6/8 wk = 12.9/9.1/7.5/6.5%; read example A 85,700/1,180/1,177 vs B 85,620/1,050/1,380 → +13% (+5…+21%). Check with a Playwright walk before pushing.
- Deploy: push to `main`; Cloudflare Pages project `growth-test-planner` publishes (no build, output `/`), domain planner.theoutlines.xyz (CNAME → growth-test-planner.pages.dev), Web Analytics on.
