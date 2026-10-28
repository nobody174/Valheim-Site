# Phase 4 - Polish

**Goal:** premium look and feel, solid on phone and second screen, fast, accessible, reliable offline.

## Step 1 - Visual pass

Direction: dark Nordic, modern, wiki-grade. Not cartoon, not mobile-game.

- Surfaces: `#111111`, `#161616`, `#1A1A1A`; iron trims; bronze/silver/gold/amber accents used
  sparingly for emphasis and state, not decoration everywhere.
- Panels with a subtle dark-wood or black-metal texture (CSS/SVG, no game art), parchment only
  for long-form text panels at low contrast-safe opacity.
- Rune details: SVG dividers, corner trims, header glyph. Never behind text that must be read quickly.
- Card hover glow (amber/bronze), expanding panels, smooth 150-250 ms transitions.
- Biome color coding that stays muted and consistent across badges, graph nodes and guides.
- Typography hierarchy that makes numbers (weights, damage, stack) fast to scan.
- Empty, loading and error states for every page.
- `prefers-reduced-motion` honored.

Done so far (2026-10-28): one muted zone colour per zone (`--zone-*` tokens, `data-zone` attribute) as a thin top edge and a dot on item, creature and boss pages and on the progression tabs and heading; card hover glow on recipe blocks; the four tool links (plan, upgrade, graph, compare) in one row on item pages; 404 wording. Home page: a card per zone (boss, creatures, items, collected progress bar) and shortcuts to the six tools. Not done: wood or metal textures, rune details (kept off to keep numbers fast to read).

Acceptance:
- [ ] Owner approves a screenshot set: home, item page, graph, rankings table, planner
- [ ] Contrast meets WCAG AA for all text
- [ ] No page looks unfinished (empty states, long names, missing icons handled)

## Step 2 - Mobile, accessibility, performance, offline

- Responsive layouts at 390px and 1280px+; touch targets at least 44px; sticky search on mobile.
- **Second-screen mode:** compact density, large type, motion off, toggle in the header.
- Pinned and recently viewed bar.
- Keyboard navigation and visible focus everywhere; ARIA for the palette, tables, graph controls.
- Lighthouse on the deployed site: Performance, Accessibility, Best Practices, PWA all
  90 or above (report numbers; explain any that cannot reach it).
- Bundle review: lazy-load the graph and rankings, keep initial load small.
- Offline test pass: first load, go offline, every route, update flow.
- Docs: final README, deployment notes, "how to update data after a game patch".

Acceptance:
- [ ] Lighthouse scores recorded in the PR
- [ ] Full offline walkthrough passes on desktop and phone
- [ ] "Update data after a patch" guide exists and was followed once on a small change

## Checkpoint

Owner declares v1.0. Tag the release. Update ROADMAP.
