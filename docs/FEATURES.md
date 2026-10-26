# Features

## A. Original brief (18 items) and where each lands

| # | Feature | Phase | Notes |
|---|---|---|---|
| 1 | Global search | 1 | MiniSearch, grouped by category, Ctrl+K / `/` |
| 2 | Material database | 1 (seed), 2 (full) | One page template driven by the graph |
| 3 | Recipe explorer | 1 (basic), 3 (full tree) | Crafted from / can craft into / dependencies |
| 4 | Interactive crafting tree | 3 | React Flow, zoom/pan, depth-limited by default |
| 5 | Hoard or trash | 1 | Default in data, local override, filter by category |
| 6 | Trophy database | 2 | Drop source/chance, uses, recommended quantity |
| 7 | Progression guide | 1 (partial), 2 (all biomes) | Per biome: materials, keep list, boss prep, gear, food, dangers |
| 8 | DPS rankings | 3 | Formula in ARCHITECTURE.md, filters biome/tier/type |
| 9 | Armor rankings | 3 | Sort and "best for" presets |
| 10 | Build planner | 3 | Resources, missing (vs inventory), stations, upgrades |
| 11 | Boss database | 2 | Summon items, gear, food, checklist |
| 12 | Creature database | 2 | Health, damage, drops, weaknesses |
| 13 | Food database | 2 | Sortable table, best per tier |
| 14 | Checklist system | 1 | Collected / crafted / completed / farmed |
| 15 | Favorites | 1 | Materials, recipes, gear |
| 16 | Offline / PWA | 1, hardened in 4 | |
| 17 | Data structure | 0 | Extended beyond the 8 listed files, see ARCHITECTURE.md |
| 18 | GitHub deployment | 0 | Actions workflow + docs |

**Data files the brief missed:** stations, biomes, meads/potions, building pieces, upgrade
levels, metadata. Added to the schema.

## B. Suggested additions, ranked by value

Value = how much it improves the actual play experience. Effort: S/M/L.

| Rank | Feature | Value | Effort | Phase |
|---|---|---|---|---|
| 1 | Command-palette search (Ctrl+K), keyboard-first, recent items | Very high | S | 1 |
| 2 | Cross-links everywhere (every item name links to its page; "used in" / "dropped by" lists) | Very high | S | 1 |
| 3 | Export / import progress as JSON (localStorage can be wiped) | Very high | S | 1 |
| 4 | Multiple profiles (per character or world) with separate progress | High | M | 1 |
| 5 | Build planner shopping list with inventory subtraction ("what am I missing") | High | M | 3 |
| 6 | "What should I do next?" suggestions from checklist progress and biome gating | High | M | 3 |
| 7 | Boss preparation checklist (gear, food, mead, summon items) you can tick off | High | S | 2 |
| 8 | Upgrade cost calculator (quality 1 to 4 totals, station level needed) | High | M | 3 |
| 9 | Food optimizer: best 3-food combo for health / stamina / Eitr focus | High | M | 3 |
| 10 | Compare tool: weapons or armor side by side | High | M | 3 |
| 11 | Station unlock chain ("what does the forge level 2 unlock?") | High | S | 2 |
| 12 | Mead and potion page with ingredients, station and duration | Medium-high | S | 2 |
| 13 | "Expedition kit": what to bring to biome X (food, gear, mead, portal materials) | Medium-high | S | 2 |
| 14 | Per-biome "what is worth collecting here" quick view | Medium-high | S | 2 |
| 15 | Second-screen mode: compact layout, large text, dark-friendly, no animations | Medium | S | 4 |
| 16 | Personal notes per item and per profile (portal coordinates, base chest contents) | Medium | M | 5 |
| 17 | Weight and inventory planner (carry weight, ship cargo) | Medium | M | 5 |
| 18 | Farming, cooking and taming reference (grow times, breeding) | Medium | M | 5 |
| 19 | Skills reference | Medium | S | 5 |
| 20 | Console / dev-commands cheat sheet for private worlds | Medium | S | 5 |
| 21 | Random events, raids and weather reference | Medium | S | 5 |
| 22 | Update log: what changed between game versions in the data | Medium | M | 5 |
| 23 | Dungeon and point-of-interest guide (crypts, towers, camps) with loot | Medium | M | 5 |
| 24 | Pinned and recently viewed bar | Low-medium | S | 4 |
| 25 | Printable / shareable view of a checklist or shopping list | Low | S | 5 |

Top 12 are scheduled in Phases 1 to 3. Ranks 13 to 25 are the backlog for Phase 5 and are
picked by the owner when the core site is in use.
