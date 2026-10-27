# Next steps for Claude Code (from the 2026-10-27 reviews)

Read this file after `CLAUDE.md`. It turns the two reviews into a work plan.

- Full findings, with evidence: `docs/REVIEW-2026-10-27-2.md` (finding ids F1 to F22 below refer to it)
- Earlier review: `docs/REVIEW-2026-10-27.md` (most of it is already fixed)

## How to work on this (the owner's rules still apply)

1. Follow the working agreement in `CLAUDE.md`: propose a short plan first and wait for approval, one work package per session, one branch and one PR per package, small commits, update `docs/ROADMAP.md`.
2. Never invent game data. Anything not in the game files gets `verified: "unverified"` and a note. A guide is not the game: say "guide, not checked in game".
3. `npm run validate`, `npm run test` and `npm run build` must pass before every commit.
4. Do not edit generated data by hand. Change `tools/extract/biomes/*.json` or `build_data.py` and rebuild (needs the owner's game install; if you cannot run the extractor, stop and ask).
5. Before and after each package, report what you measured, not what you hope.

## Where the project stands

Good: validate, typecheck, lint and 182 tests pass; `npm audit` clean; no console errors on 20 routes; no sideways page scroll at 390px; axe-core WCAG 2A/2AA found one failure; five zones covered (Meadows to Plains). Review 1's H1, H2, M1 to M5 are fixed.

Not good yet: the Smelter has no recipe, the first load is too large, returning visitors can run old data, short-typo search returns nothing, the item page hides the answer, and the look is a generic dark dashboard with Valheim icons.

Scores from the reviewer: professional look 6.5/10, feels like Valheim 3/10.

## The five fixes to do first (in this order, one package each)

### Package 1: Surtling and station build costs (F1)
Problem: no Surtling creature or Surtling Core exists in `/data` or the biome configs, so Smelter, Charcoal Kiln, Blast Furnace and Oven have empty build costs, and `/#/station/smelter` says "needs items from biomes not added yet" (no longer true).
Do:
- Look in the raw dumps for the Surtling creature, its drops and Surtling Core, and add them to `tools/extract/biomes/swamp.json`. Rebuild.
- Check the four stations now get a build cost from the game files. One guide says Smelter and Kiln cost 20 Stone + 5 Surtling Cores and the Blast Furnace 20 Stone, 5 Surtling Cores, 10 Iron, 20 Fine Wood plus an Artisan Table nearby. Treat that only as a cross-check, never as the source.
- Make the builder print a warning for every station whose build cost is empty.
- Fix the stale wording on the station page.
Done when: `/#/station/smelter` shows a build cost, a test fails if a station has an empty cost without a documented reason, `docs/DATA_SOURCES.md` updated.

### Package 2: Smaller bundle and no stale versions (F2, F3)
Problem: the main JS file is 2.07 MB (1.1 MB gzip) because 397 icons are inlined as base64 (`src/data/icons.ts` uses an eager glob, Vite inlines files under 4 KB). 158 of the 444 icon files belong to no entry. `registerType: 'prompt'` means a returning visitor can run an old build until they notice a corner toast. The data version line only exists in the desktop sidebar.
Do:
- Set `build.assetsInlineLimit: 0` (or equivalent) so icons are separate files; load icons lazily or filter the glob to ids that exist in the data.
- Remove the 158 unused icons from `src/assets/icons/` (ask the owner first, see the questions list) and keep `extract_icons.py` exporting only used ids.
- Switch to `registerType: 'autoUpdate'`, or make the update prompt a persistent banner. Ask the owner which.
- Show the data version and "reviewed" date on every screen size.
Done when: gzip size of the entry chunk is under 700 kB (report before and after), precache size reported, offline still works, the data version shows on a 390px screen.

### Package 3: Search that forgives typos (F5)
Problem: `src/features/search/search.ts` only fuzzes words longer than 4 letters and requires every word to match. "bronz swrd" and "fire arow" return nothing. No item has an alias.
Do:
- Fuzzy matching from 3 letters, with a small edit distance.
- If an AND search has no hits, retry with OR and rank by score.
- Add an alias list (in the biome configs, so it flows through the build): Goblin/Fuling, Corewood/Core wood/Round log, Fenris/Wolf, Deer Hide/Deerskin, Bukeperries/Pukeberries, Black Metal/Blackmetal, plus other old guide names you can confirm from the localisation files.
- Empty state: "No results. Did you mean ...?" with the top fuzzy suggestions.
Done when: tests cover "bronz swrd", "fire arow", an alias, and an empty-result suggestion; the palette still feels instant.

### Package 4: Item page order and hoard defaults (F6, F7, F8)
Problem: the item page shows progress chips, a hoard dropdown, weight, stack size, tags ("none") and the internal id before the recipe and the where-to-get. 100 of 106 crafted items default to "Safe to discard", including the Iron Sword. 24 hoard notes contain internal ids ("crafting ArmorFenringChest").
Do:
- Order: title and badges, Where to get, Crafted from, Used in, stats; then a compact toolbar for progress and hoard; internal id and tags in a collapsed "details".
- Crafted gear gets no hoard badge (or a neutral "Gear" badge, ask the owner). Coins become "keep some". Keep the validate rule that ingredients are never "safe to discard".
- Build hoard notes from display names, and map skill 0 (Ooze Bomb shows "skill0") to a readable label or leave consumables out of the weapon ranking.
Done when: on a 390px screen the recipe or source is visible without scrolling past the progress block; a test fails if any player-facing text contains a CamelCase prefab id.

### Package 5: Missing sources and recipes (F4, F9)
Problem: Fenris Hair, Fenris Claw and Ymir Flesh have no source; the Fenris armor set is declared 3 pieces but only 2 exist (the helmet needs a trophy from a creature that is not in the data); Wolf Skewer is addable now; trinkets, fishing bait variants and Black Forge items are left out.
Do:
- Search the raw drop tables and spawn tables for who drops `WolfHairBundle`, `WolfClaw` and `YmirRemains`. Add every creature that really drops them (the reviewer suspects a Mountain cave creature, such as a Fenring Cultist type; this is a guess, check the files).
- Add the Fenring helmet once its trophy creature exists.
- Add the Wolf Skewer recipe. Model trinkets as one category and add the seven craftable trinkets whose inputs exist.
- For every entry still in `tools/extract/dropped_recipes.json`, add a one-line reason; a test fails on an entry with no reason.
Done when: no item in the database says "no known source" unless the game files really have none; the set size of every armor set equals the number of pieces in the data.

## Everything else from the reviews (backlog, after the five)

Data and trust
- F11: mark each hand-written value (summon cost, where-to-get line, zone) with "guide, not checked" instead of one page-wide badge, including on the progression page.
- F12: decide on renaming `cross-checked` (owner decision, see questions).
- F15: two creatures are both named "Fuling" (Goblin, GoblinArcher); make the names distinct.
- F16: zone labels that do not match requirements (Cultivator, Mead Base: Minor Stamina); show "first available in" separately from "found in".
- F17: creature pages are thin (no named attacks, no "tamable/passive"); boss attacks show as "Attack 1".
- Extend the in-game spot-check list in `docs/DATA_SOURCES.md` to Swamp, Mountains and Plains.

UX
- F10: rankings default sort by rating or DPS; shorten the estimate note; keep shields, bombs and unobtainable items out of the weapon list; show Rating on mobile; check what the "Upgrade level" filter does for shields (no per-level block power in the data).
- F13: auto-dismiss the "Ready to work offline" toast and move it to the top; mobile bottom tab bar; wrap the Building table; 40 px minimum tap targets in table rows on touch screens.
- F14: the "Planner (soon)" nav entry fails contrast; remove it or fix it.
- F22: the home page is empty; see the design plan.

Docs
- F18: README (still promises a crafting graph and planner), ROADMAP (Phase 1 "PR open", Phase 2 cell is one huge sentence), DATA_SOURCES (register row says Meadows and Black Forest only).

Footprint
- F19: reduce game art to the icons actually used.
- F20: the site shares the `nobody174.github.io` origin with other projects; keep the `vcs:v1:` key prefix and store nothing sensitive.

## Design plan (do after the five fixes, after the owner picks a direction)

Reviewer's direction: "Longhouse at night". Keep the dark base, add weathered wood, iron and parchment accents, and let each zone tint the UI (green Meadows, deep green Black Forest, olive Swamp, frost blue Mountains, gold Plains). The full token set (CSS variables), font suggestions (Cinzel kept, Uncial Antiqua for the logo and home headline only, Inter kept for tables, all self-hosted), panel and hover treatment, microcopy and the 404 and empty-state wording are in `docs/REVIEW-2026-10-27-2.md`, section 4.

Top 10 changes with size and files (details in the review):
1. Zone themes via `data-zone` plus zone banners (medium)
2. "Current zone" switcher in the header (medium)
3. Home page redesign with zone cards and progress rings (medium-large)
4. Item page re-order (this is Package 4)
5. Panel and header treatment (small-medium)
6. Stamped hoard badges and zone-tier name colours (small)
7. Boss and trophy collectible cards (medium)
8. Checklist progress rings and zone banners (medium)
9. Mobile bottom tab bar and top toast (medium)
10. Microcopy pass, logo and `icon.svg` (small)

Rules for the design work: no extra game art beyond the existing icons; contrast must still pass the axe scan; keep it fast, offline and readable at 390px; never put jokes in tooltips that carry data.

## Questions Claude Code must ask the owner before acting

1. Rename `cross-checked` to `extracted` or similar (wide change in data and labels)?
2. Auto-update, or a persistent "update available" banner?
3. Crafted gear: no hoard badge, or a neutral "Gear" badge?
4. May the 158 unused icons be deleted from the repo?
5. Full "longhouse" theming, or a lighter pass first (panel treatment, badges, microcopy only)? Zone colours on the whole page or only on banners?
6. Is a global "current zone" setting acceptable (it changes the default of every list)?
7. Trinkets, bait variants and Black Forge items: before Mistlands or after?
8. Should the site move off the shared `nobody174.github.io` origin?

## Start prompt for the next Claude Code session

```
Read CLAUDE.md, then docs/NEXT-STEPS-2026-10-27.md and docs/REVIEW-2026-10-27-2.md.
Check Current State in docs/ROADMAP.md, then propose a short plan for Package 1
(Surtling and station build costs). Do not write code until I approve the plan.
```

## Measured facts to re-check after each package

- Entry chunk: 2,069 kB (1,137 kB gzip); precache 2.4 MB (target: under 700 kB gzip)
- Data: 272 items, 165 recipes, 28 creatures, 5 bosses, 157 pieces; 56 entries `unverified`, 760 `cross-checked`
- Tests: 182 passing; axe failures on 20 routes: 1 (contrast of the dimmed Planner link)
- Hoard defaults: 143 of 272 items "safe to discard"; 100 of 106 crafted items
- Items with an internal id in a hoard note: 24
- Icons: 444 files, 158 unused by any entry
