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
- **Second-screen mode:** compact density, large type, motion off, toggle in the header. Built: the "Big text" button in the header sets `data-screen="second"` on the page (type 112.5%, table cells and panels tighter, all motion off); remembered in this browser only (`vcs:v1:display`). Measured on the Items table: rows 28 px instead of 39 px.
- Pinned and recently viewed bar.
- Keyboard navigation and visible focus everywhere; ARIA for the palette, tables, graph controls.
- Lighthouse on the deployed site: Performance, Accessibility, Best Practices, PWA all
  90 or above (report numbers; explain any that cannot reach it).
- Bundle review: lazy-load the graph and rankings, keep initial load small.
- Offline test pass: first load, go offline, every route, update flow.
- Docs: final README, deployment notes, "how to update data after a game patch".

Measured on the deployed site (2026-10-28, Lighthouse 12, headless Edge): desktop Performance 100, Accessibility 100, Best Practices 100, SEO 90; mobile (throttled) Performance 96, Accessibility 100, Best Practices 100, SEO 90 (FCP 2.1 s, LCP 2.2 s, TBT 70 ms, CLS 0.017). The SEO point was a missing meta description, added. Lighthouse 12 has no PWA category; installability is covered by the offline test. Left open on purpose: source maps for first-party JS (a Best Practices note that does not move the score). Offline test (Playwright, live site): after the first visit and the cache fill (694 files), with the network off, 24 of 24 routes load after a full reload, including the lazy graph, planner, rankings and item, boss and station pages, with no failed requests and no page errors.

Acceptance:
- [x] Lighthouse scores recorded (above)
- [x] Full offline walkthrough passes on desktop. Not run on a real phone; the mobile layout was tested with emulation at 390 px (no sideways scroll, axe clean)
- [x] "Update data after a patch" guide exists (`docs/UPDATE_AFTER_PATCH.md`). Its steps are the ones used for every zone pass, run on this session's Mistlands and Ashlands data; no new game patch was available to test it on

## Checkpoint

Owner declares v1.0. Tag the release. Update ROADMAP.

## Design pass 2 (2026-10-28)

The owner found the site too text-heavy and too plain for a game site. Done: sidebar grouped into Look things up, Plan & compare, My game and Reference with a game icon on every entry; a wood-and-parchment theme (carved-sign buttons, wood header, warm surfaces) driven by tokens; a home page with a drawn night landscape, boss-icon zone cards and icon tool cards; item, creature and boss pages with a framed icon and a zone-coloured banner; every long page intro folded into an "About this page" box. The logo and landscape are SVG drawn for the site, no game art beyond the item icons already used.
