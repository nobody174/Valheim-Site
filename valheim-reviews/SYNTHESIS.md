# SYNTHESIS: valheim-site fresh-eyes review (2026-10-31)

Merged from REVIEW-A (owner), B (architecture), C (visual), D (kid, AI-imitated), E (search), F (performance), G (code), H (data), I (docs) and BRIEF.md sections 1-4, 7, 8. Finding ids are cited as `A1`, `G-03`, etc. Three claims that decide a ranking were spot-checked in the repo (marked "checked").

**Status of the owner's kid test: NOT DONE.** BRIEF section 9 has not been run, so there are no owner kid-test notes. Everything about "the kids" below comes from reviewer D, an AI imitating an 11-year-old, plus code and data evidence. Section 5b lists what the owner should record.

---

## 1. One-page verdict: helper or wiki?

**It is a helper at the front door and a wiki everywhere behind it.**

What makes it a helper (keep):
- Ctrl+K (or `/`), type, Enter lands on a quick card: Flint Axe in 3 keystrokes, about 3 s, 0 scrolls (A); 3 taps on a phone (D). Search itself costs 0.1 ms per query (E).
- Portals strip on every page, Bosses page (208 words, 66 controls), Home hero and zone progress, no interruptions in about 20 route changes (A).
- Desktop speed is good: warm Home DCL 184 ms, 575 ms at 4x CPU, offline start works, heap flat at 11-12 MB after 721 navigations, CLS about 0 (F).

What makes it a wiki (change):
| Evidence | Number | Source |
|---|---|---|
| Menu entries, all equal weight | 29 (16 visible at 1280x720, 13 below the fold); about 9 are daily lookups | B, A9 |
| Home choices | 31 links, 130 words, 22+ tiles/chips, 2 search boxes; "what now?" (Next steps) is tile 2 of 7 | B3 |
| Long database pages | Items 30-33 screens, Recipes 33-36, Checklist 24-27, Building 21-23 (units differ: A uses 720 px, C uses a 653 px scroll box) | A7, C |
| Weight of those pages | Recipes 2,580 controls / 12,393 DOM nodes / 2,193 images; Checklist 2,234 / 7,870; Items 453 / 6,072; settle 2.2 s (Recipes) at 4x CPU | F1 |
| Items rows | 892 badges, two per row | C1 |
| Pages for maintenance or one-time setup in the player menu | 7 of 29 | B2 |
| Kid loops | 3 of 7 clean, 2 partial, 2 fail (AI-imitated, unconfirmed) | D |
| Owner boss loop ("have I got it?") | FAIL: Bosses shows needs not holdings; Next steps says "0 of 1" vs 10 Withered Bone needed | A1, A2, G-04 |

**The decisive point is not speed or data accuracy (35 of 38 checkable entries agree, H). It is that the site answers confidently and sometimes wrongly, and the pages around the answer ask for 10x more reading than the answer needs.** Wrong or misleading lines found: 78 items show a hoard label as "USED FOR" (Carrot Seeds says "Safe to discard", 56 of 72 "Safe to discard" are foods and meads: G-03, H1); "You hold 0 of 1" counts kinds not quantities (G-04); every search row is marked selected (G-02/F2); Enter on "Bonemass" opens Bonemaw Meat (E1); 18 item pages can say "Verified in game" and "guide, not checked" together (H3). A wrong answer is worse than a missing one, so correctness comes before the menu work.

---

## Where the earlier reviewer's 2026-10-31 hypotheses stood

Page weights were **confirmed** (Items 6,392 words, 453 controls; Recipes 5,734 / 2,580 / 137 folds; Checklist about 2,234; fresh-profile counts in F match, so the weight is not owner data; "screens" **changed** upward at 1280x720: A measured Items 30.5, Recipes 33, Checklist 24.5, World 9.7, C measured 33.3 / 36.3 / 27 / 10.7 because the unit differs). Near-empty pages were **confirmed** (Planner 39-115 words, Compare 33-109, Favorites 15-91, Update log 39-115). Pattern 1 and 2 were **confirmed** (29 entries, 12 destinations with two doors on Home, 2 search boxes, sidebar 1,414 px in a 653 px box). Pattern 3 was **confirmed and enlarged**: H found seven trust phrases and a code path producing 18 contradictory pages. Pattern 4 **confirmed** (My world uses `worlds_local`, `.db2`; My character says `.fch`). Pattern 5 **confirmed** at exactly 78 items, and the cause is a code fall-through (`quick.ts:80`) plus a build-script default (`build_data.py:701`), not a content choice. Pattern 6 (facts repeated 2-3 times on an item page) was **not examined** by any reviewer; only D9 (icons shown twice on Next steps) and H's "Used to summon" vs "Must keep" duplicate were seen. Pattern 7 **confirmed** with cause: group order buries the exact name, `id` is indexed, ids print in 369 of 415 rows (E). Pattern 8 **confirmed** with cause (G-04). Pattern 9 **confirmed** (Comfort clipped on phone, 18 hand-written tables, C3/G-14). Pattern 10 **confirmed** (A8; right strip appears only at 1500 px, C13). Pattern 11 is **half confirmed**: `darkwood_beam_67` is real (1 of 242 pieces, G-07/E12); `TrophyHard` was **not reproduced** (not in src/data/docs per G; A saw it only in `innerText`, chips look normal on screen; probably a label joined to a name for copy/screen readers). Pattern 12 (protect list) was **confirmed** by every reviewer. The 182 requests on a warm load were **not reproduced**: F measured 43 (Home) to 85 (Recipes) for the first screen and only reached about 180 by scrolling long pages with lazy icons; the live site was not measured by F. Warm speed **confirmed** (A not precise, F 184 ms DCL).

---

## Where reviewers disagree, and who is probably right

| Tension | Positions | Probable winner and why |
|---|---|---|
| Merge many pages (B) vs small kid menu (A, D) | B: 9 default entries via 13 merges (M effort each). A: hide owner/maintainer groups (S). D: 8-entry phone sheet with "More tools". | **They agree on the outcome (about 9-10 entries), disagree on mechanism.** Tiering (default / Advanced / Owner) is S, delivers the same menu size, and needs no URL or page restructuring, so do it first. Merges are worth doing only where evidence is strong: Optimizer into Food (D1, D loop 4), Progression into Next steps (B10), Creatures/Trophies as tabs under Bosses (same component, B5), Planner/Comfort into Building (B7). Recipes into Items (B4) is the weakest merge: D shows kids need a "start here" Recipes, not a filter, and nobody has usage data (B could not check). Ask the owner (5a, Q1-Q2). |
| Contrast fine (C) vs Big text barely changes anything (A, C) | C: text 15.7:1, passes; but Big text only moves root 16 to 18 px, Items height 21,729 to 21,703 px, headings unchanged. A scores Big text 6. | **Both are right and not in conflict.** Colour contrast is not the problem (C even says 15.7:1 is more glare than needed in a dim room). Size step is: +12.5% at 1-2 m is not glanceable. Fix the size (C5), do not touch contrast apart from bronze 4.10:1 on bg-2 (C9). |
| Tap targets (C) vs "0 small targets" in QA (F) | C: Recipes 1,553 of 1,726 controls under 24 px at 1280. F: `npm run qa` reports 0 small targets over 70 pairs. | **Both measured correctly, different rules.** Checked `tools/qa/audit.ts`: tap targets are counted on the phone run only and links inside a sentence are exempt. C counted every control on desktop in an iframe whose pointer is still `fine`. Real phone tap-hostility on Recipes is therefore plausible but unproven; fix it inside the filter-first work (C2), do not claim it as a QA failure. |
| 182 requests (brief) vs F | F could not reproduce: 43-85 on first screen. | **F is probably right for what a person sees on arrival** (fresh context, local production build, no network). The 182 likely came from a scrolled or long-lived page with lazy icons through the service worker. Real issue is DOM size (12,393 nodes), not request count. Limit: F did not measure the live site. |
| H (verified labels wrong at entry level) vs D (few jargon words seen) | H, code trace only: entry-level "in-game" from one ticked line (83), "Unverified" on 53 items with file-derived numbers, 7 phrases. D saw only "unchecked", "Unverified", "Keep some (50)", "read from game files" on 9 pages. | **H is right about the mechanism, D about what a child meets first.** C's screenshot (Items row: "unchecked" next to "Verified in game") independently confirms H3 on the live site. D's smaller word list is a sample, not a refutation: D did not walk Items, Creatures, Building, Checklist (D "could not check"). The literal words "prefab", "cross-checked", "sources disagree" were not seen on screen by D; "hoard" appears as "Keep some (50)". |
| A: resize_window failed, numbers from iframes | A, B, C, D, E used same-origin or sandboxed iframes of 1280x720 and 390x844; only F used a real 1280x720 viewport (headless Chrome, fresh profile, localhost). | **Iframe layout numbers are valid** (CSS media queries follow iframe width; word and control counts agree across A, B, F within 1-2%: Items 6,392 / 6,468 / 5,597 words, owner state vs fresh). They are **not valid** for touch (`pointer: fine`, no `pointer: coarse` rules: C, 9 such rules untested), real Big text persistence, or real timing. Treat screens as a range (30-33 for Items). |
| D is an AI imitating a child | D says so; reading level and give-up threshold unknown. | **Use D for the structure of confusion (ids, 29 entries, late-game defaults, ambiguous labels), not for severity.** Its two "FAIL" loops (Food, What can I make) are defensible from the screens: Food optimizer defaults to "All zones" and returns Fiery Svinstew; Recipes opens on Artisan Table. But whether an 11-year-old gives up there is untested. |
| Upgrade costs on item pages? | B: "Upgrade costs are also on item pages" so Upgrades is mergeable. H: only reachable through the Upgrades page. | **H is right.** Checked `ItemPage.tsx`: only a link "Upgrade calculator" (`/upgrades?item=`), no cost table. Merging Upgrades into a Gear page must keep the `?item=` deep link. |
| "About this page" pill: protect (D) vs make quieter (C6) | D: easy to find, keep. C: brightest element after the title on all 29 pages. | **Both**: keep it findable, reduce its loudness (quiet link or "?" in the title row) and fix its wording ("profile Default", "advisor", D10). |
| A: "no interruptions" vs F: no update notice | A saw no toasts/update prompt. F: `UpdatePrompt.tsx` only handles `offlineReady`. | **The silence is the bug**: a tab left on a second monitor never learns a new build exists (F5, inferred from code, not reproduced). Combined with G-01 it is a data-safety issue, below. |

---

## 2. Top 10 changes, ranked

Rule applied: correctness fixes first (1-5), then structure and speed ranked by (second-screen and kid impact) / effort. Effort S/M/L as in the reports.

| # | Change | Why it ranks here | Evidence | Effort | One-sentence acceptance test |
|---|---|---|---|---|---|
| 1 | **Search returns the right row, once.** Add `key` to `storeFields` (one word); order by score with an exact-name bonus and a pinned "Best match" row; prefix above fuzzy; remove `id` from indexed fields and from row text (show a one-line type and zone instead); give `suggest()` a score floor. | Front door for both audiences; cheapest large win; wrong Enter target is a wrong answer; all reviewers touched it. | G-02/F2 (checked: `storeFields` has no `key`), E1, E2, E4-E6, G-05, G-06, A3, A4, A5, D6, D loop 1. 57 of 104 expected answers at rank 1 now, 80 in E's prototype; 0 of 7 short names at rank 1; "Bonemass" Enter opens Bonemaw Meat; ids in 369 of 415 rows; 17 of 17 rows `aria-selected` for "iron". | S | For every one of the 765 indexed names, searching that exact name puts that entry first, "Bonemass" + Enter opens the boss, exactly one result row has `aria-selected="true"`, and no search row text contains a CamelCase or snake_case id. |
| 2 | **Stop showing filler as advice.** Delete the fall-through at `quick.ts:80` (return nothing), delete the test that pins it, stop defaulting foods and meads to "Safe to discard" (`build_data.py:699-701`), show "Summons X" or nothing on trophies and summon items. Verify raw-meat food stats before the optimizer pools them. | "A blank line beats a wrong line"; one line of code removes 78 wrong or empty lines; kids and owner both act on it. | G-03 (checked: line 80 returns `HOARD_LABEL`), H1, H9, H7. 78 items affected (decorative 30, must keep 16, safe discard 15, gear 10, keep some 7); 56 of 72 "Safe to discard" are foods or meads; Dragon Egg says "Must keep" not "Summons Moder"; `quick.test.ts:37-38` asserts the bug. | S | None of the 78 listed items shows a hoard word in the USED FOR slot, Carrot Seeds shows its plant line or no line, and a test fails if any USED FOR line equals a hoard label. |
| 3 | **Honest counts.** Advisor returns need and have per item (`Withered Bone 0 / 10`); say "marked collected, amount not tracked" when only ticked; add a held count to Bosses summon chips. | Owner's most common loop ("before a boss, have I got it?") currently fails; a count that reads as a quantity is a wrong answer. | G-04 (checked: `AdvisorPage.tsx:74` prints `boss.have.length` of kinds), A1, A2, A "worst moments" 1 and 2, D loop 3 ("hold what?"). Bonemass needs 10 Withered Bone, page says 0 of 1; `advisor.test.ts` uses qty 1 everywhere. | S (Next steps) + M (Bosses holdings) | With 0 Withered Bone saved, Next steps and Bosses both show "Withered Bone 0 / 10" and never "0 of 1", and a test with qty 10 passes. |
| 4 | **One honest trust label per fact, never two that contradict.** Drop the guide tag and stale "written by hand" note when the line is confirmed; remove the item-level red "Unverified" banner whose own text says the numbers are from game files; one state pill per Items row; then rename to three plain phrases ("Seen in game", "From game files", "Guide, not checked"). | A kid cannot decode seven phrases; two of them contradict on 18 pages; entry-level "in game" overstates one ticked line. | H2, H3, H5, H6, D4, C1, C "worst screen" 1. 83 entries "in-game" from one ticked line; 18 pages show "Verified in game" + "unchecked" + "guide, not checked"; 53 items and 7 creatures "Unverified" with file-derived numbers; 892 badges on Items. | S (H3, remove banner) then M (rename, field-level) | No rendered page contains both "Verified in game" and "unchecked" or "guide, not checked" (test over all 18 pages), and the UI uses at most three trust phrases. |
| 5 | **Protect the owner's data and tell an open tab it is stale.** `.passthrough()` instead of `.strict()` on stored profile and character snapshot; on parse failure copy the raw string aside and show a banner instead of rewriting meta; periodic `registration.update()` with a "new version, reload" notice; a top-level error boundary. | Only finding that can make the owner's progress disappear from the UI after an ordinary deploy; the open-tab update gap makes it likelier. | G-01 (checked: `.strict()` at `model.ts:71,77,91`), F5, G-08, G-09. Probe: one unknown extra field loads as a fresh "Default" and rewrites meta; `autoUpdate` + `skipWaiting` + `cleanupOutdatedCaches` under a long-open tab; no error boundary anywhere. | S-M | A stored profile with one extra field loads unchanged, a corrupt profile is kept under a `broken` key with a visible banner, and a tab left open across a deploy shows a reload notice within a few minutes. |
| 6 | **Tier the menu: default about 9-10 entries, "Advanced" fold, "Owner" area behind the gear; remove beta dots; hide near-empty pages until used.** | Largest drop in 29-entry noise for the least work; serves the 11-year-old and the half-width window; mechanism is S, no URLs change. | B1, B2, B9, B11, A9, D5, C4, C7, C12. 16 of 29 visible; 7 maintainer or setup pages in the player menu; 5 beta dots; sidebar 1,414 px in a 653 px box with 3 nested scrollbars; D would press 4 of 29. | S | At 1280x720 and 390x844 the default menu is 10 entries or fewer with no scroll, and Check in game, Data trust, Update log, Console commands, Profile and the setup pages are reachable only via Owner or Advanced. |
| 7 | **Rebuild Home as "what now?":** one search box, Next up card, portals strip (from 1,100 px, not 1,500), pinned and recent, zones as one compact row; tools and browse chips behind "More". | Home is the first screen of every session; today it duplicates 12 sidebar destinations and hides Next steps. | B3, B8, B14, A10, D11, C13. 31 links / 130 words / 22+ tiles; 2 search boxes; Home 3,018 px tall on phone; portals strip absent at 1280 (only 1500+). Target in B: about 60 words, 12 links, at most 1.5 screens on a phone. | M | At 1280x720 Home shows one search box, a Next up card and the portals strip without scrolling, with 12 or fewer links in `main`. |
| 8 | **Filter-first long pages with newcomer defaults.** Items, Recipes, Checklist, Building open on category/zone + search (or the current zone), cap rows or add `content-visibility`, apply on desktop too; Food optimizer and Food default to the player's zone; Recipes opens on a "Start here" group. | Removes the heaviest pages (the wall) and fixes two of D's kid fails in one change. | F1, A7, C2, G-19, D1, D3. Recipes 12,393 nodes, settles 2,191 ms (4x) and 3,649 ms (6x); Checklist 7,870 nodes; `useProgressive` returns everything on fine-pointer desktops; Food optimizer defaults to "All zones" and returns Fiery Svinstew. | M | Opening Recipes, Items, Checklist or Building at 4x CPU settles in under 500 ms with fewer than 1,500 DOM nodes on first view, and a fresh visitor sees Meadows-level foods and recipes first. |
| 9 | **A real "not found" and wider coverage.** One shared search panel; "Not found" with at most 3 buttons; index Places (79), biomes, page names and console commands; strip filler words from 3+ word queries; index item descriptions and food effects at low weight. | Turns dead ends into a pointer to the right page; "burial chamber", "haldor", "meadows", "carry weight" all return nothing or noise today. | E3, E4, E7-E9, A5, D loop 1. 8 of 8 place queries failed; "burial chamber" suggests Hammer, Amber; "how do I build a portal" ranks Portal 19th; description text exists on 443 of 446 items and is not indexed. | M | Searching "burial chamber", "haldor", "meadows" and "console" each shows a row that opens the right page, and an unknown word shows "Not found" plus at most three real destinations, never an unrelated item name. |
| 10 | **Plain words and a second screen you can read from a metre.** Rewrite the 10 glossary phrases, put counts next to each ingredient and the station on its own line, three plain steps for My world / My character with no file paths on the default view, a real Big text mode (about 125%, headings and rows scale), 40 px header targets, Comfort as stacked cards under 600 px. | Cheap wording wins for the kid plus the one feature the second-screen owner needs and today barely works. | D glossary and D2/D7/D10/D13, C5, C3, C9, C11, G-14, A12. "Workbench: 4, Wood, 6, Flint" read as 4 workbenches (D only, plausible: `makeLine` puts the count before each name, so this is a spacing/wrap issue; verify). Big text moves 16 to 18 px only; Comfort table clipped at 390 px. | S (wording) + M (Big text, tables) | The 10 listed phrases no longer appear in player-facing text, Big text at 1280x720 shows the Home answer area at 125% with headings scaled, and Comfort shows no horizontal scroll at 390 px. |

**After the top 10 (real but lower value for second-screen and kid use):** Cultist and other drops that name items not in the data (H4, M); entry split and Zod-at-startup removal (F3, F4; desktop is already fast, matters at 4-6x CPU); icon precache slimming (F6, needs owner choice); combobox ARIA and focus trap (F7); table scope/caption (F9); knip for unused exports (G-16); docs set reduction and CLAUDE.md top (I; do as a docs-only commit with package 3 because it writes the menu-size rule down); 1.0 content gaps (H8, scope decision); missing mid-game data such as trader prices, farming, resistances (H missing-data list); decide hoard derivation vs stored (G-10).

---

## 3. Keep / Simplify / Merge / Hide / Owner-only / Cut: all 29 pages

Base is B's table, adjusted. Words/controls are at 1280x720 from B/C (owner state, shell included). "Merge" means "as a tab or mode of the named page, after package 3, and keep old URLs working".

| # | Page | Words / controls | Class | Reason and adjustment |
|---|---|---|---|---|
| 1 | Home | 206 / 67 | **Simplify** | Rebuild as "what now?" (change 7). Keep hero and zone progress, smaller. |
| 2 | Items | 6,468 / 488 | **Keep** (simplify: filter-first) | Core answer page; 892 badges, 30-33 screens (changes 4, 8). |
| 3 | Recipes | 5,810 / 2,580 | **Simplify** | Heaviest page; needs "Start here" default. Merge into Items only if the owner confirms he never goes to Recipes by name (B4 vs D3; no usage data). |
| 4 | Building | 2,969 / 871-906 | **Simplify** (hub) | Becomes "Build" with Planner and Comfort as tabs; 21-23 screens. |
| 5 | Creatures | 609 / 237 | **Merge** | Tab under Bosses; `<CreaturePage boss />` is the same component (B5). Low priority. |
| 6 | Bosses | 208 / 66 | **Keep** | Best page (A, B, C). Add holdings (change 3); do not merge it away. |
| 7 | Trophies | 508 / 136 | **Merge** | Tab under Bosses; 48 badges (C); one question, "which trophy". |
| 8 | Food | 815 / 115 | **Keep** | Default entry; open on player's zone (D1). Absorbs Optimizer. |
| 9 | Skills | 589 / 114 | **Hide** | Advanced; read once, not a mid-game lookup (B12). |
| 10 | Places (beta) | 1,075 / 45 | **Keep** | Owner loop (nearest dungeon); beta tag off once checked; index in search (E3). |
| 11 | Build planner | 115 / 44 | **Merge** | Into Building ("Plan"); empty until used; D loop 5 shows no "what I have" input. |
| 12 | Comfort | 528 / 107 | **Merge** | Into Building; fix phone table (C3, G-14). |
| 13 | Upgrades | 414 / 36 | **Merge** | Into a Gear page with Rankings; keep `/upgrades?item=` deep link (item page only links to it, checked). |
| 14 | Rankings | 1,336 / 128 | **Keep** | Becomes "Gear" (modes: Ranking, Compare, Upgrade cost); 8.5 screens. |
| 15 | Compare | 109 / 39 | **Merge** | Mode of Rankings; if forced to cut one page, this one (B, A14). |
| 16 | Food optimizer (beta) | 226 / 54 | **Merge** | Into Food; fix All-zones default and raw-meat pooling (D1, H7). |
| 17 | Crafting graph (beta) | 171 / 49 | **Hide** | Advanced; item pages already show inputs and "used in". Keep the lazy chunk. |
| 18 | My character (beta) | 291 / 73 | **Owner-only** | One-time setup, `.fch` talk (D7). Keep a "connect character" link on Next steps, which depends on it. |
| 19 | Check in game | 874 / 513-548 | **Owner-only** | Maintenance; keep the confirm mechanism untouched (H, G protect). |
| 20 | My portals | 549 / 75 | **Keep** | Strip is the surface; page can fold into Places later; show "goes nowhere" once, not per row (A13). |
| 21 | My world (beta) | 1,854 / 782 | **Owner-only** | Setup by file, but the owner's nearest-dungeon answer sits at y=2,534 px (A6): put a compact status and Places first, collapse setup; surface answers via Places. |
| 22 | Next steps | 296 / 71 | **Keep** | Core of "what now?"; fix the count (change 3); render icons once (D9). |
| 23 | Checklist | 1,148 / 2,234-2,269 | **Simplify** | Open on current zone only; zone-coloured bars (C14); 24-27 screens. |
| 24 | Progression | 756 / 144 | **Merge** | Into Next steps (B10). |
| 25 | Favorites | 91 / 36 | **Hide** | Advanced; show as "Pinned" on Home. |
| 26 | Console commands | 1,312 / 38 | **Hide** | Advanced; keep the table as the model of a plain table (C protect). Owner decides if it is for the kids (Q5). |
| 27 | Data trust | 413 / 100 | **Owner-only** | Maintainer; D found it unreadable ("seen in game vs read from game files"). |
| 28 | Update log | 115 / 37 | **Owner-only** | Near-empty between patches; show a "What's new" badge on Home. Its stored counts are stale (H12). |
| 29 | Profile & data | 61 / 40 | **Owner-only** | Backup and import must stay one tap from the header gear (gear is 16x29 px, C11). |

Totals: Keep 7, Simplify 4, Merge 8, Hide 4, Owner-only 6, Cut 0. No outright cuts because the problem is placement and wording, not data (B, agreed). Result: default menu of 10 (Home, Items, Recipes, Bosses, Food, Gear, Build, Places, Next steps, Checklist); 4 behind Advanced; 6 behind Owner.

---

## 4. Do NOT change

**The owner's data and the pages that carry it**
- Saved profile, character, world, portals, findings, checklist progress, backup and import. Never reset, clear, migrate destructively or "fix" (BRIEF 2). The G-01 fix must be additive: keep the old key readable, copy aside on failure.
- My character, My world, My portals pages and their parsers' defensive reading (`Reader.count()`, `need()`, "newer/older version" messages, G) and the world map and sail route (G-20: sound).
- The portals strip on every page (A, B, C).

**Things reviewers said earn their place**
- Ctrl+K and `/` palette, Recent items, Esc restoring focus, MiniSearch with AND-then-OR, typo handling, aliases kept in data (A, E).
- The quick card (FARM / USED FOR / MAKE with links on ingredients) as the answer surface (A, B, D).
- Bosses page and Next steps top block ("NEXT BOSS: EIKTHYR, Still needed...").
- Home hero and zone progress (shrink, do not remove); the Hearth page and Recently viewed (BRIEF 4 item 12; no reviewer examined Hearth, so assume protected).
- Dark-wood theme, Cinzel headings, parchment active state, page skeleton, zone colours (C, B).
- Phone bottom tab bar (Home, Search, Items, Planner, More): feed it the new menu, do not redesign it (B, C, D).
- "About this page" as a findable control (make quieter, reword, do not remove: D vs C6).
- Reduced-motion support, skip link, 2 px focus ring, `alt=""` icons beside text (C, F).
- Friendly "Page not found" and a first-run that works with empty storage (A, C, D).
- Console commands as the model plain table (C).

**Honesty machinery**
- `validate`, the dangling-id and shared-name tests, `dropped_recipes.json` and `dropped_piece_reasons.json`, the per-value GuideTag idea ("Source not confirmed" beats a wrong line), the Check-in-game rule that stores the confirmed text and reopens a line when it changes, boss summon costs read from altar prefabs (H, G).
- One derived graph and id-based references; pure tested computation modules (G).
- CLAUDE.md "Data rules", `UPDATE_AFTER_PATCH.md`, ARCHITECTURE "Computed values", README art disclaimer (I).

**Performance and QA assets**
- Lazy `GraphPage` chunk (extend the pattern), `assetsInlineLimit: 0` with lazy WebP icons, offline start, flat memory, CLS about 0, the QA gate and CI chain (F).

---

## 5a. Questions only the owner can answer

1. Which pages did you and your son open in the last week? (Nobody has usage data; B's "daily" ratings are judgement. Consider the local-only usage counter from BRIEF 8 so this is answered after two weeks.)
2. Do you ever go to **Recipes** by name, or would "Items, can craft" do? This decides B4 vs D3.
3. Do you want a "Kid" preset (8 entries) separate from the Owner/Advanced split, or one default for everyone?
4. Are **Console commands** for you, for the kids, or both? Is **Skills** a page you open?
5. Does the **beta** tag mean anything to you? Can Places, Food optimizer, Crafting graph, My character, My world drop it?
6. Do you leave the site open for days on the second monitor? (Decides how urgent F5 is.) Is a "new version, reload" notice acceptable?
7. Do you want icons available offline for items you never opened? (Precache slimming trades storage for that, F6.)
8. Do you rely on the **hoard** badges ("Must keep", "Safe to discard", "Keep some") when you play, or only Items/Next steps? (Decides whether to rework or delete the 72-item default.)
9. In game: can you eat raw Boar Meat or raw Deer Meat? (H7; two sources say no stats; the optimizer may pool them.)
10. In game 1.0: does a weapon or armour recipe at the crafting menu need a Battle or Protection Idol? (H could not resolve: bamboogaming lists it, PC Gamer says it is a Forge of Potential input; if the first is right every weapon and armour recipe is short one item.) Which game build do you run?
11. Should Norwegian labels exist for the kids? (BRIEF 8; no reviewer tested it.)
12. Are the "goes nowhere" portal warnings wanted on every row, or only when a portal really has no partner?
13. What is your second monitor's real window size beside the game? (Four reviewers assumed 1280x720; none could resize a real window.)
14. Before the data-safety package ships: please export your profile once from Profile & data as a backup (cheap insurance for G-01; the old key is not deleted by the bug but is unreachable from the UI).

## 5b. What the owner should record in the kid test (BRIEF section 9 not yet done)

Run the five tasks (Flint Axe needs; where to get Flint; next boss; what can I make with what I have; which food to eat) with no help. For each, write:
- Seconds to a correct answer, taps, scrolls, and whether search or the menu was used first; which page was opened by mistake; the exact moment of hesitation or giving up (and the page).
- The child's own words, verbatim, for every word they asked about or misread. Specifically note what they say about: "Keep some (50)", "unchecked" and "Unverified", "USED FOR" on a weapon, "Eitr", "Default" in the header, ".fch", the "Workbench: 4, Wood, 6, Flint" line (does it read as 4 workbenches? D2 is single-source).
- Whether they find "About this page" without a hint, and whether it helps.
- Which two or three menu entries they say they would press for "what do I eat", "what is next", "what can I make".
- Phone or monitor; Big text on or off; child's age and Valheim experience; whether the Food optimizer and Recipes defaults (late-game content) lose them.
- Anything they ask for that is not in the site (D and E saw none; H lists likely gaps: prices, farming, taming).

---

## 6. Package plan

One branch per package, repo format ("one package per session, one branch, one PR; plan first; stop at the acceptance test", I3). Correctness packages first; each package's first commit is its cheapest and most visible change.

### Package 1: `fix-wrong-answers` (changes 1, 2, 3)
- **Scope:** search returns one correct selected best match with no ids; filler USED FOR deleted; Next steps and Bosses show have/need.
- **Order inside the package:** (a) add `'key'` to `storeFields` and delete the `as unknown as` casts (one word, fixes all-rows-selected and the unreadable arrow keys); (b) delete `quick.ts:80`, the `fallback` field and `quick.test.ts:37-38`; (c) search ranking (exact-name bonus, prefix 0.9 over fuzzy 0.3, remove `id` field, row text, suggest floor); (d) advisor `have/need` plus Bosses chips; (e) guard optimizer against non-edible raw meat after the owner answers Q9.
- **Files touched:** `src/features/search/search.ts`, `SearchResults.tsx`, `CommandPalette.tsx`, `SearchPage.tsx`, `src/data/quick.ts`, `quick.test.ts`, `src/features/advisor/advisor.ts`, `AdvisorPage.tsx`, `advisor.test.ts`, the Bosses page, `tools/extract/build_data.py` (lines about 699-701; re-run extract and validate), `data/pieces.json:1567` (name `darkwood_beam_67`), `search.test.ts`.
- **Acceptance tests:** all 765 names find themselves first; exactly one `aria-selected="true"`; no CamelCase or snake_case in rows; "Bonemass" + Enter opens the boss; none of the 78 items shows a hoard word under USED FOR; Withered Bone shows 0 / 10; validate and test pass.

### Package 2: `fix-trust-and-data-safety` (changes 4, 5)
- **Scope:** no contradictory trust labels; owner profile survives a schema change; open tab learns about updates; no blank screen.
- **Order inside the package:** (a) G-01 first (`.strict()` to `.passthrough()`, keep broken profile aside, banner; add two load tests); (b) H3 (drop GuideTag and stale note for confirmed lines, remove the red item-level banner); (c) update check and reload notice, error boundary; (d) one state pill per Items row; (e) rename to three phrases (M, can follow in a second PR).
- **Files touched:** `src/state/model.ts`, `persistence.ts`, `store.ts`, `src/features/save/character.ts`, `UpdatePrompt.tsx`, app root for the error boundary, `ItemPage.tsx` (lines about 175-193 and 286-291), `src/data/quick.ts` (lines about 43, 58, 89), `Badges.tsx`, `src/features/trust/trust.ts`, `tools/extract/build_data.py` (about 719), Items list row component.
- **Acceptance tests:** profile with an extra field loads unchanged; corrupt profile kept under a `broken` key with a banner; no page contains "Verified in game" together with "unchecked" or "guide, not checked"; a tab open across a deploy shows the reload notice within a few minutes.

### Package 3: `calm-menu-and-home` (changes 6, 7)
- **Scope:** default menu of 10 with Advanced and Owner folds, beta dots removed, near-empty pages hidden until used, Home rebuilt as "what now?". No URL changes; docs-only commit adds the CLAUDE.md purpose and rules (I's rewritten top) so the menu limit is written down.
- **Order inside the package:** (a) tier flags in `routes.ts` and sidebar plus phone More sheet (visible in minutes); (b) beta dots to in-page tags; (c) Home: single search, Next up, portals strip from 1,100 px, pinned/recent, compact zones; (d) docs commit.
- **Files touched:** `src/app/routes.ts`, `App.tsx`, sidebar and `MobileTabs.tsx`, header (gear target, hide header search on Home), Home page, display settings, `CLAUDE.md`, `docs/` (archive move per I, optional).
- **Acceptance tests:** default menu has 10 or fewer entries with no scroll at 1280x720 and 390x844; Home at 1280x720 shows one search box, Next up and the portals strip without scrolling, with 12 or fewer links in `main`; owner pages reachable in two taps from the gear.

### Package 4: `filter-first-lists` (change 8)
- **Scope:** Items, Recipes, Checklist, Building open on a filter or current zone; capped rows on desktop too; Food and Food optimizer default to the player's zone; Recipes "Start here".
- **Files touched:** Items, Recipes, Checklist and Building pages, `useProgressive.ts`, Food and optimizer pages, list CSS (`content-visibility: auto` with `contain-intrinsic-size`), `tools/qa/budget.json` (add a DOM-node budget).
- **Acceptance tests:** each of the four pages settles under 500 ms at 4x CPU with fewer than 1,500 DOM nodes on first view; a fresh visitor sees Meadows-level foods first; Ctrl+F still finds rows below the cap.

### Package 5: `plain-words-and-findability` (changes 9, 10)
- **Scope:** shared search panel and real not-found; index Places, biomes, pages, commands; glossary rewrites; ingredient-count spacing; plain setup steps; Big text 125%; phone tables as cards.
- **Order inside the package:** (a) wording and recipe-line spacing (S, most visible to a kid); (b) shared `NoResults` and Places/page indexing; (c) Big text; (d) `ResponsiveTable` for Comfort, Rankings, Planner, Compare.
- **Files touched:** `SearchPanel`/`NoResults` (new shared component), `search.ts` indexing, `data/places.json` consumers, `QuickCard.tsx`, `ItemPage.tsx`, `AdvisorPage.tsx` About text, My world and My character setup copy, `src/styles` (Big text), a shared table component.
- **Acceptance tests:** "burial chamber", "haldor", "meadows", "console" each open the right page; unknown query shows "Not found" plus at most 3 real destinations; none of the 10 glossary phrases remains; Big text scales headings; no sideways scroll at 390 px on Comfort; (owner) re-run the kid test and compare to the first notes.

---

## 7. Assumptions and limits

**What could not be checked across all reports**
- No real child and no real kid-test notes (D is an AI; BRIEF 9 not done).
- No real 390x844 touch device and no real window resize: A's `resize_window` did not change the viewport; A, B, C, D, E measured in iframes of the target size (`pointer: fine`, so the 9 `pointer: coarse` rules in CSS were never exercised, C). Only F ran a true 1280x720 viewport, in headless Chrome for Testing 153 on localhost with a fresh profile (cold loads therefore optimistic; Playwright Chromium download was blocked).
- Big text was tested only by setting `data-screen="second"` in an iframe (A: Home only; C: all pages); the persisted setting was never toggled.
- First run was a sandboxed iframe without `allow-same-origin` (B, D, E): rendering and screenshots only, so first-run DOM counts are inferred from owner state, and the live first-run was never timed.
- The live site was not measured by F or H: F's 182-request check, update delivery and chunk-404 after a deploy are inferred from code (F5), H's UI claims are from code reading, and G proved only the profile load path for G-01, not the deploy sequence.
- Not examined by any reviewer: item-page repeated facts (pattern 6), Hearth page, Cards view of Items, keyboard focus order beyond `/`, Ctrl+K, Esc, Enter, memory on the owner's real state, forced colours, print, loading and offline-error states. F saw the first Tab stops land on Home zone cards, not the skip link, cause not found.
- Data: 40-entry sample, 24 with one source and 2 with none (many fandom/bamboogaming pages failed to load); 95% interval about 74-96%; bamboogaming, physgun and metabot largely share the game files, so they confirm the extraction, not game design (H). The remaining 1,280 entries were not audited. Game build vs 1.0.15 drift unresolved.
- Timings in A and D are estimates from tool-call sequences (A about 1 s per action, D 5-8 s per step), not stopwatch values.

**Method differences that explain apparent disagreements**
- Screens: A divides by 720, C by a 653 px scroll box, B did not measure; use ranges.
- Words/controls: owner state (A, B, C) vs fresh profile (F) differ by 1-12% (Items 6,392 / 6,468 vs 5,597 words); Recipes controls 2,580 (A, F) vs 1,726 (C, counts only visible).
- Sandbox and iframe isolation protected the owner's data (nothing was written to his storage), at the cost of being unable to read first-run DOM.
- E's ranking numbers (57 to 80 of 104) come from a throwaway prototype, indicative not final.

**Repo state:** `/home/claude/nobody174/valheim-site` was only shallow-cloned and never edited by this synthesis or by the reviewers (F, E and G worked in copies). Spot-checks in this document were read-only greps: `storeFields`, `.strict()`, `quick.ts:80`, `AdvisorPage.tsx:74`, `tools/qa/audit.ts` tap-target rule, `ItemPage.tsx` upgrade link, `routes.ts` (29 menu entries confirmed).
