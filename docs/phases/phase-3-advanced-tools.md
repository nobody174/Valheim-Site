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

Acceptance:
- [ ] Graph for Copper, Bronze, Iron and a late-game item all render correctly from data
- [ ] Layout is stable and readable; no overlapping nodes at default depth
- [ ] Works offline; keyboard accessible node focus and "open page" action
- [ ] Tests for the graph-to-nodes/edges transform

## Step 2 - Build planner

- Pick one or more target items and quantities, and optionally a quality level.
- Output: total raw materials (recursive expansion), stations and levels required, upgrade
  requirements, and **missing resources** after subtracting the profile's inventory.
- Inventory editor (per profile): quick entry, persisted.
- Shopping list: grouped by biome and by station, tick-off, copy as text.

Acceptance:
- [ ] Totals match hand-calculated examples (add unit tests with at least 5 cases incl. upgrades)
- [ ] Cyclic or missing recipes handled without crashing
- [ ] Inventory and shopping list persist per profile

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
  limited to foods available up to a chosen biome.
- **Upgrade calculator:** total cost from quality 1 to a target, station level needed.
- **Compare:** two to four weapons or armor pieces side by side.
- **Next-steps advisor:** from checklist progress, suggest what to do or craft next, with
  the reason shown (which unmet requirement it unlocks).

Acceptance:
- [ ] Optimizer output verified against a brute-force test on a small dataset
- [ ] Advisor never suggests something whose prerequisites are unmet
- [ ] All tools usable from item pages via a link or button

## Checkpoint (per step)

Owner tests in real play. Update ROADMAP after each step.
