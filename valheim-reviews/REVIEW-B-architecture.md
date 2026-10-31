# Review B: Information architect ("the cutter")

Date 2026-10-31. Live site plus `src/app/routes.ts`, `src/app/App.tsx`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`.

## Verdict
- It is a helper wearing a wiki's menu: 29 flat entries in 5 groups, where about 9 are daily play lookups and about 20 are databases, one-time setup, planning toys, or maintainer pages.
- Home is good at "pick a zone" but is not a "what do I do right now?" page. It shows 1 hero, 7 zone tiles, 7 tools, 8 browse chips and a recent strip, with 2 search boxes beside a 29-link sidebar.
- The fix is subtraction, not new features: 9 default entries, an Advanced fold, an Owner fold, and 4 merges. That cuts 29 visible entries to 9 for a first-time visitor, with no data removed.

## Assumptions
- Menu count verified: `routes.ts` has 30 `path:` lines, but one is the `RouteDef` interface field, so there are 29 real routes (1+9+7+8+4). Live sidebar shows 29 `nav a` at desktop. No discrepancy. Detail routes (`/item/:id`, `/creature/:id`, `/boss/:id`, `/station/:id`, `/piece/:id`, `/progression/:biome`) are not menu entries.
- Measurements were taken in a same-origin iframe of the owner's own browser (owner state, read-only: no clicks or writes, iframes removed). Word and control counts include roughly 70 words and 50 controls of shell (sidebar, header).
- First-run was verified in a sandboxed iframe without allow-same-origin (opaque origin, empty storage). It rendered, showing "Not started" on all zones and no Recently viewed. Numeric first-run counts are therefore the structure counts below minus the Recently viewed strip; I only took a screenshot there, not DOM counts.
- Page "screens" were not measured by me (the app scrolls an inner container, so document height was wrong). I reuse the earlier reviewer's screen counts as unverified hypotheses. My word and control counts for Items (6,468 words, 488 controls) and Recipes (5,810 / 2,615) agree with theirs within about 1 to 2 percent.
- I could not check usage. All "daily" ratings are judgement from play situations, not evidence. Section "Owner questions" lists what to ask.

## Scores (0 to 10)
| Area | Score | Reason |
|---|---|---|
| Menu size and grouping | 4 | 29 entries, 16 visible in a 720px-high sidebar, 13 below the fold. Groups are sensible but all five are open and equal in weight. |
| Overlap and duplication | 4 | Items / Recipes / Building, Creatures / Bosses / Trophies, Rankings / Compare / Upgrades each answer neighbouring questions. Home repeats 7 tools plus 8 chips that are also sidebar entries. |
| Home as "what now?" | 5 | Strong hero, zone progress and recent strip. But no answer to "what next?"; that lives on `/next`, a tile far down. |
| Separation of player vs owner/maintainer | 3 | Check in game, Data trust, Update log, Console commands, Profile & data, Favorites and My world sit in the same list as Items. |
| First-visit load | 5 | 130 words in `main`, 31 links in `main`, 2 search boxes, plus 29 sidebar links. Not heavy for words, heavy for choices. |
| Phone structure | 7 | Bottom tab bar (Home, Search, Items, Planner, More) is the right idea. Cost: three search entry points (header box, Home box, tab) and Home is about 3,000 px tall. |
| Empty-until-used pages | 5 | Compare, Favorites, Update log, Build planner, Next steps are near-empty on first use (see table), yet occupy full menu slots. |

## Counts: what a first-time visitor sees on load (Home, no saved data)
Measured on owner state; first-run differs only by the Recently viewed strip and zone progress numbers.

| Measure | 1280x720 | 390x844 |
|---|---|---|
| Menu entries in DOM | 29 sidebar links | 3 `nav a` visible plus 5 tab-bar links (Home, Search, Items, Planner, More); the rest behind More (36 visible links total on the page) |
| Menu entries in view without scrolling | 16 of 29 (sidebar is taller than the screen) | 5 tabs |
| Search boxes visible | 2 (header "Search", hero "Try: iron, Eikthyr, forge ...") plus `/` and Ctrl+K | 2 boxes plus the Search tab = 3 entry points |
| Tiles/cards in `main` | 7 zone tiles, 7 tool tiles, 8 browse chips, recent strip (8+ items) = 22+ | same, stacked; `main` is 3,018 px tall (3.6 screens) |
| Links in `main` | 31 | 31 |
| Words in `main` | 130 | 130 (148 incl. shell) |
| Words on whole screen incl. sidebar | 206 | 148 |
| Controls (links, buttons, inputs) | 67 | 36 links visible |
| First-run screenshot (sandboxed, empty storage) | Hero + 4 zone tiles in view, all "Not started" | not captured |

Observation: the first visitor sees 16 menu labels, a search box in the hero, a second search box in the header, and 4 to 7 zone tiles at once. The actual question "what do I do now?" has no visible answer until "Next steps" (tool tile 2 of 7, below the fold).

## The 29-row table
Words/controls are measured at 1280x720, owner state, shell included (about 70 words and 50 controls). "Daily" = would a player open it mid-game.

| # | Entry | Group | Words / controls | Class | Play situation that justifies it |
|---|---|---|---|---|---|
| 1 | Home | start | 206 / 67 | Simplify | Opening the site beside the game: should show search, "next up" and pinned/recent, not 22 tiles. |
| 2 | Items | lookup | 6,468 / 488 | Keep (simplify: filter-first) | "What is this thing I picked up, and what is it for?" The core page, but it opens on a full wall of rows; should open on category + search. |
| 3 | Recipes | lookup | 5,810 / 2,615 | Merge into Items (as a tab or filter "Can be crafted") | "What do I need to make a Flint Axe?" is answered by the item page's MAKE line. The 2,615-control list duplicates Items' data from another direction. |
| 4 | Building | lookup | 2,969 / 906 | Keep, renamed "Build" and merged with Comfort and Build planner as tabs | "What pieces do I place and what do they cost?" Distinct data (pieces), but three pages for one activity. |
| 5 | Creatures | lookup | 609 / 237 | Merge with Bosses and Trophies into "Creatures and bosses" | "What is that thing, how do I kill it, what does it drop?" Bosses are creatures with more fields. |
| 6 | Bosses | lookup | 208 / 66 | Keep (promote to default menu) | "Before a boss: what do I need and do I have it?" Protect: the best page. Keep as its own entry because the loop is so common, even if creatures merge under it. |
| 7 | Trophies | lookup | 508 / 136 | Merge into Bosses/Creatures (as a tab "Trophies") | "Which trophy do I need for the altar?" One question, answered inside Bosses and per creature drop. |
| 8 | Food | lookup | 815 / 115 | Keep (default) | "What do I eat before this fight?" Frequent mid-game, short page. Fold the Food optimizer into it. |
| 9 | Skills | lookup | 589 / 114 | Hide behind Advanced | "How do skills level?" Reference read once; not an in-the-moment lookup. |
| 10 | Places (Dungeons, beta) | lookup | 1,075 / 45 | Keep (default), merge with Portals as one "Places and portals" | "Where is that dungeon and which portal gets me near?" Real owner loop. Beta tag should go once checked. |
| 11 | Build planner | plan | 115 / 44 | Merge into Building (tab "Plan") | "Plan a build and list what is missing." Empty (115 words, 3 inputs) until used; same activity as Building. |
| 12 | Comfort | plan | 528 / 107 | Merge into Building (tab "Comfort") | "Is my room comfy enough for rested?" One question, used rarely. |
| 13 | Upgrades | plan | 414 / 36 | Merge with Rankings and Compare into "Gear" | "What does Iron Sword level 3 cost?" Upgrade costs are also on item pages. |
| 14 | Rankings | plan | 1,336 / 128 | Merge into "Gear" (with Compare, Upgrades) | "What is my best weapon right now?" Frequent early in a zone, then rare. |
| 15 | Compare | plan | 109 / 39 | Merge into "Gear" (as a mode of Rankings) | Near-empty until two items are picked (109 words). Comparison is a mode of ranking, not a destination. |
| 16 | Food optimizer (beta) | plan | 226 / 54 | Merge into Food | "Best three foods" is a view of Food, not a separate place. |
| 17 | Crafting graph (beta) | plan | 171 / 49 | Hide behind Advanced | A diagram for curiosity; no mid-fight question needs it. Item pages already show inputs and "used in". |
| 18 | My character | mygame | 291 / 73 | Move to Owner area | One-time setup ("read my save file"), then a status. Not for the kids. |
| 19 | Check in game | mygame | 874 / 548 | Move to Owner area | Maintenance: verifying data against the game. Exactly a maintainer page. |
| 20 | My portals | mygame | 549 / 75 | Keep, merge with Places | "Which portal is near the Elder's arena?" Owner daily-use; the Home strip is the main surface. Needs a place on the default menu or Home strip only. |
| 21 | My world | mygame | 1,854 / 782 | Move to Owner area | Setup by `.db2` file, then a map. Valuable but personal and file-based; kids do not need it. |
| 22 | Next steps | mygame | 296 / 71 | Keep (default; becomes the core of Home) | "What do I do right now?" This is the single most on-purpose page and it is hidden as tile 2 of 7. |
| 23 | Checklist | mygame | 1,148 / 2,269 | Simplify and keep as "Checklist" (default) | "Did I do everything in Meadows?" Useful, but 2,269 controls. Should open on the current zone only. |
| 24 | Progression | mygame | 756 / 144 | Merge into Next steps | Same question as Next steps ("what comes after this zone?") with more text. |
| 25 | Favorites | mygame | 91 / 36 | Hide behind Advanced; show as "Pinned" on Home | Empty until used (91 words). The idea is right, the page is not: pinned items belong on Home. |
| 26 | Console commands | reference | 1,312 / 38 | Hide behind Advanced | Needed rarely, only for the owner (singleplayer cheats). Not for a 10-year-old. |
| 27 | Data trust | reference | 413 / 100 | Move to Owner area | "Check that the data matches the game." Maintainer. |
| 28 | Update log | reference | 115 / 37 | Move to Owner area (show a "What's new" badge on Home instead) | "What changed in the last patch?" Near-empty (115 words) between patches. |
| 29 | Profile & data | reference | not captured (last in run) | Move to Owner area, with a persistent small gear in the header | Backup, import, profiles. One-time. Already has the header gear. |

Class counts: Keep 6 (Items, Bosses, Food, Places, Next steps, Checklist; My portals joins Places), Simplify 1 more (Home), Merge 13, Hide behind Advanced 5 (Skills, Graph, Favorites, Commands plus Trophies is merged, not hidden), Owner 6 (Character, Check in game, World, Data trust, Update log, Profile), Cut 0. I recommend no outright cuts: the data and pages are not the problem, their placement is. If forced to cut one, cut Compare (109 words until used; Rankings covers it).

## Overlap analysis
- **Items vs Recipes vs Building.** Items has 6,468 words and 488 controls; Recipes has 5,810 words and 2,615 controls (the site's heaviest page); Building has 2,969 words and 906 controls. Each item page already carries a MAKE line (the quick card), "used in" and the station. A player asks "what is this", "how do I make it", "what can I make with it": all three are one object, the item. Recipes is a second front door onto the same graph (ARCHITECTURE: "one graph, many views"). Building pieces are in search too. Recommendation: Items gets a filter row (All, Weapons, Armor, Food, Materials, Tools, Can craft, Pieces) and Recipes becomes the "Can craft" view of it.
- **Creatures vs Bosses vs Trophies.** Three pages (609 + 208 + 508 words) over linked data: boss pages reuse the creature page component (`<CreaturePage boss />` in `App.tsx`), and trophies are creature drops. Bosses should stay a named entry because the pre-boss loop is the best-supported one; Creatures and Trophies become tabs on a single "Creatures" page, or Trophies becomes a filter in Bosses ("trophies needed for altar").
- **Rankings vs Compare vs Upgrades.** Rankings (1,336 words) sorts all gear by Rating; Compare (109 words, empty until two are chosen) is a two-item view of the same stats; Upgrades (414 words) is the cost half of the item page. One "Gear" page with three modes (Ranking, Compare, Upgrade cost) answers "which weapon, and what does the next level cost". Upgrade costs already appear on item pages.
- **Food vs Food optimizer.** Optimizer (226 words, beta) is a button on Food, not a place.
- **Build planner vs Comfort vs Building.** The planner has 115 words and 3 inputs before use; Comfort has 528. Both start from the Building data; one "Build" entry with three tabs.
- **Next steps vs Progression vs Checklist vs zone tiles on Home.** Four ways to answer "where am I in the game". Zone tiles show found counts (49 / 65), Progression is the long guide, Checklist is the 2,269-control tick list, Next steps is the advice. Keep Home zones + Next steps + Checklist; fold Progression into Next steps.

## Destinations reachable several ways
Counted from the live Home, 1280x720:
- Items, Recipes, Food, Trophies appear in the sidebar AND as Browse chips on Home (Weapons, Armor, Food, Materials, Trophies, Tools, Recipes, Must keep): 4 of 8 chips are menu duplicates; the other 4 are filters of Items.
- Build planner, Next steps, Crafting graph, Compare, Food optimizer, Rankings, My character, Dungeons: all 7 to 8 "Handy tools" tiles are sidebar entries too (my count of tiles: Build planner, Next steps, Crafting graph, Compare, Food optimizer, Rankings, My character, Dungeons = 8).
- So at least 12 destinations have 2 doors on Home alone, plus the phone tab bar (Items, Planner, Search) = 3 doors for Items and Planner on a phone.
- Search: header input, hero input, `/`, Ctrl+K, phone Search tab. Two always-visible boxes on desktop and phone; the hero one is the better one.
- Boss pages: Bosses entry, zone tiles ("Boss: Eikthyr"), Trophies, creature pages. That is fine (different questions), but it makes a single "boss" entry on Home more valuable than 8 chips.

## Empty-until-used pages (words at 1280x720, shell about 70)
Compare 109, Build planner 115, Update log 115, Favorites 91 (all effectively empty), Graph 171, Optimizer 226, Next steps 296 (answers only with a saved character), My character 291. Four of these sit in the default menu with nothing to read for a first-time visitor, and a first-time visitor cannot tell why they should click them.

## Maintainer / one-time pages in the player menu
Check in game (548 controls), Data trust, Update log, Profile & data, Console commands, My world (setup by file), My character (setup by file). Seven of 29 entries are not for a 10 to 12 year old. They sit between "Favorites" and "Console commands" at the bottom of a sidebar that is taller than a 720px screen, so they are mostly out of view; the cost is the 13 unreachable-without-scroll labels, not the labels' size.

## Proposed default menu (9 entries)
Ordered by the play loop, each with the question it answers, in kid words.

1. **Home**: "What now?" (search, next up, pinned, recent, portals strip)
2. **Items**: "What is this? How do I get it? What can I make with it?" (absorbs Recipes)
3. **Bosses**: "What do I need for the next boss?" (absorbs Trophies and Creatures as tabs, or keep Creatures as a tab on this page)
4. **Food**: "What do I eat?" (absorbs Food optimizer)
5. **Gear**: "Which weapon or armor is best?" (absorbs Rankings, Compare, Upgrades)
6. **Build**: "What can I build and what do I need?" (absorbs Building, Build planner, Comfort)
7. **Places**: "Where is it and which portal?" (absorbs My portals)
8. **Next steps**: "What do I do now?" (absorbs Progression)
9. **Checklist**: "Did I get everything here?" (opens on the current zone)

Below a divider: **More** (Advanced), **Owner** (settings). Nine entries fit inside a 720px sidebar with no scroll; on a phone they become the existing bottom bar (Home, Search, Items, Planner, More) with More opening this list.

## Proposed Home ("what do I do right now?")
Top to bottom, 1280x720 should show all of it without scrolling:
1. One search box (remove the header duplicate on Home; keep `/` and Ctrl+K).
2. **Next up** card: the first line from Next steps ("Next: kill Eikthyr. You hold 4 of 4 Deer Trophy materials" style), one button to the boss page. Needs the saved character; first-run text: "Pick a zone to start" with the zone tiles.
3. **Portals strip** and **Pinned/Recent** (one row of chips, max 8).
4. **Zones** as a single compact row (7 chips with progress), not 7 tiles.
5. A "More" fold: the 8 tool tiles and 8 browse chips move behind it, because each duplicates a menu entry.
Target: about 60 words and 12 links in `main` (from 130 words and 31 links), at most one search box visible.

## Default vs Advanced vs Owner split
| Tier | Entries | Who and when |
|---|---|---|
| Default (9) | Home, Items (+Recipes), Bosses (+Creatures, Trophies), Food (+Optimizer), Gear (Rankings, Compare, Upgrades), Build (Building, Planner, Comfort), Places (+Portals), Next steps (+Progression), Checklist | Anyone, mid-game. |
| Advanced (5 entries behind "More") | Skills, Crafting graph, Favorites (shown as "Pinned" on Home by default), Console commands, plus beta tags on anything unfinished | The owner, curious players; hidden for a "Kid" preset. |
| Owner (6 entries behind a gear) | My character, My world, Check in game, Data trust, Update log, Profile & data | The owner, once; each presented as a three-step setup or a status line, no file paths on the default view. |

Rule to enforce: an entry is Default only if a player would open it mid-game and get an answer in 10 seconds.

## Findings
| ID | Severity | Evidence | Fix | Effort |
|---|---|---|---|---|
| B1 | High | 29 flat sidebar entries; only 16 in view at 1280x720; `ROUTE_GROUPS` in `src/app/routes.ts` lists all 5 groups open. | Default menu of 9, Advanced and Owner folds (split above). | M |
| B2 | High | Seven maintainer or one-time pages (Check in game 548 controls, Data trust, Update log, Profile, Commands, World 782 controls, Character) share the player menu. | Group "Owner" behind the header gear, hidden from a Kid preset. | S |
| B3 | High | Home has 31 links and 130 words in `main`: 22+ tiles and chips, all of which duplicate sidebar entries (12 destinations with 2 doors, measured). The one "what now?" tool (Next steps) is tile 2 of 7. | Rebuild Home as search + Next up + pinned/recent + portals + compact zones; the rest behind "More". | M |
| B4 | High | Recipes 5,810 words / 2,615 controls duplicates the item's MAKE line and "used in"; Items 6,468 / 488. | Make Recipes a filter of Items ("Can craft"), open Items on category + search. | M |
| B5 | Med | Creatures 609, Bosses 208, Trophies 508 words, and `<CreaturePage boss />` is the same component. Three menu slots for one object type. | One entry with tabs: Bosses (default), Creatures, Trophies. | M |
| B6 | Med | Rankings 1,336, Compare 109, Upgrades 414 words are modes of one gear question. Compare is near-empty until used. | One "Gear" page with three modes. | M |
| B7 | Med | Build planner 115, Comfort 528, Building 2,969 words: same activity, three entries. | One "Build" page with tabs. | M |
| B8 | Med | Two search boxes visible on Home at 1280x720, and on phone the Search tab as a third door. | Hide the header search on Home; keep one box. | S |
| B9 | Med | Four near-empty pages in the menu: Compare 109, Planner 115, Update log 115, Favorites 91 words. | Merge or fold; show pinned on Home; "What's new" badge instead of the log. | S |
| B10 | Med | Progression (756 words) and Next steps (296) and Checklist (2,269 controls) all answer "where am I". | Fold Progression into Next steps; Checklist opens on the current zone only. | M |
| B11 | Low | Food optimizer, Crafting graph, My world, My character, Places carry "beta"; beta tags in the main menu tell a kid "might be wrong". | Move beta pages behind Advanced/Owner until the tag can be dropped. | S |
| B12 | Low | Skills (589 words) and Console commands (1,312) are reference reads, not mid-game lookups. | Advanced fold. | S |
| B13 | Low | My portals is both a menu entry and (for the owner) a Home strip. | Keep the strip on Home, merge the page into Places. | S |
| B14 | Low | Phone Home `main` is 3,018 px tall (3.6 screens at 844 px) because the same 22+ tiles stack. | The Home rebuild in B3 should be at most 1.5 screens. | S |

## Protect this
- Bosses page (208 words, 66 controls): the most answer-dense page. Do not merge it away, only gather its siblings under it.
- Home hero and zone progress ("49 / 65 found"): it works as orientation; keep it, make it smaller.
- The consistent dark-wood theme and page skeleton (H1, hero, content) seen across all pages I loaded.
- The phone bottom tab bar (Home, Search, Items, Planner, More): the right idea, just feed it the new 9.
- Recently viewed strip and the owner's saved data pages (character, world, portals): personal, intentional; moving them to an Owner area does not remove them.
- Item quick card (FARM / USED FOR / MAKE) as the single answer surface that makes Recipes redundant.
- `/` and Ctrl+K search shortcuts.

## Could not check
- Real first-run DOM counts: the sandboxed iframe (no allow-same-origin) rendered but cannot be read by script, so first-run was verified by screenshot only; counts above are from the owner-state structure.
- Real 390x844 device: measured in a same-origin 390x844 iframe (Home only); no tab-bar layout screenshot, no other pages at phone width.
- "Big text" mode not tested.
- Page screen counts (document scroll is inside an inner container); I used the earlier reviewer's counts as hypotheses.
- Profile & data page numbers (the measuring run had not reached it); marked "not captured".
- The order of reality: no usage data. I classify by play situation, not by what the owner and son actually open.
- Owner questions for synthesis: which pages he actually opens in a week; is a Kid preset wanted; is Console commands for him or the kids; may Recipes become a filter of Items (does he search by "recipes" in his head); is the beta tag meaningful to him.
