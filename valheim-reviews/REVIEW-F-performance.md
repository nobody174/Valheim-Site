# REVIEW-F: Performance and QA

Reviewer role F. Date 2026-10-31. Worked in a copy of the repo (original untouched). Build under test: entry chunk `index-DNVwEm5H.js`.

## Verdict
1. Fast where it counts: warm Home loads in 184 ms unthrottled and 575 ms DOMContentLoaded at 4x CPU, offline start works, memory is flat, CLS is about 0, and every gate (lint, 384 tests, validate, build, QA) passes.
2. The cost sits in the three giant list pages (Recipes 12,393 DOM nodes, Checklist 7,870, Items 6,072), which take 0.65 to 3.6 s to settle at 4x/6x CPU, and in a 1.2 MB entry chunk that parses 540 kB of JSON and runs Zod over 1,327 rows before first paint.
3. Real defects: every search result row is marked selected (arrow keys show nothing), an open tab never checks for updates (second-monitor use), and the precache is 3.6 MB, 53 percent of it icons.

## Scores (0-10)
| Area | Score | Reason |
|---|---|---|
| Startup / first load | 7 | cold FCP 696 ms (1x), 1,440 ms (4x), 2,284 ms (6x); 1.2 MB entry, only Graph is lazy |
| Route changes | 6 | most pages settle under 100 ms at 1x; Recipes 2.2 s (4x), 3.6 s (6x); Items/Checklist/Building 0.65 to 1.7 s |
| Search | 7 | median 16 ms per keystroke at 1x, but p95 320 ms at 4x, 452 ms at 6x; first palette open 389/477 ms |
| Offline / PWA | 8 | offline start works at all throttles, valid manifest, autoUpdate; no periodic update check, 3.6 MB precache |
| Memory / stability | 9 | heap 11.6 MB after 721 navigations in 10 minutes, no growth |
| Layout shift | 9 | CLS 0.005 cold, 0 warm (Home) |
| Test and QA gates | 8 | all green, but QA budget is all zeros and measures no speed/offline/update |
| Accessibility beyond axe | 6 | names present, but listbox state bug, no combobox semantics or focus trap, tables lack scope/caption |

## Before-numbers table
Environment: headless Google Chrome for Testing 153 (system binary via Playwright `channel: chrome`), Linux VM, 1280x720, production build via `vite preview` at `/Valheim-Site/`, FRESH contexts (no owner data), CPU throttling by CDP. Network is localhost, so cold numbers are best case. Single runs unless stated.

### Home load
| Metric | 1x | 4x | 6x |
|---|---|---|---|
| Cold DCL / load | 434 / 435 ms | 939 / 939 ms | 1,539 / 1,539 ms |
| Cold FCP (= LCP) | 696 ms | 1,440 ms | 2,284 ms |
| Cold total blocking time | 219 ms | 837 ms | 1,545 ms |
| Cold last long task end (TTI proxy) | 549 ms | 1,253 ms | 2,312 ms |
| Cold requests / transfer | 42 / 446 kB | 42 / 446 kB | 42 / 446 kB |
| Warm (SW controlling) DCL / load | 184 / 184 ms | 575 / 583 ms | 761 / 767 ms |
| Warm FCP | 392 ms | 1,024 ms | 1,384 ms |
| Warm TBT / TTI proxy | 30 / 184 ms | 466 / 805 ms | 671 / 1,119 ms |
| Offline (setOffline) DCL / FCP | 225 / 496 ms | 405 / 756 ms | 639 / 1,152 ms |
| Offline content | renders, title and 1,132 chars | same | same |
| CLS (Home, cold) | 0.0051 | 0.0051 | 0.0051 |
| Cache entries after 8 s | 726 | 726 | 726 |

The brief's "DOM interactive 61 ms, load 482 ms warm unthrottled" is the same order (here warm load 184 ms, cold 435 ms).

### Route change and page weight, all 29 menu entries (fresh profile)
Time column = hash change to the second animation frame at 1x/4x/6x. This is not the true render cost for heavy pages (next table is). DOM, controls and words are at load, unscrolled. Counts for Items (453 controls), Recipes (2,580), Checklist (2,234), Check in game (513) match the brief, so the weight is not owner data.

| Route | 1x ms | 4x ms | 6x ms | DOM nodes | controls | words |
|---|---|---|---|---|---|---|
| / | 9 | 6 | 14 | 307 | 24 | 106 |
| /items | 60 | 77 | 143 | 6,072 | 453 | 5,597 |
| /recipes | 14 | 78 | 87 | 12,393 | 2,580 | 5,734 |
| /building | 19 | 86 | 72 | 5,138 | 871 | 2,893 |
| /creatures | 29 | 51 | 260 | 1,346 | 183 | 481 |
| /bosses | 40 | 392 (outlier) | 30 | 401 | 31 | 132 |
| /trophies | 33 | 26 | 23 | 875 | 101 | 432 |
| /food | 19 | 33 | 38 | 1,082 | 76 | 851 |
| /skills | 45 | 14 | 21 | 666 | 86 | 491 |
| /places | 38 | 43 | 59 | 700 | 11 | 999 |
| /planner | 24 | 22 | 70 | 910 | 9 | 39 |
| /comfort | 14 | 54 | 30 | 562 | 72 | 452 |
| /upgrades | 18 | 33 | 53 | 304 | 1 | 338 |
| /rankings | 38 | 45 | 104 | 1,485 | 93 | 1,260 |
| /compare | 21 | 46 | 31 | 320 | 4 | 33 |
| /optimizer | 75 | 148 | 29 | 308 | 19 | 150 |
| /graph (lazy chunk) | 36 | 78 | 44 | 788 | 27 | 115 |
| /character | 52 | 76 | 24 | 188 | 4 | 29 |
| /spotcheck | 34 | 42 | 13 | 2,023 | 513 | 798 |
| /portals | 25 | 56 | 60 | 254 | 22 | 246 |
| /world | 24 | 36 | 50 | 219 | 10 | 202 |
| /next | 25 | 59 | 88 | 233 | 11 | 76 |
| /checklist | 38 | 49 | 29 | 7,872 | 2,234 | 1,072 |
| /progression | 30 | 37 | 276 | 955 | 109 | 672 |
| /favorites | 47 | 29 | 37 | 171 | 1 | 15 |
| /commands | 28 | 39 | 48 | 948 | 4 | 1,236 |
| /trust | 35 | 56 | 74 | 507 | 66 | 314 |
| /updates | 42 | 46 | 48 | 174 | 2 | 39 |
| /profile | 29 | 52 | 43 | 185 | 6 | 61 |

Note the "controls" and "screens" figures differ slightly between scripts (focusable count vs selector count); the table uses the selector count.

### Cost of the longest pages (median of 3; time until DOM node count reaches 95 percent of its final value, from Home)
| Page | DOM nodes | images | 1x | 4x | 6x | worst frame gap 4x / 6x | long-task sum 4x / 6x |
|---|---|---|---|---|---|---|---|
| Recipes | 12,393 | 2,193 | 374 ms | 2,191 ms | 3,649 ms | 624 / 762 ms | 749 / not captured |
| Items | 6,072 | 926 | 196 ms | 890 ms | 1,501 ms | 449 / 664 ms | 606 / 910 ms |
| Checklist | 7,870 | 480 | 165 ms | 655 ms | 1,679 ms | 258 / 382 ms | 295 / 495 ms |
| Building | 5,138 | 900 | 168 ms | 662 ms | 1,524 ms | 240 / 351 ms | 319 / 474 ms |
| Check in game | 2,021 | 200 | 65 ms | 327 ms | 387 ms | 125 / 68 ms | 99 / 129 ms |
| Creatures | 1,346 | 243 | 62 ms | 297 ms | 627 ms | 301 / 113 ms | 191 / 132 ms |
| Rankings | 1,485 | 102 | 88 ms | 240 ms | 702 ms | 82 / 224 ms | 78 / 269 ms |
| Graph | 788 | 34 | 92 ms | 238 ms | 468 ms | 76 / 135 ms | 0 / 169 ms |

All icons are `loading="lazy"`. Warm first-screen requests: Home 43, Items 84, Recipes 85, Checklist 72, Item/Iron 71. The claimed 182 was NOT reproduced for the first screen; it can only be reached by scrolling (lazy icons served from the service worker).

### Interaction
| Metric | 1x | 4x | 6x |
|---|---|---|---|
| Palette open (Ctrl+K) | 137 ms | 389 ms | 477 ms |
| Keystroke to painted results, median of 35 | 16 ms | 40 ms | 56 ms |
| Keystroke p95 / max | 51 / 60 ms | 320 / 322 ms | 452 / 476 ms |
| INP proxy (Event Timing, typing "iron") | 72 ms | 144 ms | 192 ms |

### Memory (10 real minutes, 721 hash navigations across 16 routes incl. Recipes/Checklist/Items, scrolling and palette use, 1x CPU, GC forced before each read)
| t (s) | 0 | 61 | 181 | 301 | 421 | 541 | 601 |
|---|---|---|---|---|---|---|---|
| JS heap (MB) | 6.8 | 10.9 | 11.7 | 11.8 | 12.3 | 12.0 | 11.6 |

No leak signal; DOM returns to about 310 nodes on Home.

## Command results
| Command | Result | Duration | Notes |
|---|---|---|---|
| `npm ci` | pass | 8-10 s | 543 packages; `npm audit`: 21 vulnerabilities (2 low, 19 moderate), ARCHITECTURE.md records only 4 low as accepted |
| `npm run lint` | pass, clean | 12.4 s | |
| `npm run test` | pass, 58 files, 384 tests | 126 s (tests 61 s, env 24 s) | slow: pages render the whole database in jsdom |
| `npm run validate` | pass | 0.7 s | 1,327 rows; unverified 60, cross-checked 1,184, in-game 83 |
| `npm run build` | pass | 16.7 s | warning: chunk over 500 kB. PWA: 733 entries, 3,645 KiB |
| `npm run qa` | pass, within budget | 170 s | 70 page/size pairs: 0 axe, 0 small targets, 0 tiny text, 0 console errors. Needed `QA_CHANNEL=chrome` because `npx playwright install chromium` is blocked (403 on cdn.playwright.dev) |

## Bundle analysis
Entry `index-DNVwEm5H.js`: 1,216,562 B raw, 261.9 kB gzip (matches the claim). `GraphPage` chunk 232.7 kB raw / 76.4 kB gzip (the only lazy route), workbox-window 5.6 kB. CSS 54.2 kB (10.9 gzip) plus graph CSS 16.8 kB.

What is in the entry (package-level source-map attribution failed in the tool, so these are measured from the inputs):
- Game JSON imported statically by `src/data/load.ts`: 18 files, 837 kB on disk, 540 kB minified (66 kB gzip), about 44 percent of the raw entry. Largest: items 181 kB, recipes 121 kB, pieces 58 kB, weapons 54 kB minified.
- Page-specific data that could be lazy: savekeys 18.7 kB, commands 14.3 kB, places 13.7 kB, confirmed 4.5 kB, skills 3 kB, updatelog (about 54 kB minified, 14 kB gzip).
- All 28 non-Graph pages, React 19, react-router 7, zod 4, minisearch, zustand are in the entry. Zod runs `z.array(schema).parse` over all 1,327 rows at module load: 64-71 ms in Node, which scales to about 250-430 ms at 4x-6x. The MiniSearch index is built at import (`src/features/search/instance.ts`), before first render.

Precache (generated `sw.js`): 733 entries, 3,785,906 B raw. By type: 707 `.webp` icons 2,009,564 B (53 percent), 3 JS files 1,454,917 B, 6 woff2 fonts 142,932 B, 10 PNG 104,414 B, CSS 71,021 B. The cold page itself costs 446 kB, then the worker pulls about 3.6 MB in the background (726 Cache Storage entries after 8 s). `dist/assets` also holds 32 font files that are not precached.

PWA and updates: `registerType: 'autoUpdate'`; the generated worker has `skipWaiting`, `clientsClaim`, `cleanupOutdatedCaches`, `navigateFallback: index.html`. Manifest is valid (name, short_name, `start_url "."`, standalone, 192/512/maskable icons, theme and background colours); the real install prompt was not exercised (headless). A returning visitor gets the new worker on the next navigation/launch. But `UpdatePrompt.tsx` handles only `offlineReady`: no periodic `registration.update()`, no reload notice. In a hash-router SPA left open on a second monitor there are no navigations, so the tab can run old JS for days. When the worker does update, `cleanupOutdatedCaches` drops the old precache while the open page still references old hashed chunks; the lazy `/graph` import can then 404 (no error boundary seen around its `Suspense` in `App.tsx`). Inferred from code, not reproduced (needs two deployed builds).

## Top 5 speed wins
1. **Window or chunk the long lists (Recipes, Checklist, Items, Building).** Recipes settles in 2,191 ms (4x) / 3,649 ms (6x) with 12,393 nodes, 2,193 images, 2,580 controls; Items 890/1,501 ms. Render a screen or one zone at a time, add `content-visibility: auto` with `contain-intrinsic-size`. Expected: Recipes well under 300 ms at 4x, DOM down about 80 percent. M. Also the fix for the brief's page-weight complaint.
2. **Split the entry.** Lazy-load page-specific JSON and routes (Comfort, Rankings, World, Character, Planner, like Graph), defer the MiniSearch build until idle or first use. Estimated 150-250 kB gzip off the entry; cold 4x FCP 1,440 ms should fall by several hundred ms. M.
3. **Stop running Zod over shipped data at startup.** `npm run validate` already checks the same files at build time; the runtime parse costs about 65-70 ms warm (250-430 ms at 4x-6x). Cast typed JSON; keep Zod for tests, the validate script and untrusted save-file import. S.
4. **Slim the precache.** 707 icons are 2.0 MB of 3.6 MB. Precache shell, JS, CSS, fonts and data; serve icons through a runtime cache-first route (or precache only Home, zone and boss icons). Faster install, less storage. Trade-off: icons never seen are not offline, so decide with the owner. S-M.
5. **Palette and updates.** `useDeferredValue` plus a row cap and pre-warmed index (open 389 ms, keystroke p95 320 ms at 4x); a visibility/interval `registration.update()` with a small "new version, reload" notice for tabs left open. S each.

## Accessibility findings (scripted in Chromium, 19 pages plus keyboard runs)
- **Names on controls: pass.** An apparent 889 unnamed links on Recipes was a measurement artifact (`innerText` empty for off-screen/collapsed content); using `textContent`, 0 unnamed links or buttons on Recipes, Item, Check in game, Graph, Planner, Food. Icons use `alt=""` next to visible text, correct. No positive `tabindex`; one `h1`, one `main` and one `header` per page.
- **Result list bug (confirmed).** In the palette all results have the active class and `aria-selected="true"` (17 of 17 for "iron"). `SearchResults` compares `h.key === activeKey`, but `key` is not in MiniSearch `storeFields`, so `undefined === undefined`. ArrowDown/Enter still work (Enter opened `IronScrap` after two ArrowDowns), but nothing visibly moves and screen readers announce everything selected. `useHitKeys` also serves the Home search.
- **Palette semantics.** Input has no `role=combobox`, `aria-expanded`, `aria-controls` or `aria-activedescendant`; dialog has `aria-modal="true"` yet Tab leaves it after one press (in-dialog sequence true,false,false,false,false); Escape returns focus to the opener, which is BODY when opened with `/` or Ctrl+K, so focus drops to the document start.
- **Header search is a read-only `<input>` acting as a button** (`readOnly`, `aria-label="Open search"`); announced as an edit field.
- **Tables.** Building (243 rows), Checklist (447), Rankings (69): `th` present but 0 `scope`, no `caption`; scroll wrapper is `overflow-x: auto` without `tabindex`, so a keyboard user cannot scroll a wide table unless a cell inside has focus. Rankings has 11 sortable header buttons (good).
- **Focus order.** After a fresh reload the first four Tab stops were Home zone cards (Meadows, Black Forest, Swamp, Mountains), not the skip link or header, although DOM order is header, nav, main. Cause not found (see Could not check). Focus ring is visible (solid 2 px outline). Sidebar has 29 links; the skip link is the only way past them.
- **Keyboard cost of page weight.** Recipes has about 2,600 and Checklist about 2,270 tab stops, which is also an accessibility problem.

## Findings
| id | Severity | Evidence | Fix | Effort |
|---|---|---|---|---|
| F1 | High | Recipes settles in 2,191 ms (4x) / 3,649 ms (6x), 12,393 DOM nodes, 2,193 images, 2,580 controls; Items 890/1,501 ms; Checklist 655/1,679 ms; Building 662/1,524 ms | Window or chunk lists, `content-visibility`, filter-first landing | M |
| F2 | High | All 17 palette rows `aria-selected="true"` and styled active; `SearchResults.tsx` compares `h.key` but `key` is missing from `storeFields` in `search.ts` | Add `key` to `storeFields` or match by index; test that exactly one row is selected | S |
| F3 | Med | Entry 1,216 kB raw / 262 kB gzip, 44 percent JSON, only Graph lazy; cold FCP 696/1,440/2,284 ms, TBT 219/837/1,545 ms | Lazy routes and page-specific JSON; defer search index | M |
| F4 | Med | `load.ts` Zod-parses 1,327 rows at import (64-71 ms Node, about 250-430 ms at 4x-6x), duplicating `npm run validate` | Typed casts for shipped data; keep Zod for validate and save import | S |
| F5 | Med | `UpdatePrompt.tsx` only handles `offlineReady`; no `registration.update()` polling; `skipWaiting` plus `cleanupOutdatedCaches` under a long-open tab; lazy Graph hash vanishes (inferred, not reproduced) | Interval/visibility update check, reload notice, retry on chunk-load error | S |
| F6 | Med | Precache 733 entries / 3.6 MB; 707 icons = 2.0 MB (53 percent) | Runtime-cache icons or precache a short list; confirm offline expectation with owner | S-M |
| F7 | Med | Palette: no combobox ARIA, no focus trap (Tab exits after 1), Escape drops focus to BODY; header search is a read-only input | Combobox pattern, focus trap, restore focus, real `<button>` | M |
| F8 | Low | Palette open 389/477 ms (4x/6x); keystroke p95 320/452 ms; INP proxy 144/192 ms | `useDeferredValue`, row cap, pre-warm index | S |
| F9 | Low | Building/Checklist/Rankings tables: no `scope`, no caption, scroll wrapper not focusable | `scope="col"`, captions, focusable labelled wrapper | S |
| F10 | Low | Warm first screen 43-85 requests, rising to the claimed ~180 only while scrolling the long pages | Fixed by F1 | S |
| F11 | Low | `npm audit` 21 vulnerabilities (2 low, 19 moderate) vs 4 low in ARCHITECTURE.md; not checked whether dev-only | Re-check and update the accepted-risk note | S |
| F12 | Low | `npm run test` 126 s (jsdom renders whole database) | Smaller fixtures or sharding | M |
| F13 | Low | QA budget is all zeros and runs with `serviceWorkers: 'block'`; no speed, offline or update checks | Add budgets (entry size, DOM nodes per page, long tasks at 4x) and an offline smoke test | M |

## Protect this
- The lazy `GraphPage` chunk: the right pattern, extend it.
- `assetsInlineLimit: 0` with separate WebP icons and `loading="lazy"` on every icon.
- Offline start: works at 1x/4x/6x with full content after `setOffline`.
- Flat memory (11-12 MB after 721 navigations) and CLS about 0.
- The QA gate (70 pairs: axe, tap targets, tiny text, console errors, sideways scroll) and the lint, test, validate, build chain in CI.
- Skip link, visible 2 px focus ring, one `h1` and landmark set per page, `alt=""` icons beside visible text.

## Could not check
- Real Playwright Chromium (download blocked, 403 on cdn.playwright.dev). Used system Google Chrome for Testing 153 via `channel: chrome`. Localhost with no network latency, so cold loads are optimistic; no real phone, no network throttling, no battery cost of the 3.6 MB precache.
- Live site through Claude in Chrome (optional step) was not done; the claimed 182 requests on a warm load, live transfer sizes and live service worker state are unconfirmed (not reproduced locally for the first screen).
- End-to-end update delivery and the chunk-404 after a deploy (needs two deployed builds); real install prompt on Android/iOS.
- Owner-state page cost (larger than a fresh profile), "Big text" mode timings, 390x844 timings (only the repo QA run covers phone width).
- First-Tab-stop anomaly on a fresh reload (cause not found); Lighthouse not run; package-level bundle attribution beyond JSON (source-map tool failed); Recipes 6x long-task sum was not captured.

## Assumptions
- Fresh contexts and the production build stand in for a new visitor; the brief's page counts reproduced on a fresh profile.
- "Settled" means DOM node count reaches 95 percent of its final value, a proxy for render completion rather than a paint measurement; INP is measured on synthetic typing with Event Timing, not real use.
- 4x and 6x CPU throttling approximate a mid-range and a low-end phone.
