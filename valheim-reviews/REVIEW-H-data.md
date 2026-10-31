# REVIEW-H: Data auditor and fact-checker (pattern level)

Reviewer role H. Date 2026-10-31. Repo read-only. No browser used. Sources: repo `/data/*.json`, `src/`, `tools/extract/`, plus WebFetch/WebSearch.

## Verdict

1. The numbers are good: 35 of 40 sampled entries agree with outside sources (88% of all 40; 92% of the 38 I could check). The data is mostly game-file values, not guesses.
2. The labels around the numbers are the weak part. "Verified in game" is stamped on a whole entry after one line was checked (83 entries). "Unverified" is stamped on entries whose numbers come from game files (60 entries). 18 item pages can show "Verified in game" and "guide, not checked" together.
3. "Safe to discard" and "Must keep" used as USED FOR are a build-script fall-through, not advice, and the UI never marks them as filler. 78 items show a filler USED FOR line. 56 foods and meads get "Safe to discard" (e.g. Mashed Meat, Major Healing Mead).

## Assumptions

- `seed` for the sample: Python `random.seed(20261031)`, `random.sample` over (a) items of category material, tool, trophy, weapon, armor or trinket, (b) all recipes, (c) all pieces, (d) all foods, (e) all creatures. Counts: 12 items, 8 recipes, 8 building pieces, 6 foods, 6 creatures = 40.
- "Independent source" means a site that is not the repo's own extract. Caveat: bamboogaming, physgun and metabot are mostly datamined from the same game files, so they confirm the extraction pipeline, not the game design. The fandom wiki is hand-edited and is the only truly separate source.
- Many fandom, bamboogaming and eip.gg pages returned `client_error` (rate limit or slug mismatch), so only about 14 of 40 entries got two sources (see the table). The rest have one source. I count "agree" when every value the source showed matched.
- I did not open the live site. All UI claims come from reading `src/`. Where I say "can show", I traced the render path in code; I did not screenshot it.
- "In-game" and "cross-checked" are the data values from `verified`. The UI shows them as "Verified in game" and "From game files" (`src/components/Badges.tsx:6-10`).

## Scores (0 to 10)

| Area | Score | Reason |
|---|---|---|
| Numeric accuracy (stats, recipes, costs) | 8.5 | 35/38 checkable agree. All 8 building pieces and 7 of 8 recipes agree. The three misses are pattern bugs, not random errors (below). |
| Completeness of what a mid-game player needs | 5 | Strong on recipes, stats, drops, places, world. Nothing on prices, farming, taming, raids, smelting rates, 1.0 forge upgrades. See missing-data list. |
| Trust-label honesty | 4.5 | Raw file data is honest and the "guide, not checked" tag per hand-written value is a good idea. But the entry-level label is wrong in both directions and the vocabulary is too large (7 phrases). |
| Filler and advice quality | 3.5 | The hoard label doubles as advice. 72 items default to "Safe to discard" through an `else:` branch. The `fallback` flag exists but nothing reads it. |
| Reachability of data | 6 | The recipe, "used in" and "where found" data exist, but on a phone the "Where found" block and the trust badge sit inside the collapsed "More details" fold. |
| Process (validate, tests, dropped-recipe logs, spot-check list) | 8 | Unusually good. `dropped_recipes.json`, `dropped_piece_reasons.json` with a test that fails without a reason, and the Check-in-game ticking are strong. |

## Agreement rate

- Agree 35, disagree 3, unable to verify 2. Rate = 35/40 = 87.5%, or 35/38 = 92.1% of checkable entries.
- Two or more sources: 14 entries (Flesh Rippers, Silver, Sap, Dvergr Lantern recipe, Longship, Purple Banner, Deer Stew, Sparkling Shroomshake, Mashed Meat, Fuling, Fallen Valkyrie, Club, Boar Meat, Bronze partly). One source: the other 24. Zero usable: 2.

### Per-entry record

| # | Kind | Entry | Site says | Result | Source(s) |
|---|---|---|---|---|---|
| 1 | item | Flesh Rippers (FistFenrirClaw) | Forge L3; 10 Fenris Hair, 6 Fenris Claw, 10 Silver; 60 slash; upgrade +1 each | Agree | fandom, bamboogaming |
| 2 | item | Charred Bone | w 0.5, stack 50, 4 Charred drops | Agree (names differ: Archer = Marksman, Mage = Warlock, Melee = Warrior) | bamboogaming |
| 3 | item | Copper Knife | Forge L1; 2 Wood, 8 Copper; 12 slash + 12 pierce | Agree | bamboogaming |
| 4 | item | Carapace Arrow | Black Forge L1; 4 Carapace, 2 Feathers, 8 Wood; makes 20 | Agree (damage 72 not shown by source) | bamboogaming |
| 5 | item | Silver | w 14, stack 30, smelter | Agree | metabot, fandom |
| 6 | item | Lox Fur Jacket | Workbench L2; 5 Pelt, 8 Bone, 2 Root; armor 16, +2 | Agree | bamboogaming |
| 7 | item | Bronze | Forge L1; 2 Cu + 1 Sn (x1) and 10 + 5 (x5); w 12, stack 30 | Agree | bamboogaming (fandom page has no numbers) |
| 8 | item | Club | No station (by hand), 6 Wood | Sources disagree: bamboogaming "character crafting" matches the site; fandom table says Workbench. Counted as disagree because the site cannot be right for both. | bamboogaming, fandom |
| 9 | item | Sap | w 0.2, stack 50, Sap Extractor on Yggdrasil roots | Agree | fandom, bamboogaming |
| 10 | item | Linen Cape | Workbench L2; 20 Linen Thread + 1 Silver; armor 1 | Agree | bamboogaming |
| 11 | item | Draugr Elite Trophy | w 1, stack 20, 10% from Draugr Elite | Agree | bamboogaming |
| 12 | item | Black Metal | w 12, stack 30, Blast Furnace | Agree | bamboogaming |
| 13 | recipe | Lox Fur Jacket | as above | Agree | bamboogaming |
| 14 | recipe | Dvergr Lantern | Black Forge L1; 2 Bronze, 1 Surtling Core, 1 Crystal | Agree | bamboogaming, fandom (station only) |
| 15 | recipe | Mead Base: Minor Healing | Mead Ketill; 10 Honey, 5 Blueberries, 10 Raspberries, 1 Dandelion | Agree | bamboogaming |
| 16 | recipe | Bone Bolt (x20) | Black Forge L1; 8 Bone Fragments, 2 Feathers | Agree | bamboogaming |
| 17 | recipe | Skoll and Hati | Black Forge L1; 4 Finewood, 10 Iron, 10 Black Metal | Agree | bamboogaming |
| 18 | recipe | Lightfoot Mead | Fermenter; 1 Mead Base: Lightfoot | Unable to verify (page 404) | none |
| 19 | recipe | Wood Shield | Workbench L1; 10 Wood, 4 Resin, 4 Leather Scraps | Agree | bamboogaming |
| 20 | recipe | Fenris Hood | Workbench L2; 20 Fenris Hair, 2 Wolf Pelt, 1 Cultist Trophy | Agree | bamboogaming |
| 21 | piece | Longship | Workbench; 100 Iron Nails, 10 Deer Hide, 40 Finewood, 40 Ancient Bark | Agree | bamboogaming; fandom (workbench) |
| 22 | piece | Purple Banner | Workbench; 6 Leather Scraps, 2 Finewood, 2 Blueberries, 3 Raspberries | Agree | bamboogaming, metabot |
| 23 | piece | Wood Stairs | Workbench; 2 Wood | Agree | bamboogaming |
| 24 | piece | Bronze Stack | No station; 30 Bronze | Agree | bamboogaming |
| 25 | piece | Dvergr Wall Lantern | Black Forge; 2 Copper, 1 Dvergr Lantern, 1 Chain | Agree | bamboogaming |
| 26 | piece | Thatch Roof 45 deg | Workbench; 2 Wood | Agree | bamboogaming |
| 27 | piece | Ashwood Wall 67 deg (Inverted) | Workbench; 2 Ashwood | Agree | bamboogaming |
| 28 | piece | Ashwood Divider | Workbench; 2 Ashwood | Agree | bamboogaming |
| 29 | food | Boar Meat (raw, id RawMeat) | Food: 20 health, 20 stamina, 10 min, regen 1 | Disagree: bamboogaming says raw boar meat is a material with no food stats; fandom food table lists only Cooked Boar Meat | bamboogaming, fandom |
| 30 | food | Deer Stew | 45/15, 25 min, regen 3 | Agree | fandom, bamboogaming |
| 31 | food | Raspberries | 7/20, 10 min, regen 1 | Agree | bamboogaming |
| 32 | food | Sparkling Shroomshake | 30/15, Eitr 90, 25 min, regen 4 | Agree | fandom, bamboogaming |
| 33 | food | Tasty Mead | Less health regen, more stamina regen, 10 s | Agree | eip.gg (bamboogaming shows 0 placeholders) |
| 34 | food | Mashed Meat | 100/34, 25 min, regen 6 | Agree | fandom, bamboogaming |
| 35 | creature | Cultist | 200 HP; drops only the trophy (10%) | Disagree: physgun (1.0.15 files) lists Red Jute 1 to 3 always; the site has no Red Jute item | physgun |
| 36 | creature | Fuling | 175 HP; Coins 5 to 10 (25%), scrap 1 to 2, trophy 10% | Agree (fandom shows coins 5 to 9; physgun 5 to 10) | physgun, fandom |
| 37 | creature | Bonemaw | 1100 HP; trophy 33%, meat 6 to 8, tooth 8 to 10; frost weak | Agree | physgun |
| 38 | creature | Charred Marksman | 200 HP; Charred Bone 1 to 3; trophy 5% | Agree (site "very resistant" fire vs source "resistant") | physgun |
| 39 | creature | Fuling Archer | 175 HP | Unable to verify (page 404) | none |
| 40 | creature | Fallen Valkyrie | 1500 HP; feather 2 to 4; trophy 5% | Agree (fandom shows feather 2 to 3) | physgun, fandom |

## Patterns behind the three disagreements, and how many entries share them

- P-A. Food stats on non-edible raw materials. The foods file lists 8 items whose category is `material` (RawMeat, DeerMeat, Honey, Blueberries, Raspberry, Carrot, Mushroom, MushroomYellow). Honey, berries, carrot and mushrooms are edible. Raw Boar Meat and raw Deer Meat are probably not, per my two sources. The food optimizer (`src/features/food/FoodOptimizerPage.tsx:17`) filters only on `kind === 'food'`, so it can pool them. Confidence: medium; I could not play-test it.
- P-B. Unconfigured items vanish from drop tables. Cultist has no Red Jute because Red Jute is not an item in the data (`tools/extract/dropped_piece_reasons.json` says "Needs Red Jute, dropped by the Fenring Cultist, which is not in any biome config yet"). The Cultist page therefore reads "drops its trophy" and looks complete. Same pattern for Blue Jute (3 pieces), Pot Shards (3), Timberwood (2): 10 dropped pieces name a missing item. The docs claim "checked every resolved drop table" but a drop of an unlisted item is not "resolved", so it is not shown.
- P-C. Two drop-range conventions. 64 of 146 drops are ranges. Fandom shows Fuling coins 5 to 9 and Valkyrie feather 2 to 3; physgun and the site show 5 to 10 and 2 to 4. The site never says whether the max is inclusive. Low risk, but the player may plan with the wrong top number.
- P-D. Conflicting sources are not recorded. Club is the one example; no field records "sources disagree" even though the older docs say so for shelter comfort. Because the extract is one source, the site cannot show a disagreement it never looked for.

## Trust-label audit

Numbers from `data/*.json` (counted by script):

| Level | Items | Recipes | Weapons | Armor | Foods | Creatures | Bosses | Pieces | Stations/Trophies | Total |
|---|---|---|---|---|---|---|---|---|---|---|
| in-game | 36 | 16 | 10 | 8 | 5 | 6 | 2 | 0 | 0 | 83 |
| cross-checked | 357 | 266 | 92 | 47 | 63 | 38 | 5 | 242 | 67 | 1,177 |
| unverified | 53 | 0 | 0 | 0 | 0 | 7 | 0 | 0 | 0 | 60 |

Overall 1,320 entries. 89% carry a level named "cross-checked" that means "one source, the game files" (`docs/DATA_SOURCES.md:131`, `src/features/trust/trust.ts:20-25`). Nothing in the data was compared against a second source by the build. The UI wording "From game files" (`Badges.tsx:8`) is honest; the data value, CLAUDE.md and the docs say "cross-checked", which a reader will take as two sources. I did the real cross-check in this review (above).

Findings on honesty:

1. A whole-entry "Verified in game" comes from one ticked line. `confirmed.json` has 65 keys: 18 `where`, 18 `gear`, 16 `recipe`, 6 `creature`, 5 `food`, 2 `boss`. `apply_checks.py` and the builder promote the entry to `in-game` when its line is ticked. Example: Boar, Deer, Neck, three Greydwarfs are "Verified in game" but only their drop lines were ticked; their attacks and resistances were not. 83 entries are affected.
2. The 18 `where`-confirmed items (Acorn, Axe Head 1 and 2, Beech Seeds, Birch Seeds, Blueberries, Carrot Seeds, Copper Ore, Dandelion, Ancient Bark, Feathers, Fine Wood, Fir Cone, Yellow Mushroom, Pine Cone, Round Log, Thistle, Tin Ore) carry a stale note: "Where to find it was written by hand and not checked" (`build_data.py:719-720`; the note is added whenever the source is curated, regardless of confirmation). In the UI:
   - `ItemPage.tsx:286` prints `VerifiedBadge` "Verified in game" with the note as tooltip.
   - `ItemPage.tsx:175-193` prints `<GuideTag />` ("guide, not checked") on every gather, trader, found and other line.
   - `quick.ts:43` sets `guide: true` for every written source, and `QuickCard.tsx:60` shows the chip "unchecked".
   So the Acorn item page can say "Verified in game", "unchecked" and "guide, not checked" together. The pre-flagged claim "contradicting trust labels can appear on one page" is confirmed with this pattern, 18 pages.
3. The opposite error: "Unverified" on entries whose numbers are file-derived. 53 items are "Unverified" because the "where" line is hand-written; weight and stack are from the files. `ItemPage.tsx:289-291` then prints a red "Unverified: Weight and stack size come from the game files. Where to find it was written by hand and not checked." The label and its own explanation disagree. 11 of those 53 have a drop line that is from game files, and `quick.ts:58` flags that drop line "unchecked" too (`guide: item.verified === 'unverified'`). The same happens in `makeLine` (`quick.ts:89`), though no unverified item currently has a recipe. 7 creatures are "Unverified" because only the zone is a guess (Cultist, 5 Dvergr types, Charred Mage); their health, drops and attacks are from files.
4. Vocabulary count: seven trust phrases can be on screen. Data: unverified, cross-checked, in-game. Badge: Unverified, From game files, Verified in game. Quick card: "unchecked". Tag: "guide, not checked". Trust page: "seen in game", "read from the game files", "written by hand, not checked". Progression: "Not checked in game yet". Check page: confirmed / changed / open. A child cannot map these to one idea.
5. Good: boss summon costs now state `summonFromFiles` and drop the guide tag; Check-in-game stores the text that was confirmed and turns a line back to "changed" if the text later changes (`spotcheck.ts:rowStatus`). Keep both.
6. Stale doc: `DATA_SOURCES.md:46` says Carrot Seeds and Elder Bark have no source. The data now has guide-tagged sources for both (the ROADMAP says so). Low.

## Filler advice audit

- Pre-flagged claim: 78 items show the hoard label as USED FOR. Confirmed. I reproduced the `usedForLine` logic from `src/data/quick.ts:60-80` over the data: 78 items have no weapon/armor/food data, no recipe that uses them, and no `use` text, so they fall to `HOARD_LABEL[item.hoard]`.
- Breakdown of the 78 by label: Decorative 30, Must keep 16, Safe to discard 15, Gear 10, Keep some 7. By category: 32 trophies, 25 materials, 11 tools, 10 trinkets.
- The flag is set but never used: `QuickLine.fallback` (`quick.ts:13`, set at `quick.ts:79`) is read only by one unit test (`quick.test.ts:37`). `QuickCard.tsx` does not look at it, so the filler renders like real advice.
- Where the label comes from: `tools/extract/build_data.py:699-701`. The chain is curated keep_some, curated must_keep, gear for weapons/armor/trinkets, a derived rule (summon item, tool, or used as an ingredient), trophy to decorative, and finally `else: 'safe_discard'`. Only 11 config entries per zone are curated (7 to 14 must-keep). So "Safe to discard" means "no rule matched".
- Wrong or doubtful advice that results (examples of the pattern, with counts):
  - 56 of 72 "Safe to discard" items are foods and meads (42 foods, 14 meads): Mashed Meat (100 health), Major Healing Mead, Fish Wraps, Sparkling Shroomshake. These are eaten, not discarded, and they never feed another recipe, so the derived rule never gives them keep_some.
  - Perch and Pike are "Safe to discard", but the Raw Fish recipe is not modelled (`anyOneOfNotModelled`), so the site cannot see that any fish makes Raw Fish.
  - Kindled Ribs (Fader) and Torn Spirit (Yagluth) are "Safe to discard" boss drops; I could not verify their use, but a wrong "discard" on a boss drop is the worst case of this pattern.
  - Dragon Egg shows USED FOR "Must keep" instead of "Summons Moder", although the item page elsewhere says "Used to summon". Same for Fuling Totem and Withered Bone (the summon is known to the builder at `build_data.py:670-672`).
  - Carrot Seeds: "Safe to discard" while the same quick card says "Plant it on cultivated ground to grow Carrots".
  - 30 trophies show "Decorative" as their USED FOR. Trophies feed boss summons and trophy hunting; "Decorative" is a hoard category, not a use.
- Fix direction (matches section 8, "a blank line beats a wrong line"): show nothing, or the item's own game description, when the fall-through fires; never display the hoard label in the USED FOR slot.

## Findings

| id | Severity | Evidence | Fix | Effort |
|---|---|---|---|---|
| H1 | High | Filler USED FOR on 78 items; `quick.ts:79`; `fallback` unread in UI; 72 items default to "Safe to discard" via `build_data.py:701`; 56 are foods and meads, 2 are boss drops | Do not render the hoard label as USED FOR; for the default case show the game description or nothing; stop defaulting foods and meads to discard (use "Eat" or no badge) | S |
| H2 | High | Entry-level "Verified in game" from one ticked line, 83 entries; Boar page claims in-game while only drops were ticked | Make the badge field-level: "Drops seen in game" or show per-line ticks; or rename to "Partly seen in game" with the count of ticked lines | M |
| H3 | High | 18 pages show "Verified in game" plus "unchecked" plus "guide, not checked" (Acorn, Axe Head 1/2, Beech/Birch Seeds, Blueberries, Carrot Seeds, Copper Ore, Dandelion, Ancient Bark, Feathers, Fine Wood, Fir/Pine Cone, Yellow Mushroom, Round Log, Thistle, Tin Ore); `ItemPage.tsx:175-193,286`, `quick.ts:43`, `build_data.py:719` | Drop the tag and the stale note when the `where:` key is in `confirmed.json`; test that no page has both "in game" and "unchecked" | S |
| H4 | High | Cultist drops list only the trophy; Red Jute missing; 10 dropped pieces name a missing input (Red Jute 2, Blue Jute 3, Pot Shards 3, Timberwood 2); doc claims every drop table checked | Add Red Jute, Blue Jute, Pot Shards and Timberwood as items (or show "Also drops items not yet listed" on creature pages); add a test that fails when a creature's raw drop references an unlisted item | M |
| H5 | Med | "Unverified" label on 53 items and 7 creatures whose numbers are file-derived; red banner repeats "come from the game files" (`ItemPage.tsx:289-291`); drop and recipe lines flagged "unchecked" by item level (`quick.ts:58,89`) | Label the field not the entry: "Weight/stack: game files. Where to find: guide, not checked". Remove the item-level red banner. Only guide-flag lines that are hand-written | M |
| H6 | Med | Seven trust phrases on screen (listed above); data value "cross-checked" means one source (`trust.ts`, `DATA_SOURCES.md:131`) | Rename the data value to `from-files`; use three words everywhere: "Seen in game", "From game files", "Guide, not checked" | M |
| H7 | Med | Raw Boar Meat and Deer Meat carry food stats (20/20) while the item category is material; optimizer filter `FoodOptimizerPage.tsx:17` has no edibility test; 2 sources show no stats | Drop `foods` rows whose item is not consumable (check `m_itemType` in extract) or hide them from the optimizer; check in game that you cannot eat raw meat | S |
| H8 | Med | 1.0 content missing: the site's build is dated 2026-10-26, game 1.0 shipped 2026-09-09; Forge of Potential and idols (16 Battle/Protection Idols), Frigid Kiln, Frost Foundry, Smoker, Standing Loom, Smith's Apron are not in data (grep for idol/frigid/smoker/loom/apron finds nothing in `data/`) | Decide scope: list the 1.0 stations and the Forge of Potential upgrade step; at minimum add a Home note "Deep North and the Forge of Potential are not covered" | L |
| H9 | Med | Trophies show "Decorative" and "Must keep" (30 + 16 filler lines) as use, though trophies drive boss summons | Show "Summons X" for summon items and "Trophy of X" otherwise; tie to `summonsFor` (`lookup`) | S |
| H10 | Low | Drop ranges: fandom 5 to 9 vs physgun/site 5 to 10 (Fuling coins); 64 range drops with no inclusive/exclusive note | State "1 to 3 (per kill, grows with stars)" in one place; no per-entry fix | S |
| H11 | Low | Charred Marksman fire "very resistant" vs source "resistant"; the site's finer scale is from the files and looks right, but unconfirmed | Keep; note under Could not check | S |
| H12 | Low | `DATA_SOURCES.md:46` stale on Carrot Seeds and Elder Bark; `updatelog.json` baseline says 215 pieces vs 242 in data and 445 vs 446 items | Refresh or generate the log from the data | S |
| H13 | Low | Source disagreements are never recorded (Club station); the schema has no "sources disagree" state | Add an optional `disputed` note field shown as one grey line | S |

## Missing data, ranked by how often a mid-game player would need it

### Absent entirely

1. Trader prices and sell value. No `value`, no Haldor or Hildir or Bog Witch stock (only a place note). Ymir Flesh is sold by Haldor for 120 coins after Bonemass per a guide, but the site says "not confirmed". Needed every trading trip.
2. Farming and cooking time. No crop grow time, plant spacing, Cultivator pieces (excluded in `DATA_SOURCES.md:44`), smelter fuel and capacity, cooking times, fermenter yield (`DATA_SOURCES.md:58`). Needed in every session after the Black Forest.
3. Armor resistances and status effects. Only armor value, durability, movement modifier and a set-effect text line. No Wet, Cold, Freezing, Burning, Poison pages and no "which gear resists frost". Needed before the Mountains and Ashlands.
4. Taming and breeding. `docs` state "Whether a creature is tamable or passive is not in the dump and is not shown". No food, no spawn conditions beyond one home biome (Deer and Greydwarf have several).
5. Raids and events. No event triggers or which creatures attack which base.
6. Fishing and bait. Left out of all passes; Perch and Pike carry filler advice instead.
7. 1.0 features: Forge of Potential, idols, new stations, Deep North (H8).
8. Dungeon contents and Fenris Hair/Claw source. Honest "not confirmed", but guides say Frost Caves (gamever.io); the site could carry a guide-tagged line.
9. Boss strategy or recommended loadout. Attacks and resistances exist; no arena notes or food advice. Medium need, but the Advisor page may cover part of it.

### Exists but is hard to reach

1. "Where found" and the trust badge are inside the collapsed "More details" fold on narrow screens (`ItemPage.tsx:282`, `open={wide}`). A phone user sees the quick card first, which is fine, but the badge and source tags never show up there except as the "unchecked" chip.
2. Weight, stack size and portal-blocked live under a second fold, "Facts" (`ItemPage.tsx:361`). Portal-blocked is an every-trip fact for ores and scrap.
3. Zone-level trust (`ProgressionPage.tsx:83`, Trust page) is two or three clicks from an item page.
4. Upgrade costs per quality level (`recipe.upgrades`) are only reachable through the Upgrades page, not on the weapon page's first screen (I could not check the UI; this is from the data model).
5. Boss summon items exist in data (`summonItems`) but the item page shows them under "Where found" (`ItemPage.tsx:223`), while the quick card's USED FOR says "Must keep".

## Protect this

- One game-file source with `source` and `verified` on every row, plus the tests that fail on dangling ids, shared names and unexplained dropped recipes and pieces.
- `dropped_recipes.json` and `dropped_piece_reasons.json`: the site says why something is missing. Do not delete these when simplifying.
- The per-value `GuideTag` idea for hand-written lines, and "Source not confirmed" for Fenris Hair, Fenris Claw and Ymir Flesh. A blank beats a wrong line.
- The Check-in-game flow that stores the confirmed text and reopens a line when the text changes.
- The Trust page and spot-check list as the owner's maintenance tools (move to an owner area, do not remove).
- Boss summon costs read from altar prefabs, with item-stand counts (`DATA_SOURCES.md:197`).

## Could not check

- The live site and any rendered page. All UI claims are from code reading, not screenshots. I did not verify the exact on-screen wording on a phone.
- Whether build 25909357 is 1.0.15 or earlier. physgun states 1.0.15. If the owner's install is older than the sources, some "disagreements" could be patch drift. Items to compare when the owner updates: Bjorn health (500; 1.0 notes say it was reduced), Mistlands and Ashlands gear durability (1.0 notes say increased; site Carapace chest 1,200), and the rare-drop adjustment.
- bamboogaming lists a Battle/Protection Idol as an extra ingredient on every weapon and armor recipe (all weapon and armor recipes I opened). PC Gamer says idols are used at the Forge of Potential, not at crafting. Which is true for the crafting menu in 1.0 is unresolved; if bamboogaming is right, every weapon and armor recipe on the site is short by one item.
- Fandom and several bamboogaming pages failed to load, so 24 of 40 entries have one source and 2 have none. The wiki.gg site and kirilloid (robots.txt block) could not be fetched.
- Tasty Mead (bamboogaming zeros vs eip.gg effect), Charred Marksman fire grade, Kindled Ribs and Torn Spirit use, Shield Core use, Fish Wraps hoard intent, and raw meat edibility were not play-tested.
- Attack timing, DPS estimates, and creature attack numbers: no outside source lists per-attack damage, so these stay unchecked. The site flags DPS as an estimate; I agree.
- The remaining 406 items, 274 recipes, 234 pieces, 62 foods and 45 creatures. The 40-entry sample gives a rough 88% agreement; with 40 samples the 95% interval is wide (about 74% to 96%).
