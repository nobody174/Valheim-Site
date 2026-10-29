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
| Items, recipes (crafting, cooking, smelting, fermenting), stations and extensions, weapons, armor and sets, foods and meads, trophies, creatures (attacks, resistances), bosses (all seven zones, Meadows to Ashlands) | Owner's local Valheim install, Steam build 25909357, read with `tools/extract/` (UnityPy). Gameplay values, plus the item and station icons (`src/assets/icons/`, exported by `tools/extract/extract_icons.py`). No audio or other raw assets are committed. | Personal use of own copy; game content (c) Iron Gate. Not an open license, so keep the repo non-commercial and commit only cleaned values (see README disclaimer). | 2026-10-26 | cross-checked (single source: game files) | Weights, stacks, damage, armor, food, health, recipes and drop tables come from the files. Curated by hand and NOT from the files: biome assignment, hoard defaults, gather/smelt/cook sources (those items are `unverified`), boss summon items. |

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
- Item `description` is the game's own text from the localisation files (270 of 273 items; the other three are raw meats). `use` ("What to do with it") is hand-written in `tools/extract/item_use.json`, shown as "guide, not checked in game": Swamp Key (opens Sunken Crypt doors), Wishbone (finds silver), Ruby, Amber and Amber Pearl (sell to Haldor). A test fails if an item that nothing is made from has neither.
- Hoard defaults: crafted weapons and armor are `gear` (neutral badge, no keep/discard advice); Coins are keep some (999, one stack); hoard notes use display names. The Ooze Bomb's skill 0 shows as "None".
- Package 5 (2026-10-28): checked every resolved drop table in the dump (360 drops, 171 characters). No creature drops Fenris Hair, Fenris Claw or Ymir Flesh, so their source stays "not confirmed" (likely chest or cave loot, which the dump does not hold). Added the Cultist (drops its trophy; zone from guides, flagged unverified), the Fenris Hood (the third piece of the Fenris set), Wolf Skewer and seven trinkets (new `trinket` category). Trinket effects are not in the dump, so the page shows only the game's description. Every recipe the builder leaves out has a reason in `tools/extract/dropped_reasons.json`; a test fails without one.
- Display names: the game calls both the Fuling and its archer "Fuling"; `tools/extract/name_overrides.json` names the archer "Fuling Archer". A test fails if two items, creatures or bosses share a name.
- Per-value labels: every hand-written source line, boss summon cost and progression note carries a "guide, not checked" tag (`GuideTag`); values read from the game files (drops, recipes, stats) do not.
- Zones (Package 9): an item's zone is the first zone where its recipe can be done. Cultivator, Mead Base: Minor Stamina and its mead, and Coal moved to the Black Forest, and Wolf Skewer to the Plains (Onion). A test fails if a crafted item sits in an earlier zone than its ingredients. Attack names on creature and boss pages are derived from the game's attack ids (for example `troll_groundslam` reads Groundslam); where nothing readable is left they show Attack N. Whether a creature is tamable or passive is not in the dump and is not shown.
- Foods carry `eitr` and `regen` (health per tick) read from the item files; the food optimizer uses health, stamina, Eitr and duration.
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

## Mistlands pass (2026-10-28; the owner has not reached the Mistlands, so nothing here is checked in game)

Config: `tools/extract/biomes/mistlands.json`. Read from the game files: Seeker, Seeker Brute, Seeker Brood, Gjall, Tick, Hare, the Dvergr and the Queen (health, attacks, drops, resistances), the Black Forge, Eitr Refinery and Galdr Table build costs and extensions, the Eitr conversion (Soft Tissue to Refined Eitr), all recipes, stats, foods and meads. Hand-written and `unverified` or tagged "guide, not checked": every gather note (Yggdrasil Wood, Sap, Black Marble, Soft Tissue, Chitin, Wisp, Black Core, the mushrooms, Vineberry, Fiddlehead), and the Dvergr zone (they have camps and ruins, not a spawn entry). Included: Mistlands weapons (Mistwalker, Krom, Himmin Afl, Jotun Bane, Skull Splittur, Demolisher, carapace and chitin gear, Spine Snap, Arbalest, staves, bolts, shields), carapace and mage armor, Mistlands meads and foods, two trinkets, the Lantern, Demister, Ceramic Plate, Mechanical Spring and Shield Core. Left out on purpose: anything that needs Ashlands, Deep North or Gold items (Flametal, Askvin, Moose, Gold armor and weapons, Fader), the six Feasts, fishing and its bait, turrets, and eggs (chicken, Volture). The pickable mushrooms, Vineberry and Fiddlehead are listed as materials (their food values are not shown).

## Ashlands pass (2026-10-28; the owner has not reached the Ashlands, so nothing here is checked in game)

Config: `tools/extract/biomes/ashlands.json`. Read from the game files: the Charred (archer, melee, mage, twitcher), Asksvin, Morgen, Lava Blob, Fallen Valkyrie, Volture, Bonemaw Serpent and Fader (health, attacks, drops, resistances), all recipes and stats for Flametal, Blackwood and Charred gear, the Ashlands armor and capes, the bombs, the Bell, foods and one trinket. Hand-written and flagged: the gather notes for flametal ore, Blackwood, Molten Core and Bell Fragments, and the Charred Mage's zone. Left out on purpose: the Red, Blue and Green Gemstone items and everything that needs them (three staves, the Flametal Eitr trinket, upgraded weapon variants), Gold items and the Deep North, Dyrnwyn, saddles, fishing and turrets.

## Spot-check list (Meadows and Black Forest, session 2.1)

Entries most likely to be wrong, all curated by hand. Please check these in your game:

| # | Entry | What to check |
|---|---|---|
| 1 | Eikthyr boss | Summon items: 2 Deer Trophies at the altar (checked: altar data in the game files) |
| 2 | The Elder boss | Summon items: 3 Ancient Seeds at the altar (checked: altar data in the game files) |
| 3 | Ruby | Found in Black Forest? (assigned by hand) |
| 4 | Amber and Amber Pearl | Found in Meadows? (assigned by hand) |
| 5 | Honey | Comes from beehives (curated source) |

### Swamp, Mountains and Plains (added 2026-10-28; none of this has been checked in game)

| # | Entry | What to check |
|---|---|---|
| 6 | Bonemass boss | Summon: 10 Withered Bone at the altar (checked: altar data in the game files) |
| 7 | Moder boss (Dragon) | Summon: 3 Dragon Eggs at the altar |
| 8 | Yagluth boss (Goblin King) | Summon: 5 Fuling Totems at the altar |
| 9 | Swamp Key | Opens Sunken Crypt doors (item use line) |
| 10 | Wishbone | Finds silver veins (item use line) |
| 11 | Surtling | Where it appears (zone set to Swamp by hand) |
| 12 | Cultist | Spawns in Mountain caves (zone set by hand) |
| 13 | Fenris Hair, Fenris Claw, Ymir Flesh | Where they come from (no source in the files) |
| 14 | Surtling Core | Crypt stands (you found one in the Black Forest) |
| 15 | Muddy Scrap Piles and Withered Bone | Sunken Crypt sources (guides) |
| 16 | Plains gather notes | Barley, Flax, Cloudberry, Onion, Tar, Black Metal Scrap (guides) |
| 17 | Zone of crafted items | Cultivator, Mead Base: Minor Stamina, Coal in the Black Forest; Wolf Skewer in the Plains |

### Mistlands (added 2026-10-28)

| # | Entry | What to check |
|---|---|---|
| 18 | The Queen boss | Summon: 3 Seeker Soldier Trophies at the altar (checked: altar data in the game files and guides; corrected from 3 Soft Tissue) |
| 19 | Black Forge, Eitr Refinery, Galdr Table | Build costs (read from the files; Black Core, Black Marble, Yggdrasil Wood) |
| 20 | Gather notes | Yggdrasil Wood, Sap, Black Marble, Chitin, Wisp, Black Core, mushrooms, Vineberry, Fiddlehead |
| 21 | Dvergr | Where they appear |

### Ashlands (added 2026-10-28)

| # | Entry | What to check |
|---|---|---|
| 22 | Fader boss | Summon: 3 Bells on the bell holders (checked: altar data in the game files and guides; corrected from 1 Bell) |
| 23 | Flametal ore, Blackwood, Molten Core, Bell Fragment | Where to find them (guides) |
| 24 | Charred Mage | Where it spawns |

### Places (added 2026-10-28)

| # | Entry | What to check |
|---|---|---|
| 25 | Burial Chamber note | Enemies and loot as written; no key needed |
| 26 | Troll Cave note | At least one Troll inside; loot as written |
| 27 | Sunken Crypt note | Needs the Swamp Key; enemies and loot as written |
| 28 | Frost Cave note | What lives inside and what it drops (guides disagree) |
| 29 | Charred Fortress note | Bell Altar gives Bell Fragments |
| 30 | Haldor and Hildir | Where they appear, one Haldor per world |

`From game files` (stored as `verified: cross-checked`) means the value was read from the game files of build 25909357, one source, not confirmed in game. Everything else with that level is read straight from the files.

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
- Bonemass summon: 10 Withered Bone (read from the altar in the game files, 2026-10-28).
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

## Boss summon costs (checked 2026-10-28)

The altar prefabs (`OfferingBowl` component) hold the item and amount. Read from them: Eikthyr 2 Deer Trophy, The Elder 3 Ancient Seed, Bonemass 10 Withered Bone, The Queen 3 Seeker Soldier Trophy (`TrophySeekerBrute`), Fader 3 Bell. Those five are flagged `summonFromFiles` and carry no "guide, not checked" tag. Web guides agree. Two earlier values were wrong and are fixed: the Queen needs trophies, not Soft Tissue, and Fader needs 3 Bells, not 1. Moder (3 Dragon Eggs, on egg cups), Yagluth (5 Fuling Totems, on totem holders) and Fader (3 Bells, on bell holders) fill item stands, so the count is the number of stands in the location prefab. Counted from the game files on 2026-10-28: 3 `dragoneggcup`, 5 `goblinking_totemholder`, 3 `fader_bellholder`. All seven boss summon costs now come from the game files; the guides agree.

## Skills, console commands and character files (added 2026-10-28)

- **Skills** (`data/skills.json`): names and descriptions from the game's localization, training rate per use and the death loss (5%) from the game's `Skills` component (extracted by `extract_raw.py` as `skillsdef`). Skill numbers and ids are from the game's code (`Skills.SkillType`). **Correction:** weapon skills 9 and 10 were labelled FireMagic and FrostMagic; the game's own list says Elemental Magic and Blood Magic, so the Fireball, Ice Shards and Clusterbomb staves are Elemental and the Protection and Dead Raiser staves are Blood. Fixed.
- **Console commands** (`data/commands.json`): every non-secret command in the game's `Terminal` class, with the game's own description and whether it needs `devcommands`. Read from the game's code with a decompiler (`tools/extract/extract_console_commands.py`). The example lines are hand-written and tagged "guide, not checked", as is the F5 key.
- **Character files**: read in the browser from the owner's own `.fch` file, following the game's loader. Name keys map to ids through `data/savekeys.json`. Nothing is uploaded.
- **Dungeons and places** (`data/places.json`): the game's world-generation list (ZoneSystem locations): which zones a place appears in and how many the game tries to place, grouped into families (Crypt2, Crypt3 and Crypt4 are one). Names and notes for the main dungeons, merchants and altars are in `tools/extract/places.json`, written by hand from public guides (Burial Chamber, Troll Cave, Sunken Crypt, Frost Cave, Charred Fortress, Haldor, Hildir) and tagged "guide, not checked". What is inside each dungeon (enemies, loot) is not in the files we read; the guide notes may be out of date. Add to the spot-check list: items 25 to 30 below.

## Portals (added 2026-10-29)

- **Items portals refuse** (`portalBlocked` on items in `data/items.json`): every item the site lists whose `m_teleportable` is off in the game files: 15 (ores, bars and scraps of copper, tin, bronze, iron, silver, black metal and flametal, the Dragon Egg and the Mechanical Spring). The game files flag 27 names in all; the other 12 are items the site does not list (unused, old-version or quest items such as Hildir's chests). The game's `Inventory.IsTeleportable` refuses a portal trip while any of them is carried, unless the world setting that allows everything is on.
- **Portal rules on the My portals page**: read from the game's code (`TeleportWorld`, `Game.ConnectPortals` and `FindRandomUnconnectedPortal`, decompiled): pairing is by exactly equal tag text (so case counts, and empty tags pair with each other), a broken tag match clears the link at the next pairing pass, only two portals pair at a time (a third has no partner), and the name field takes 10 characters. Not yet tried in game. An earlier version of the page said three portals with one name switch each other off; the code says otherwise and the page was corrected.
- **Your portals list** is hand-entered by the owner and stored in the profile. It is not game data.
