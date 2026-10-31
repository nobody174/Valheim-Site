# Review E: Search and findability (the front door)

Reviewer: independent, role E. Date 2026-10-31. Report only; the repo was not modified.

## Verdict
1. The matching engine is good (it finds typos, aliases and partial words in 0.1 ms) but the display layer throws away its ranking: results are re-sorted by a fixed group order (Items, Trophies, Creatures, Bosses...), so the exact name is buried. Typing "Bonemass" and pressing Enter opens Bonemaw Meat. The boss is 7th.
2. Every result row except building pieces prints the internal id on the right (`BoneMawSerpentMeat`, `TrophyBonemass`): 369 of 415 visible rows in my 109 queries. The "not found" state suggests random names ("burial chamber" -> Hammer, Amber, Amber Pearl) while Places, biomes, pages, effects text and descriptions are not searchable at all.
3. The fixes are small and mostly one file (`search.ts` plus two row/empty components). With them, exact-name-first goes from 57 to 80 of 104 expected answers at rank 1 in my offline test, and the remaining misses are mostly "not indexed" gaps.

## Assumptions and method
- Offline: copied the repo to a scratchpad, `npm ci`, ran the repo's own `createSearch(gameData)` with `tsx` (109 queries, 765 docs: 398 items, 48 trophies, 51 creatures, 7 bosses, 19 stations, 242 pieces). Default limit 8 per group (palette) as used by the palette; Home uses 20 per group, same order.
- "Rank now" is the position in the flattened list a user sees (group order), which is also what Enter opens (rank 1).
- "Rank with proposal" is a throwaway prototype (not committed anywhere): name 4x, aliases 3x, description 0.5x, no `id` field, prefix weight 0.9 above fuzzy 0.3, exact-name bonus, light stop-word removal for 3+ word queries, places and biomes added as groups, no per-group order. It shows direction, not final tuning.
- UI confirmed on the live site inside a sandboxed iframe with no `allow-same-origin` (opaque origin, empty storage) hosted on example.com, 1280x720. Owner's origin and storage were never touched. Screenshots (saved by the tool): `/tmp/claude-chrome-screenshots-1T820T/screenshot-1793407237193-41.jpg` (Home, "bonemass", id column), `...-42.jpg` (Enter opened Bonemaw Meat), `...-43.jpg` (palette "burial chamber" not-found), `...-44.jpg` (Ctrl+K "wolf": creature Wolf below the fold).
- Game facts used as "expected" come from my knowledge of Valheim; I did not verify them against the game. Content gaps are used as examples of patterns only.
- Data-quality note: `description` text exists on 443/446 items and `foods.json` has `effect` text, yet neither is indexed. Item `tags` are empty in the data, so the `tags` field in the index does nothing for items.

## Scores (0-10)
| Area | Score | Why |
|---|---|---|
| Matching engine (typos, prefixes, aliases) | 8 | 12 typo queries: 8 correct at rank 1, none lost; AND then OR fallback; 0.1 ms/query on 765 docs. |
| Ranking as shown to the user | 4 | Raw MiniSearch score had the exact name first in every case I checked (Bonemass, Bear, Wolf, Hearth, Chest, Eikthyr...), then `GROUP_ORDER` buried it. Short exact names (Bear, Deer, Wolf, Boar, Troll, Lox): 0 of 7 at rank 1. |
| Result row readability | 3 | Id on right of 89% of rows, CamelCase and sometimes misleading (`BoneMawSerpentMeat`, `TrimletSilverDamage`, `ArmorWolfLegs`). Rows say nothing useful (no type, no one-line fact). |
| Coverage | 4 | Not searchable: Places (79, incl. Burial Chamber, Sunken Crypt, Troll Cave, Haldor), biomes (Meadows, Swamp), the 29 pages, console commands, skills, effect/description text. |
| Not-found state | 3 | Palette: bare line plus 3 fuzzy names that are nonsense; Home adds "browse all items". No path to Places, no "ask differently" help. |
| Entry-point consistency | 5 | Same index and key logic, but different result limits, different empty states, `/` ignores the big Home box, header box is a fake read-only input. |
| Speed | 10 | 0.1 ms per query; instant. |

## Query table (109 queries)
Types: exact, exact-short, typo, colloq (old/colloquial names), effect, place, creature, how ("how do I..."), id, loop (my play loops: before a boss, what is this item, build planning, where is the dungeon, the kid loops), page. "Id shown" = rows among the top 8 whose right-hand text is the internal id, over rows shown. For place/page/"not in site" rows the expected column says so; a good answer would be the nearest page or a clear "not in the site yet".

| # | Query | Type | Expected | Rank now | Top 3 now (g:i=item t=trophy c=creature b=boss s=station p=piece) | Id shown | Rank with proposal |
|--|--|--|--|--|--|--|--|
| 1 | Iron | exact | Iron | 1 | i:Iron; i:Iron Nails; i:Scrap Iron | 8/8 | 1 |
| 2 | Bronze Sword | exact | Bronze Sword | 1 | i:Bronze Sword | 1/1 | 1 |
| 3 | Flint Axe | exact | Flint Axe | 1 | i:Flint Axe | 1/1 | 1 |
| 4 | Troll Hide | exact | Troll Hide | 1 | i:Troll Hide; i:Troll Hide Cape | 2/2 | 1 |
| 5 | Black Metal | exact | Black Metal | 1 | i:Black Metal; i:Black Metal Scrap; i:Black Metal Atgeir | 8/8 | 1 |
| 6 | Eikthyr | exact | Eikthyr | 2 | t:Eikthyr Trophy; b:Eikthyr | 2/2 | 1 |
| 7 | The Elder | exact | The Elder | 2 | t:The Elder Trophy; b:The Elder | 2/2 | 1 |
| 8 | Fenring | exact | Fenring | 2 | t:Fenring Trophy; c:Fenring; c:Cultist | 3/3 | 1 |
| 9 | Workbench | exact | Workbench | 1 | s:Workbench | 1/1 | 1 |
| 10 | Cooked Boar Meat | exact | Cooked Boar Meat | 1 | i:Cooked Boar Meat; i:Cooked Bear Meat | 2/2 | 1 |
| 11 | Hammer | exact | Hammer | 1 | i:Hammer | 1/1 | 1 |
| 12 | Wood | exact | Wood | 1 | i:Wood; i:Wood Arrow; i:Wood Shield | 8/8 | 1 |
| 13 | Stone | exact | Stone | 1 | i:Stone; i:Stone Axe; i:Stone Pickaxe | 8/8 | 1 |
| 14 | Tin | exact | Tin | 1 | i:Tin; i:Tin Ore; p:Tin Stack | 3/4 | 1 |
| 15 | Copper | exact | Copper | 1 | i:Copper; i:Copper Ore; i:Copper Knife | 4/4 | 1 |
| 16 | Coal | exact | Coal | 1 | i:Coal; i:Fenris Coat; p:Coal Pile | 3/3 | 1 |
| 17 | Resin | exact | Resin | 1 | i:Resin | 1/1 | 1 |
| 18 | Honey | exact | Honey | 1 | i:Honey | 1/1 | 1 |
| 19 | Torch | exact | Torch | 1 | i:Torch; p:Wisp Torch; p:Standing Iron Torch | 2/6 | 1 |
| 20 | Club | exact | Club | 1 | i:Club | 1/1 | 1 |
| 21 | Bear | exact-short | Bear | 11 | i:Bear Hide; i:Bear Meat; i:Bear Paw | 8/8 | 1 |
| 22 | Deer | exact-short | Deer | 7 | i:Deer Hide; i:Deer Meat; i:Deer Stew | 7/8 | 1 |
| 23 | Wolf | exact-short | Wolf | 10 | i:Wolf Fang; i:Wolf Meat; i:Wolf Pelt | 8/8 | 1 |
| 24 | Boar | exact-short | Boar | 11 | i:Boar Jerky; i:Boar Meat; i:Cooked Boar Meat | 8/8 | 1 |
| 25 | Troll | exact-short | Troll | 7 | i:Troll Hide; i:Troll Leather Tunic; i:Troll Leather Trousers | 7/8 | 1 |
| 26 | Lox | exact-short | Lox | 10 | i:Lox Meat; i:Lox Pelt; i:Lox Meat Pie | 8/8 | 1 |
| 27 | Neck | exact-short | Neck | 4 | i:Neck Tail; i:Grilled Neck Tail; t:Neck Trophy | 4/4 | 1 |
| 28 | Bonemass | exact | Bonemass | 7 | i:Bonemaw Meat; i:Bonemaw Tooth; i:Cooked Bonemaw Meat | 7/7 | 1 |
| 29 | Yagluth | exact | Yagluth | 3 | i:Torn Spirit; t:Yagluth Trophy; b:Yagluth | 3/3 | 1 |
| 30 | Moder | exact | Moder | 2 | t:Moder Trophy; b:Moder | 2/2 | 1 |
| 31 | bronse sword | typo | Bronze Sword | 1 | i:Bronze Sword | 1/1 | 1 |
| 32 | irn | typo | Iron | 1 | i:Iron; i:Iron Greaves; i:Iron Atgeir | 8/8 | 1 |
| 33 | eikthir | typo | Eikthyr | 2 | t:Eikthyr Trophy; b:Eikthyr | 2/2 | 1 |
| 34 | yaglut | typo | Yagluth | 3 | i:Torn Spirit; t:Yagluth Trophy; b:Yagluth | 3/3 | 1 |
| 35 | greydwaf | typo | Greydwarf | 6 | i:Greydwarf Eye; t:Greydwarf Trophy; t:Greydwarf Brute Trophy | 7/7 | 3 |
| 36 | coper | typo | Copper | 1 | i:Copper; i:Copper Ore; i:Copper Knife | 4/4 | 1 |
| 37 | workbech | typo | Workbench | 1 | s:Workbench | 1/1 | 1 |
| 38 | forg | typo | Forge | 1 | s:Forge; s:Black Forge | 2/2 | 1 |
| 39 | mushrom | typo | Mushroom | 1 | i:Mushroom; i:Stuffed Mushroom; i:Yellow Mushroom | 4/4 | 2 |
| 40 | blueberrys | typo | Blueberries | 1 | i:Blueberries | 1/1 | 1 |
| 41 | fishin rod | typo | Fishing Rod | 1 | i:Fishing Rod | 1/1 | 1 |
| 42 | trol | typo | Troll | 7 | i:Troll Hide; i:Troll Leather Tunic; i:Troll Leather Trousers | 7/8 | 1 |
| 43 | fishing pole | colloq | Fishing Rod | 1 | i:Fishing Rod; i:Fishing Bait; p:Darkwood Pole 2m | 2/8 | 2 |
| 44 | deerskin | colloq | Deer Hide | 1 | i:Deer Hide; p:Bearskin Rug | 1/2 | 1 |
| 45 | core wood | colloq | Corewood | 1 | i:Corewood; p:Corewood Stack | 2/2 | 1 |
| 46 | fenris | colloq | Wolf | 6 | i:Fenris Coat; i:Fenris Leggings; i:Fenris Hood | 7/7 | 1 |
| 47 | raw meat | colloq | Boar Meat | 1 | i:Boar Meat | 1/1 | - |
| 48 | leather | colloq | Leather Scraps | 1 | i:Leather Scraps; i:Leather Tunic; i:Leather Trousers | 8/8 | 2 |
| 49 | goblin king | colloq | Yagluth | 1 | b:Yagluth | 1/1 | 1 |
| 50 | eikthyr trophy | colloq | Eikthyr Trophy | 1 | t:Eikthyr Trophy | 1/1 | 1 |
| 51 | swamp key | colloq | Swamp Key | 1 | i:Swamp Key | 1/1 | 1 |
| 52 | crypt key | colloq | Swamp Key | 1 | i:Swamp Key | 1/1 | 1 |
| 53 | sledge | colloq | Iron Sledge | 1 | i:Iron Sledge; i:Demolisher; i:Stagbreaker | 3/3 | 1 |
| 54 | megingjord | colloq | Megingjord | none | NO RESULTS | 0/0 | - |
| 55 | carry weight | effect | Megingjord | none | NO RESULTS; suggests: Cart, Carrot, Early Axes | 0/0 | - |
| 56 | health regen | effect | Minor Healing Mead | none | i:Mead Base: Lingering Health; p:Hearth | 1/2 | - |
| 57 | stamina | effect | Minor Stamina Mead | 3 | i:Lingering Stamina Mead; i:Medium Stamina Mead; i:Minor Stamina Mead | 6/6 | 2 |
| 58 | frost resistance | effect | Frost Resistance Mead | 1 | i:Frost Resistance Mead; i:Mead Base: Frost Resistance | 2/2 | 1 |
| 59 | poison resist | effect | Poison Resistance Mead | 1 | i:Poison Resistance Mead; i:Mead Base: Poison Resistance | 2/2 | 1 |
| 60 | heal | effect | Minor Healing Mead | 7 | i:Curious Axe Head; i:Mysterious Axe Head; i:Mead Base: Lingering Health | 8/8 | 4 |
| 61 | fire resistance | effect | Fire Resistance Barley Wine | 1 | i:Fire Resistance Barley Wine; i:Barley Wine Base: Fire Resistance | 2/2 | 1 |
| 62 | comfort | effect | (comfort pieces) | - | p:Armour Stand; p:Ashwood Bed; p:Ashwood Bench | 0/8 | - |
| 63 | cold | effect | Frost Resistance Mead | none | NO RESULTS | 0/0 | 1 |
| 64 | burial chamber | place | (not in site / nearest page) | - | NO RESULTS; suggests: Hammer, Amber, Amber Pearl | 0/0 | - |
| 65 | crypt | place | (not in site / nearest page) | - | i:Swamp Key | 1/1 | - |
| 66 | troll cave | place | (not in site / nearest page) | - | i:Troll Hide Cape | 1/1 | - |
| 67 | black forest | place | (not in site / nearest page) | - | i:Heart of the Forest; i:Black Metal; i:Black Metal Scrap | 8/8 | - |
| 68 | swamp | place | (not in site / nearest page) | - | i:Swamp Key | 1/1 | - |
| 69 | mistlands | place | (not in site / nearest page) | - | NO RESULTS | 0/0 | - |
| 70 | haldor | place | (not in site / nearest page) | - | NO RESULTS; suggests: Galdr Table | 0/0 | - |
| 71 | meadows | place | (not in site / nearest page) | - | NO RESULTS | 0/0 | - |
| 72 | draugr | creature | Draugr | 4 | i:Draugr Fang; t:Draugr Trophy; t:Draugr Elite Trophy | 5/5 | 1 |
| 73 | skeleton | creature | Skeleton | 2 | t:Skeleton Trophy; c:Skeleton | 2/2 | 1 |
| 74 | surtling | creature | Surtling | 2 | i:Surtling Core; c:Surtling | 2/2 | 1 |
| 75 | serpent | creature | (not in site / nearest page) | - | NO RESULTS | 0/0 | - |
| 76 | greydwarf nest | creature | (not in site / nearest page) | - | i:Greydwarf Eye; t:Greydwarf Trophy; t:Greydwarf Brute Trophy | 7/8 | - |
| 77 | how do I get flint | how | Flint | 1 | i:Flint; i:Flint Axe; i:Flint Knife | 8/8 | 1 |
| 78 | how to make iron | how | Iron | 3 | i:Iron Mace; i:Iron Tower Shield; i:Iron | 8/8 | 1 |
| 79 | where to find tin | how | Tin | 1 | i:Tin; i:Tin Ore; i:Torch | 8/8 | 1 |
| 80 | how do I craft a bow | how | Crude Bow | 1 | i:Crude Bow; i:Finewood Bow; i:Huntsman Bow | 8/8 | 1 |
| 81 | what do trolls drop | how | Troll Hide | 2 | i:Bread Dough; i:Troll Hide; i:Troll Leather Tunic | 8/8 | 3 |
| 82 | how to summon eikthyr | how | Eikthyr | 10 | i:Hoe; i:Crude Bow; i:Torch | 8/8 | 1 |
| 83 | best sword | how | (not in site / nearest page) | - | i:Iron Sword; i:Bronze Sword; i:Silver Sword | 6/7 | - |
| 84 | what to eat | how | (not in site / nearest page) | - | i:Torch; i:Torn Spirit; i:Fuling Totem | 8/8 | - |
| 85 | how do I build a portal | how | Portal | 19 | i:Ironhead Arrow; i:Iron Atgeir; i:Iron Axe | 8/8 | 1 |
| 86 | portal | how | Portal | 1 | p:Portal | 0/1 | 1 |
| 87 | bed | how | Bed | 1 | p:Bed; p:Ashwood Bed; p:Dragon Bed | 0/6 | 1 |
| 88 | chest | how | Chest | 2 | i:Wolf Hide Chestpiece; p:Chest; p:Reinforced Chest | 1/5 | 1 |
| 89 | campfire | how | Campfire | 1 | p:Campfire | 0/1 | 1 |
| 90 | hearth | how | Hearth | 5 | i:Morgen Heart; i:Crystal Heart; i:Mead Base: Lingering Health | 4/5 | 1 |
| 91 | SwordBronze | id | Bronze Sword | 1 | i:Bronze Sword | 1/1 | - |
| 92 | TrophyHard | id | Eikthyr Trophy | none | t:Hare Trophy | 1/1 | - |
| 93 | darkwood_beam | id | (piece) | - | p:Darkwood Beam 26°; p:Darkwood Beam 45°; p:darkwood_beam_67 | 0/5 | - |
| 94 | wishbone | loop | Wishbone | 1 | i:Wishbone | 1/1 | 1 |
| 95 | dragon egg | loop | Dragon Egg | 1 | i:Dragon Egg | 1/1 | 1 |
| 96 | carrot seeds | loop | Carrot Seeds | 1 | i:Carrot Seeds | 1/1 | 1 |
| 97 | cultivator | loop | Cultivator | 1 | i:Cultivator | 1/1 | 1 |
| 98 | karve | loop | (not in site / nearest page) | - | p:Karve | 0/1 | - |
| 99 | longship | loop | (not in site / nearest page) | - | p:Longship | 0/1 | - |
| 100 | mead base | loop | (mead bases) | - | i:Mead Base: Tasty; i:Mead Base: Lightfoot; i:Mead Base: Minor Eitr | 8/8 | - |
| 101 | ymir flesh | loop | Ymir Flesh | 1 | i:Ymir Flesh | 1/1 | 1 |
| 102 | wolf pelt | loop | Wolf Pelt | 1 | i:Wolf Pelt | 1/1 | 1 |
| 103 | iron nails | loop | Iron Nails | 1 | i:Iron Nails | 1/1 | 1 |
| 104 | flax | loop | Flax | 1 | i:Flax | 1/1 | 1 |
| 105 | serpent meat | loop | (not in site / nearest page) | - | i:Meat Platter; i:Uncooked Meat Platter; i:Bear Meat | 8/8 | - |
| 106 | pickaxe | loop | Pickaxe | none | i:Iron Pickaxe; i:Stone Pickaxe; i:Antler Pickaxe | 5/5 | - |
| 107 | bow | loop | Bow | none | i:Crude Bow; i:Finewood Bow; i:Huntsman Bow | 6/6 | - |
| 108 | arrow | loop | Arrow | none | i:Fire Arrow; i:Ironhead Arrow; i:Wood Arrow | 8/8 | - |
| 109 | shield | loop | Shield | none | i:Shield Core; i:Wood Shield; i:Banded Shield | 8/8 | - |

Summary of the table (queries with a known expected item that exists in the data, n=104 in my numbers): exact full names are fine (17 of 23 at rank 1; the 6 misses are all boss/creature/trophy ordering or group order: Eikthyr, The Elder, Fenring, Bonemass, Yagluth, Moder). Exact short names 0 of 7. Creature words (draugr, skeleton, surtling) 0 of 3. Typos 8 of 12. "how" phrases 6 of 12. Effects 3 of 8.

## What the code does (src/features/search/)
- `search.ts`: MiniSearch fields `name, id, aliases, tags`, boost name 3 and id 1.5, `prefix: true`, fuzzy 0.2 for terms of 3+ letters (distance 1 for 3 to 7 letters), `combineWith: 'AND'`, falls back to OR if empty. The score order is then thrown away: hits are put into a Map by group and emitted in the fixed `GROUP_ORDER`, `limit` 8 per group.
- MiniSearch default weights are fuzzy 0.45 above prefix 0.375, so a one-letter typo match beats a legitimate prefix match ("heal" -> Curious Axe Head, Mysterious Axe Head above Healing Mead).
- `id` is an indexed field with boost 1.5. This makes internal ids leak into results: Torn Spirit (id `YagluthDrop`) shows for "Yagluth" and is the first row; and the match is invisible to the user.
- Rows (`SearchResults.tsx`): right column is `h.detail || h.id`; only pieces have `detail`. Items, trophies, creatures, bosses and stations always print the id.
- `suggest()` uses fuzzy 0.34, OR, names only, no score floor, so it always returns something unrelated.
- `useHitKeys`: Enter opens `flat[0]`, which is the first item of the first group, not the best match.
- Recent items (palette empty query) are listed as "Recent"; the Home page shows the same as chips.

## Ranking rules to change
1. **Never re-sort by group.** Keep MiniSearch score order for the "best match" and show a single "Best match" row at the top; Enter opens it. Then group the rest. Order the groups by their best hit score, not a fixed list. (Evidence: raw scores had exact name first for all 14 cases I printed; rank 1 improved from 57 to 80 in the prototype.) Effort S.
2. **Exact-name bonus.** If the normalised query equals a name or alias, add a large constant; add a smaller one when the name starts with the query or has a word equal to it. Handles "Bear", "Hearth", "Chest", "Bonemass". Effort S.
3. **Remove `id` from the searched fields.** Resolve ids with a separate exact lookup only (someone pasting `SwordBronze`), and never display them. Effort S.
4. **Prefix above fuzzy:** `weights: { prefix: 0.9, fuzzy: 0.3 }`; keep fuzzy for 3+ letters but only distance 1 for under 6 letters (it already is), and no fuzzy for the first-word of an exact match. Stops "heal" matching "head". Effort S.
5. **Index more text:** `description` (low boost 0.5) and food `effect`; add aliases for what players say: "Iron ore" and "Iron scrap" (Scrap Iron), "raw meat" (Boar Meat), "fishing pole", "bog witch", "Megingjord" if added. Items `tags` are empty today, so use `category` words ("sword", "bow", "food", "mead", "armor") instead. Effort S to M (alias data belongs in data/, not components).
6. **Index Places, biomes and the page list** as groups (Places 79, biomes, 29 menu entries, console commands, skills). Rows open /places etc. (Places has no detail route; link to `/places` with a query or hash.) Effort M.
7. **Query clean-up:** strip filler words ("how do I", "where to find", "what do ... drop", "the" only when other words exist) when the query has 3+ words so "how do I build a portal" ranks Portal first (now 19th) and "how to summon eikthyr" ranks Eikthyr first (now 10th). Effort S.
8. **Show 5 per group on the palette with a "Show all" link,** and make the creature/boss row reachable without scrolling (Ctrl+K "wolf" shows the creature Wolf below the fold). Effort S.
9. **`suggest()` needs a floor:** only suggest when the best fuzzy score is above a threshold or the edit distance is at most 2; otherwise say nothing (see design). Effort S.
10. **Row text:** replace the id with a one-line type and fact ("Boss, Swamp", "Item, Ashlands, drops from Bonemaw", "Mead, restores health"), using fields that already exist (category, biome, description). Effort S.

## Not-found design
Principle: a blank or honest line beats a wrong line. Never offer a suggestion that is not close.

1. **Close spelling:** only if a name is within edit distance 2 (or the score floor). "Did you mean **Troll**?" as one big tap target. Otherwise skip this line.
2. **Where the words might live:** if the query matches a biome, place, page or command text, offer it (query "burial chamber" -> Places: Burial Chamber; "swamp" -> Swamp zone page; "haldor" -> Places: Haldor the Trader; "console" -> Console commands).
3. **Plain statement:** "Nothing called "megingjord" in the site yet." Add a second line only for kids: "Try one word, like a name: iron, troll, bed."
4. **Fallbacks as buttons (same in every entry point):** [Search Items for "carry weight"] (`/items?q=...`, already supported), [Browse Creatures], [Browse Places], [Browse all items]. Keep to 3 buttons maximum.
5. **Never leave a bare dead end:** also show "Recently viewed" under it, since mid-game the next thing wanted is often the last thing seen.
6. **Wording for 10 to 12 year olds:** avoid "No results for"; use "Not found" and an example. No ids, no jargon.
7. **Same component** in palette and Home (today Home adds "Or browse all items" and the palette does not).

Mock (palette):
```
Not found: "burial chamber"
Maybe you want:  Places > Burial Chamber    (only if indexed)
[Search Items]  [Browse Places]  [Browse all items]
Recently viewed: Flint  Iron  Wishbone
```

## Entry-point comparison
| Behaviour | Header box | Home big box | `/` key | Ctrl+K | Mobile "Search" tab |
|---|---|---|---|---|---|
| What it is | A read-only input (`readOnly`, `aria-label "Open search"`) that opens the palette | Real input, `autoFocus`, inline results on page | Opens the palette | Opens the palette | Opens the palette |
| Result limit | 8 per group | 20 per group | 8 | 8 | 8 |
| Empty query | palette: "Recent" list or "Type to search. Recent items appear here." | Zone cards, Browse chips, Recently viewed | same as palette | same | same |
| Not found | palette: bare line + suggestions, no browse link | adds "Or browse all items" | palette | palette | palette |
| Keys | Up/Down/Enter/Esc; Enter opens first flat hit | Up/Down/Enter; no Esc | same as palette | same | same |
Findings from this: on Home, pressing `/` while not typing opens the palette over the page that already has a focused search box (two search surfaces, Home box is autoFocus so `/` is usually ignored because `isTyping` is true; after clicking elsewhere, it opens a second box). The header "input" cannot be typed into; typing after clicking opens the palette and the typed first key is lost (`readOnly`). Behaviour is otherwise consistent because both use `search()` and `useHitKeys`. Verified live: Home "bonemass" + Enter opened Bonemaw Meat; palette (`/`, Ctrl+K) matched the offline output exactly.

## Findings
| ID | Sev | Evidence | Fix | Effort |
|---|---|---|---|---|
| E1 | High | `search.ts` `GROUP_ORDER` re-sorts hits. "Bonemass" -> Bonemaw Meat, Bonemaw Tooth, Cooked Bonemaw Meat, then Bonemass Trophy, boss 7th; live Enter opens Bonemaw Meat (screenshot ...-42.jpg). Short names 0 of 7 at rank 1; Hearth 5th behind Morgen Heart; Chest 2nd behind Wolf Hide Chestpiece. Raw score had the exact name first. | Best-match row + score order + exact-name bonus (rules 1, 2) | S |
| E2 | High | Id on right of 369 of 415 visible rows (e.g. `BoneMawSerpentMeat`, `TrophyBonemass`, `TrinketSilverDamage`); `SearchResults.tsx` `h.detail \|\| h.id`. Confirms pattern 7. | One-line type/fact instead of id (rule 10); CI check against CamelCase/snake_case in rows | S |
| E3 | High | Places, biomes, pages, commands, skills not indexed. "burial chamber", "troll cave", "sunken crypt", "haldor", "mistlands", "meadows", "console commands", "planner", "checklist" all return nothing relevant, though the data has Burial Chamber, Troll Cave, Sunken Crypt, Haldor the Trader. | Rule 6 | M |
| E4 | High | Not-found suggestions are noise: "burial chamber" -> Hammer, Amber, Amber Pearl (screenshot ...-43.jpg); "haldor" -> Galdr Table; "carry weight" -> Cart, Carrot, Early Axes. `suggestFuzzy` 0.34, no floor. | Not-found design and rule 9 | S |
| E5 | Med | `id` field indexed at 1.5: "yagluth" lists Torn Spirit (id `YagluthDrop`) first. | Rule 3 | S |
| E6 | Med | Fuzzy outranks prefix (MiniSearch defaults): "heal" -> Curious Axe Head first; "trol" -> Troll creature 7th. | Rule 4 | S |
| E7 | Med | Natural-language queries go OR-fallback and match filler words: "how do I build a portal" Portal 19th; "how to summon eikthyr" 10th; "what to eat" -> Torch, Torn Spirit; "what do trolls drop" -> Bread Dough first. | Rule 7 (and eventually a few intent keywords: "eat" -> Food page) | S |
| E8 | Med | Description (443/446) and food `effect` text unindexed: "health regen", "carry weight", "burn damage", "cold" find nothing or wrong; items `tags` empty so the `tags` field is dead weight. | Rule 5 | S-M |
| E9 | Med | Palette and Home differ: limit 8 vs 20, not-found text differs, Home `/` double surface, header box is a fake read-only input. | One shared SearchPanel; one NoResults; make header a button | M |
| E10 | Med | Palette shows 8 per group and the group is a scroll box: "wolf" creature Wolf below the fold (screenshot ...-44.jpg), "bear" creature 11th. | Rule 1 plus 5 per group and "Show all" | S |
| E11 | Low | Aliases missing for common player words: "iron ore", "raw meat", "fishing pole"; old names; "serpent"/"megingjord" absent from data (content, example only). | Add aliases to data; extend validate to show unmatched popular words | S |
| E12 | Low | One piece has a snake_case display name: `darkwood_beam_67` appears as a result name (1 of 242 pieces; 22 pieces have no detail and show the id). | Fix name in data, validate rule against `_` in names | S |
| E13 | Low | Enter opens the first hit, no "nothing selected" for empty list; Esc not handled on Home; `Search` input type search has a native clear (x) but palette Esc closes the whole palette (acceptable). | Esc clears query first, closes second | S |
| E14 | Low | Tests assert only a few ranks (`search.test.ts`): none for short names, none for typos of bosses, none for Enter target. | Add the 20 queries above as a table test; add "no row text matches /[a-z][A-Z]/" test | S |

## Protect this
- The search is fast and already forgiving (typos like "bronse sword", "coper", "workbech", "mushrom" work; aliases like deerskin, core wood, goblin king work); keep MiniSearch and the AND-then-OR design.
- Recent items in the empty palette and Home chips; Esc restoring focus to the opener (`CommandPalette`); `/` and Ctrl+K shortcuts; piece rows with `detail` ("at Workbench · comfort 2 · Bed") are exactly the right style of row, extend it to all kinds.
- Aliases living in data, not code.

## Could not check
- Phone width UI and Big text mode for search (no resize; I only verified 1280x720 via iframe). The mobile Search tab was read from code only.
- Real keyboard Up/Down highlight behaviour in the UI beyond one Enter test; keyboard-only focus return after Esc (read from code).
- Whether the proposal prototype holds with hand-tuned weights; numbers are indicative.
- Whether queries like "megingjord" belong in the data (another role).
- First-run state in a fresh Playwright context (sandboxed iframe covered storage; Recently viewed was empty there).
- Owner's saved state was not touched, so "Recent" ordering with his history was not seen.

## Appendix: ranking prototype
Throwaway code lives in my scratchpad (`prop.ts`, `run.ts`, `raw.ts`), not in the repo.
