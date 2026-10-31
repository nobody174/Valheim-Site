# REVIEW-A: Owner at the second monitor

Reviewer role A. Date 2026-10-31. Live site, owner's Edge with his saved state (read-only; nothing clicked that writes; no storage writes; Big text never toggled).

## Assumptions and method
- `resize_window` reported success but the viewport stayed 1912x914 (window is maximised; outerWidth 1918x1030). So 1280x720 numbers come from a same-origin `<iframe>` of exactly 1280x720 appended to the page DOM (removed afterwards) loading each hash route. Big text was emulated only by setting `data-screen="second"` on the iframe's `<html>` (DOM only, never localStorage). Original persisted value: `vcs:v1:display` = `{"secondScreen":false,"view":"list"}`; unchanged.
- Words/controls are counted inside `<main>`. "Screens" = tallest scroll height / 720 (the baseline 2.0 on short pages is the 1414px sidebar, so real page height there is under 2).
- A real 390x844 phone and a fresh first-run context were not available (see Could not check).
- Timings are my estimate from the tool call sequence (each action about 1 s) plus counted keystrokes; treat as approximate.
- Screenshots: /tmp/claude-chrome-screenshots-1T820T/screenshot-1793405851617-0.jpg (Home), ...855749-1.jpg (palette, "eikthyr"), ...879932-2.jpg (Bosses), ...909088-3.jpg (My world), ...929862-4.jpg (Flint Axe page).

## Verdict
1. As a second-screen helper it already works well for the one thing that matters: Ctrl+K, type, Enter lands on a quick card (Flint Axe: 3 keystrokes, about 3 s, 0 scrolls).
2. As a whole it still behaves like a wiki: 29 entries, three pages that scroll 20 to 30 screens at 1280x720, and every personal page puts setup before the answer.
3. Biggest owner pain is not speed but "have I got it?": Bosses shows what to bring but not what you hold; Next steps shows a misleading count; World answers sit 2,534 px down.

## Scores (0-10)
| Area | Score | Reason |
|---|---|---|
| Glanceability at 1280x720 | 6 | Home hero and zone cards fine; item quick card is 3 lines. Home needs 2 screens before Handy tools; the sidebar (1414 px) is taller than the window. |
| Big text | 6 | Body goes to 18px; Home shows only 7 controls above the fold, good; but it is a persisted global switch and the tiny "Big text" label sits mid-header. |
| Lookup speed / keyboard | 8 | `/` and Ctrl+K open the same palette; Enter opens first result; Esc closes. Ids and ranking blemishes below. |
| Boss prep loop | 5 | Needs are shown, holdings are not; Next steps count is misleading. |
| Personal pages (portals, world, character) | 7 | Portals strip is always visible and earns its place. World and character hold real owner data, but setup comes first. |
| Interruptions | 8 | No toast, update prompt or layout jump seen during about 20 route changes. |
| Wide monitor use | 3 | Item page content column is about 520 px (at 1568 px screenshot width) beside empty space; right column holds only portals. |
| Overall as helper | 6.5 | |

## Loop table (owner's saved state, 1912x914 live tab, 1280 numbers where noted)
| Loop | Clicks / keys | Seconds (est.) | Scrolls | Result | What it does with no answer |
|---|---|---|---|---|---|
| What does a Flint Axe need? | Ctrl+K, 9 chars, Enter | 3-4 | 0 | PASS: USED FOR Damage 20, MAKE Workbench 4, Wood, 6 Flint on first screen | n/a |
| Boss needs, "eikthyr" via `/` | `/`, 7 chars | 3 | 0 | PASS-ish: Trophy ranked above the Boss; row shows ids `TrophyEikthyr`, `Eikthyr` | |
| Next boss and what I lack | 1 click (Next steps) | 2 | 0 | PARTIAL: "NEXT BOSS: BONEMASS, Still needed: Withered Bone. You hold 0 of 1." but Bosses page says 10x Withered Bone | none |
| Before a boss, have I got it? | Bosses, 1 click | 2 | 0 | FAIL: summon chips only; no held count on Bosses page | |
| Nearest dungeon / portal | My world | 3 | about 4 (Places at y=2534 px) | PASS but late: Burial Chamber 573 in this world, nearest listed; setup blocks 1 to 3 come first | |
| Which portal where | none | 0 | 0 | PASS: strip on every page; "boat → Island Base" | |
| Portal page warnings | open My portals | 2 | 0 | Every portal shows "No other portal has this exact name, so it goes nowhere"; correct for the owner's lone names but loud, repeated | |
| Not-in-site query "xyzzy" | type | 2 | 0 | Bare `No results for "xyzzy".` | no suggestion, no nearest page |
| Query "bonemass" | type | 2 | 0 | FAIL-ish: Bonemaw Meat, Bonemaw Tooth listed before Bonemass Trophy and the boss | |
| Query "where is the moder" | type | 2 | 0 | FAIL: first hit Patterns of the Bear (fuzzy) | |
| Open Items / Recipes to browse | 1 click | 2 | 30 / 33 screens | Heavy: 453 and 2,580 controls, 137 folds on Recipes | |

## 5 worst moments
1. Next steps "You hold 0 of 1" while the boss needs 10 Withered Bone (/#/next vs /#/bosses): a count that reads as the amount, so the owner may think he is nearly ready.
2. Boss prep dead end: Bosses shows summon items but not what he holds; the answer lives on another page with a different count.
3. My world: answer ("Places", nearest dungeon) is at y=2,534 px; first three blocks are folder-picking and file-type setup he did once.
4. Search rows show internal ids (`TrophyEikthyr`, `CookedBoneMawSerpentMeat`, `flint_pile`) and fuzzy "bonemass" ranks Bonemaw items above Bonemass.
5. Recipes and Checklist: 2,580 and 2,234 controls over 33 and 24.5 screens; opening either mid-game is a wall.

## Findings
| Id | Sev | Evidence | Fix | Effort |
|---|---|---|---|---|
| A1 | High | /#/next: "You hold 0 of 1" vs bosses needing 10 Withered Bone | Show "have X / need N" from the real requirement or drop the count | S |
| A2 | High | Bosses page (131 words) has no holdings; boss loop needs 2 pages | Add "you hold N" to each summon chip (from character file) or a "ready / missing" line | M |
| A3 | Med | Palette rows show ids (`TrophyEikthyr`, `AxeFlint`, `flint_pile`); confirmed | Show zone or category in the right column instead of id | S |
| A4 | Med | "bonemass": Bonemaw items rank above Bonemass boss/trophy; "eikthyr": Trophy before Boss | Exact-name and prefix matches first, bosses above their trophies | S |
| A5 | Med | "xyzzy": bare "No results" | Suggest nearest names or top categories | S |
| A6 | Med | World: Places at y=2,534 of a 9.7-screen page, 82 folds, 747 controls | Put a compact status and the Places list first; collapse setup once files are remembered | M |
| A7 | Med | Items 30.5, Recipes 33, Checklist 24.5, Building 21.2 screens; 453 / 2,580 / 2,234 / 871 controls | Filter-first open state, paginate or virtualise | M |
| A8 | Med | Wide screen: Flint Axe content column about one third of width; right rail only portals | Two-column item page, or use the rail for the quick card | M |
| A9 | Low | Sidebar 1,414 px high at 1280x720 (about 2 screens), 29 entries, "beta" and orange dots | Collapse groups or hide owner/maintainer groups | S |
| A10 | Low | Home: search appears as hero box and header box (2 boxes), `/` opens a palette not the focused box | Make the hero box the same palette or focus it | S |
| A11 | Low | Bosses `innerText` reads "TrophyHard Antler" but the screenshot shows normal chips | Hypothesis 11 not reproduced visually; add a space or separator for copy/screen readers | S |
| A12 | Low | Big text is a persisted global setting with a small header label | Make it a larger toggle with a visible state | S |
| A13 | Low | Portals page repeats "goes nowhere" on every row | Show once, per-row only when real | S |
| A14 | Info | Build planner 39 words, Compare 33, Favorites 15, Update log 39, Profile 61 | Near-empty confirmed; hide until used or merge | S |

## Hypothesis check
- Page weights: confirmed for Items (6,392 words, 453), Recipes (5,734, 2,580, 137 folds), Checklist (2,234 controls), World (82 folds). Screens at 1280x720 are higher than the earlier 1912x914 figures (Items 30.5, Recipes 33, Checklist 24.5, Building 21.2); Rankings 7.7, Places 7.8, Check in game 6.2, Console commands 10.4, World 9.7 (changed: larger than before because the window is smaller).
- Near-empty pages: confirmed (Planner 39, Compare 33, Favorites 15, Update log 39).
- Pattern 2 (two search boxes): confirmed, 2 on Home.
- Pattern 7: ids in rows confirmed; ranking confirmed; not-found state bare, confirmed.
- Pattern 8: confirmed.
- Pattern 10: confirmed.
- Pattern 11: Bosses not reproduced visually (see A11); Building ids not checked.
- Patterns 3, 4, 5, 6, 9: not examined in this role.
- Speed: warm load not re-measured accurately (extension tab); route changes of 1.3 s each in the harness were dominated by my wait time.

## Protect this
- Ctrl+K / `/` palette: type, Enter, quick card; 3 keystrokes to answer.
- Portals strip on every page (always right rail).
- Home hero and zone progress cards; Bosses cards; item quick card (USED FOR / MAKE).
- No interruptions: no toasts or update prompts seen.
- Friendly "Page not found" text.
- Saved profile data in world, character and portals pages; do not reset.

## Could not check
- Real 1280x720 window (viewport could not be resized) and a real 390x844 phone; Big text on every page (only Home measured: 18px body, 7 controls above fold).
- Keyboard-only focus order beyond `/`, Ctrl+K, Esc, Enter; browser Back behaviour.
- First-run experience and cold-cache speed.
- Update prompt behaviour for a returning visitor; memory after 10 minutes.
- Per-page screenshots of all 29 entries (numbers only, from the iframe harness).
- Building ids (`darkwood_beam_67`) and Comfort planner table on a phone.
