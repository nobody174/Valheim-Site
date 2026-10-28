# Data sources

The site is only as good as its data. This file records where every dataset came from, how it
was checked, and what is still unverified. **Update it in the same commit as any data change.**

## Decision needed from the owner (before Phase 2)

Claude Code has no live access to the game and will otherwise fill JSON from memory, which is
where wrong numbers come from. Pick a primary source:

| Option | Accuracy | Effort | Notes |
|---|---|---|---|
| **A. Extract from your own game install** | Highest, always matches your patch | High | Dump item/recipe/creature data from the installed game using community tooling. Personal use only. Keep extracted raw files and any art out of the repo; commit only the cleaned JSON. |
| **B. Open community dataset as the base, cross-check against the wiki** | High if the dataset is current | Medium | Candidate: the open-source Valheim knowledge base by kirilloid (GitHub `kirilloid/valheim`, site valheim.kirilloid.ru) which ships a typed object database. **Check its license and terms before copying anything**, and record the result below. Use it as a cross-check at minimum. |
| **C. Wiki + manual entry** | Medium, error-prone | Medium | Wiki text is community-written and licensed (attribution required). Good for descriptions and strategy text, weaker for exact numbers. |

**Recommendation:** B as the base for structure and numbers, A only if you later want exact
patch-level values for rankings, C for strategy text. Whatever you choose, mark every entry
`verified` honestly. You can upgrade entries to `"in-game"` as you confirm them while playing.

> Status: **Decided (2026-10-26): Option A, extracted from the owner's own game install.** kirilloid/valheim was ruled out as a copy source (no license) and is cross-check only. Raw extraction output lives in git-ignored `data-raw/`; only cleaned JSON is committed.
> Licenses and terms above have **not** been verified. Do it in Phase 0 and record the results.

## Source register

| Dataset | Source | License / terms | Retrieved | Verified level | Notes |
|---|---|---|---|---|---|
| Candidate base: kirilloid/valheim (valheim.kirilloid.ru) | https://github.com/kirilloid/valheim | **No LICENSE file; GitHub reports no license (all rights reserved by default).** README: content used under fair use, non-commercial; to re-use content, refer to the game EULA. Code and data are in TS under `src/data`, not a published dataset. | 2026-10-26 | n/a (nothing copied) | **Not cleared for copying.** Allowed use for now: read-only cross-check of values we enter ourselves. Owner to decide: ask the author for written permission, or use as cross-check only. |
| Items, recipes (crafting, cooking, smelting, fermenting), stations and extensions, weapons, armor and sets, foods and meads, trophies, creatures (attacks, resistances), bosses (Meadows to Plains; Mistlands and Ashlands not added yet) | Owner's local Valheim install, Steam build 25909357, read with `tools/extract/` (UnityPy). Gameplay values, plus the item and station icons (`src/assets/icons/`, exported by `tools/extract/extract_icons.py`). No audio or other raw assets are committed. | Personal use of own copy; game content (c) Iron Gate. Not an open license, so keep the repo non-commercial and commit only cleaned values (see README disclaimer). | 2026-10-26 | cross-checked (single source: game files) | Weights, stacks, damage, armor, food, health, recipes and drop tables come from the files. Curated by hand and NOT from the files: biome assignment, hoard defaults, gather/smelt/cook sources (those items are `unverified`), boss summon items. |

## Game version

Track in `data/meta.json`:

```json
{ "gameVersion": "TBD", "lastReviewed": "YYYY-MM-DD" }
```

At the start of Phase 2, look up the current Valheim version and which biomes/items exist
(the brief lists Meadows through Ashlands). Record it here.

## Known gaps

- Building pieces (`data/pieces.json`) are the Hammer's build menu from the game's piece tables, limited to pieces whose whole cost is in the database and that are not stations or station extensions. Pieces that need a station or item from a later zone appear when that zone is added. Cultivator and Hoe pieces are not listed. Piece names and costs are game numbers (`cross-checked`); there is no zone or unlock info per piece.
- Station levels are computed in code from the extensions and each recipe's minimum level (see ARCHITECTURE.md). Extensions that need items from biomes not added yet are kept as `laterExtensions` (name and the missing items) until those biomes are configured.
- Where to get an item: drops come from the game files; gather, trader, found and other notes are written by hand from public guides and are `unverified`. Two items have no source at all: Carrot Seeds and Elder Bark (a test lists them as known gaps). Where Haldor sells the Fishing Rod and bait, and the prices, differ between guides.
- Raw Fish is made from any one fish at a Preparation Table. The data model has no "any one of" recipes, so the builder reports it (`anyOneOfNotModelled` in `tools/extract/dropped_recipes.json`) instead of writing a wrong recipe.
- Item `description` is the game's own text from the localisation files (270 of 273 items; the other three are raw meats). `use` ("What to do with it") is hand-written in `tools/extract/item_use.json`, shown as "guide, not checked in game": Swamp Key (opens Sunken Crypt doors), Wishbone (finds buried treasure), Ruby, Amber and Amber Pearl (sell to Haldor). A test fails if an item that nothing is made from has neither.
- Hoard defaults: crafted weapons and armor are `gear` (neutral badge, no keep/discard advice); Coins are keep some (999, one stack); hoard notes use display names. The Ooze Bomb's skill 0 shows as "None".
- Package 5 (2026-10-28): checked every resolved drop table in the dump (360 drops, 171 characters). No creature drops Fenris Hair, Fenris Claw or Ymir Flesh, so their source stays "not confirmed" (likely chest or cave loot, which the dump does not hold). Added the Cultist (drops its trophy; zone from guides, flagged unverified), the Fenris Hood (the third piece of the Fenris set), Wolf Skewer and seven trinkets (new `trinket` category). Trinket effects are not in the dump, so the page shows only the game's description. Every recipe the builder leaves out has a reason in `tools/extract/dropped_reasons.json`; a test fails without one.
- Display names: the game calls both the Fuling and its archer "Fuling"; `tools/extract/name_overrides.json` names the archer "Fuling Archer". A test fails if two items, creatures or bosses share a name.
- Search aliases (`tools/extract/aliases.json`) are alternative names such as Goblin for Fuling or Core wood for Corewood. They are hand-written, not game data, and only help the search; an alias that matches no entry makes the builder warn.
- Station build cost is empty only for stations that need items from zones not added yet. Today every station has one; the builder warns and `src/data/completeness.test.ts` fails on an empty cost without a documented reason.
- Smelter, Charcoal Kiln, Blast Furnace and Oven costs come from the game files (they use Surtling Cores). Surtling Core: the owner found it on a crypt stand in the Black Forest (in game, not recorded as in-game verified); the Swamp Surtling creature (drops, stats) is from the game files, its zone is hand-written.
- Smelting fuel and capacity, cooking overcook times, and fermenting yields are not extracted.
- Creature damage is the raw damage of each attack at level 1 with no difficulty scaling; creature attack timing is not extracted.
- Weapon attack settings (stamina, combo length, last-swing multiplier, reach) come from the item files. Weapon attack timing (clip length, exit time, chain point, playback-speed events) is read from the player animator by `tools/extract/extract_attack_timing.py` and stored raw in `data/weapons.json` as `attack.timing`, flagged `unverified`. How the app turns it into attacks per second is an estimate (see ARCHITECTURE.md) and has not been compared with the game yet. Bows have no timing because drawing depends on skill.
- Meads: effect text and over-time numbers are read from the status effect. Effects with several parts (resistances, regeneration multipliers) are only described by their in-game text.
- Biome assignment of items, hoard defaults, gather sources and boss summon items are curated by hand in `tools/extract/biomes/*.json`. Creature biomes are cross-checked against the game's spawn tables on every build.
- Creatures can spawn in more than one biome (for example Deer, Greydwarf); the data keeps one home biome per creature.
- `kind: smelt` also covers kilns and other conversion stations.

## Spot-check list (Meadows and Black Forest, session 2.1)

Entries most likely to be wrong, all curated by hand. Please check these in your game:

| # | Entry | What to check |
|---|---|---|
| 1 | Eikthyr boss | Summon items: 2 Deer Trophies at the altar |
| 2 | The Elder boss | Summon items: 3 Ancient Seeds at the altar |
| 3 | Ruby | Found in Black Forest? (assigned by hand) |
| 4 | Amber and Amber Pearl | Found in Meadows? (assigned by hand) |
| 5 | Honey | Comes from beehives (curated source) |

Everything else with `verified: cross-checked` is read straight from the game files of build 25909357.

## Regenerating the data

```
python tools/extract/extract_raw.py "<Valheim install dir>" data-raw     # needs: pip install UnityPy
python tools/extract/extract_piece_tables.py "<Valheim install dir>" data-raw   # build menus, for the Building page
python tools/extract/build_data.py data-raw data <steam build id> [YYYY-MM-DD]
npm run validate
```

`tools/extract/biomes/<biome>.json` lists which items, creatures and bosses belong to each biome. Adding a biome means adding a file there and rerunning the build; all configs are merged on every run.

**Dropped recipes.** The build only keeps recipes whose output is listed in a biome config. Every run it prints, and writes to `tools/extract/dropped_recipes.json`, the game recipes it did not keep: `outputNotConfigured` (every input is configured, the output is not: the likeliest misses, such as Fire Arrow was) and `inputNotConfigured` (the output is configured but an input is not). Review the diff of that file in each PR. Items the player crafts but that have no recipe in the game files are listed with a reason in `tools/extract/no_recipe.json`; a test fails if a craftable item has neither a recipe nor an entry there.

## Dropped-recipe research (2026-10-27)

The 14 recipes the builder found but did not keep were checked against public wikis and item databases (searched by Claude; the pages are third-party and may lag the game). The numbers below also match the game files.

| Recipe | Finding | Decision |
|---|---|---|
| Butcher Knife | Forge, 2 Wood + 4 Tin; used to kill tamed animals. Several guides agree. | Added to Black Forest (Tin) |
| Bone Tower Shield | Workbench level 3, 10 Wood + 10 Bone Fragments + 3 Skeleton Trophies. Guides agree. | Added to Black Forest |
| Sharpening Stone | Stonecutter, 5 Stone; only used to build the Grinding Wheel (Forge upgrade). The Stonecutter itself needs Iron. | Wait for the Swamp pass and the station work (H3) |
| Tankard | Workbench, 5 Fine Wood + 2 Resin; cosmetic drinking cup. | Not added: no gameplay value |
| Odin Tankard, Cape of Odin, Helmet of Odin | Beta-supporter items; recipes not confirmed (sources disagree on the helmet). | Not added |
| Wood Sword | No source found. | Not added; unconfirmed |
| Needle Arrow | Workbench level 4, Needles + Feathers; later zones. | Wait for its zone |
| Poison Resistance Mead Base | Honey, Thistle, Neck Tail, Coal; Swamp-era mead. | Wait for the Swamp pass |
| Bone Bolt, Bronze Health Trinket, Forest Fishing Bait, Wood Turret Bolt | Nothing found. | Not added; unconfirmed |

Correction: Upgrader1Armor and Upgrader2Weapon are flagged as upgrade-only resources in the game files, not crafting ingredients, so the Early Axes recipe is just 4 Wood + the two axe heads, and the Upgrader2Weapon item was removed from the data.

## Swamp pass (owner has not unlocked the Swamp yet, so nothing here is checked in game)

Config: `tools/extract/biomes/swamp.json`. The creature drops, recipes, stats and build costs come from the game files. Hand-written parts, all `unverified` until the owner checks them in game:

- Where-to-get notes for Scrap Iron, Withered Bone and Turnip Seeds (guides: Sunken Crypts' Muddy Scrap Piles, wild turnips in the Swamp).
- Bonemass summon: 10 Withered Bone (guides agree; the altar cost is not in the extracted data).
- Ymir Flesh: no creature drops it in the game files and no guide result was found, so its source says "not confirmed". It is needed by the Iron Sledge.
- Moved to the right zone (M6): Entrails and Sausages to the Swamp, Coins to the Black Forest (Trolls drop them). Needle stays in Meadows until the Plains pass (Deathsquito drop).
- Iron Shield (`ShieldIronSquare`) is not added: its recipe is disabled in the game files.
- Left out for now: Iron Brooch and other trinkets, Fishing Bait (Swamp), Iron Bolt and Crossbow (Black Forge, Mistlands), Poison Arrow (Obsidian, Mountains), Blood Pudding (Barley, Plains).

## Mountains pass (not checked in game)

Config: `tools/extract/biomes/mountain.json`. Creature drops, recipes, stats and costs come from the game files. Hand-written and unverified:

- Where-to-get notes for Silver Ore, Obsidian and Dragon Egg (guides). Silver is smelted from Silver Ore.
- Moder summon: 3 Dragon Eggs (guides agree; the altar cost is not in the extracted data).
- Fenris Hair and Fenris Claw: no creature drops them in the game files, so their source says "not confirmed". The Fenring armor and Flesh Rippers need them.
- Left out for now: Silver and Bronze trinkets (a trinket category is not modelled), Fishing Bait variants, Wolf Skewer (needs Onion), Fenring Helmet (needs a Cultist trophy), the Lantern and other Black Forge items.
- Mountain spawn tables also list Fuling, Jotun, Seeker, Elaking and Charred; those are event or late-game spawns and are not added.

## Plains pass (not checked in game)

Config: `tools/extract/biomes/plains.json`. Creature drops, recipes, stats and costs come from the game files. Hand-written and unverified:

- Where-to-get notes for Barley, Flax, Cloudberry, Onion, Tar and Black Metal Scrap (guides; wild plants and Fuling villages).
- Yagluth summon: 5 Goblin Totems (guides agree; the altar cost is not in the extracted data). Totems drop from Fuling Brutes at 10%.
- Needle moved here from Meadows (Deathsquito drop).
- Left out for now: Black Forge items (Bolt, Skoll and Hati knife, Saddle, Arbalest), trinkets, fishing bait variants, Viking Cupcake (needs Chicken Egg), Wolf Skewer, Feasts. Growths (Tar) are not added as creatures: no spawn-table entry was found.
- Fuling raids also appear in other zones' spawn tables; they are treated as Plains creatures.
