# Phase 3 - Advanced tools

**Goal:** the features that make the site better than a wiki. All derived from the graph; no
new stored data except what the owner explicitly approves.

Each step is its own session and its own checkpoint.

## Step 1 - Interactive crafting graph

- React Flow + dagre layout. Click any item (from an item page or the palette) to open its graph.
- Node types: material, item, station, creature/source. Edges: "crafted from" / "used in".
- Modes: "Needs" (everything required to make this), "Unlocks" (everything this leads to),
  "Both". Default depth 2, expand a node on click to go further.
- Zoom, pan, fit-to-view, mini-map, highlight path on hover, click a node to open its page.
- Show the station and level on each recipe edge.
- Performance: keep it smooth with the full dataset (collapse long chains, limit visible nodes,
  report the measured frame behavior).

Built (`/graph`, `src/features/graph/`): React Flow with a dagre left-to-right layout, loaded only when the page is opened (a separate 232 kB chunk, 76 kB gzip). Needs, Unlocks and Both, depth 1 to 5 (default 2), click a node to open its page, centre the graph on it or expand it one more step. Edges carry the amount, station and level; items with no recipe show up to two creatures that drop them. Hover highlights the whole path; zoom, pan, fit and a mini-map. An item used in dozens of recipes shows 10 products until expanded, and the graph stops at 80 nodes. A plain list of the nodes (links) sits below the canvas for keyboard and screen-reader use. Station nodes are not drawn; the station is on the edge. Measured: about 144 frames per second while zooming, the largest default graph is 13 nodes.

Acceptance:
- [x] Graph for Copper, Bronze, Iron and a late-game item all render correctly from data
- [x] Layout is stable and readable; no overlapping nodes at default depth (tested for 7 items in all 3 modes)
- [x] Works offline (the chunk is precached); node focus is by keyboard through React Flow, plus the plain link list
- [x] Tests for the graph-to-nodes/edges transform and the layout

## Step 2 - Build planner

- Pick one or more target items and quantities, and optionally a quality level.
- Output: total raw materials (recursive expansion), stations and levels required, upgrade
  requirements, and **missing resources** after subtracting the profile's inventory.
- Inventory editor (per profile): quick entry, persisted.
- Shopping list: grouped by biome and by station, tick-off, copy as text.

Built (Planner page, `/planner`; `src/features/planner/`): targets with amount and upgrade level, recursive expansion with inventory used first at every level, stations with levels (upgrades raise the level by one per quality), shopping list by zone with tick-off and copy as text, crafting steps by station, inventory editor. "Plan this" link on item pages. Where an item has several recipes the first is used. Station build costs are not added to the totals.

Acceptance:
- [x] Totals match hand-calculated examples (9 unit tests, including upgrades and inventory)
- [x] Cyclic or missing recipes handled without crashing
- [x] Inventory and shopping list persist per profile (`profile.inventory`, `profile.planner`)

## Step 3 - Rankings

- **Weapon rankings:** formulas in ARCHITECTURE.md, shown on the page. Filters: biome, tier,
  weapon type. Columns: raw damage, damage types, attack speed, stamina efficiency, repair
  cost, reach, overall PvE rating, with the weights visible and adjustable locally.
  Optional "vs creature" mode using resistances.
- **Armor rankings:** sort by armor value, weight, movement penalty, set bonus, craft cost,
  upgrade cost. Presets: Tank, Exploration, Mage, Light, Heavy, each with a documented rule.
- Mark values "approximate" where attack timing or other inputs are not verified.

Built (Rankings page, `/rankings`, tabs Weapons and Armor):
- Weapons: per hit, per combo, per stamina, estimated DPS, reach, rating, damage types,
  knockback, durability. Filters: zone (with "include earlier zones"), type, upgrade level,
  name, "vs creature". "Best in each zone" view. Rating weights are editable and live in the URL.
- Armor: armor at upgrade level, weight, speed, set, craft and upgrade cost. Presets: Tank,
  Exploration, Light, Set bonus.
- Not built, on purpose: repair cost (not in the data), Mage and Heavy presets (no Eitr armor until
  Mistlands; Heavy would equal Tank), "tier" filter (zone is the tier in this data).

Acceptance:
- [x] Every ranking number is derived in code from raw stats; nothing computed is stored
  (`src/data/attackModel.ts`, `src/data/weaponStats.ts`, `src/features/rankings/`). The data only
  holds the game's own clip timings and attack settings.
- [x] Formulas are documented in the UI ("How these numbers are calculated") and tested with known
  inputs (`attackModel.test.ts`, `weaponRanking.test.ts`, `armorRanking.test.ts`)
- [x] Filters and sorting are instant (everything is computed in memory from a few dozen rows)
- [ ] **Owner to verify in game:** the DPS estimate. Attack timing is `unverified`. Compare how
  long a bronze sword, axe and spear combo takes in game with the page, and tell me which
  weapons are off so the model can be corrected.

## Step 4 - Optimizer, upgrade calculator, compare

- **Food optimizer:** best 3-food combination for a goal (health, stamina, Eitr, balanced),
  limited to foods available up to a chosen biome. Built (`/optimizer`, `src/features/food/`): tries every set of three different foods (exact), five best shown with rules per goal, optional minimum duration; checked against an independent brute-force search in tests. Meads, raw berries and mushrooms are not included. Food data now also holds Eitr and health regeneration.
- **Upgrade calculator:** total cost from quality 1 to a target, station level needed. Built (`/upgrades`, `src/features/upgrades/`): pick an item and a from and to level; shows total cost, each step with its station level, and weapon damage at both levels. Linked from item pages.
- **Compare:** two to four weapons or armor pieces side by side. Built (`/compare`, `src/features/compare/`): ids and upgrade level in the URL, same numbers as the rankings, best value per row marked; linked from gear pages.
- **Next-steps advisor:** from checklist progress, suggest what to do or craft next, with
  the reason shown (which unmet requirement it unlocks). Built (`/next`, `src/features/advisor/`): "You can craft now" (every ingredient collected, crafted or in the inventory), "Worth collecting" (the only missing ingredient of something craftable, never an item that can itself be crafted) and the next boss with summon items held and missing. A zone opens once the boss before it is down (its trophy ticked). A randomized test over 40 profiles on the real data checks no suggestion has an unmet prerequisite.

Acceptance:
- [ ] Optimizer output verified against a brute-force test on a small dataset
- [ ] Advisor never suggests something whose prerequisites are unmet
- [ ] All tools usable from item pages via a link or button

## Checkpoint (per step)

Owner tests in real play. Update ROADMAP after each step.
