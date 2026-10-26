# Phase 1 - MVP

**Goal:** something usable while playing: find anything fast, see what it is used for, and
track progress. Runs on the seed data (Meadows + Black Forest).

## Part A - Lookup (session 1)

1. **Global search:** MiniSearch index over items, creatures, bosses, stations, trophies.
   Fuzzy + prefix, results grouped by category, keyboard navigation.
   **Ctrl+K / `/`** opens a command palette from any page; recent items shown when empty.
2. **Item page** (one template for all item categories):
   icon placeholder, name, biome, weight, stack size, tags, hoard badge + note,
   "Where found / Dropped by / Gathered from", "Used in", "Crafted from", "Can craft into".
   Every item name anywhere in the app is a link to its page.
3. **Basic recipe view** on the item page: direct inputs, outputs, station and level, upgrade
   costs. (The full graph is Phase 3.)
4. **Hoard badges and filter:** list view of all items filterable by hoard category and biome.
5. **Verified badge:** show the `verified` level on item pages; unverified data is visibly marked.

### Part A acceptance

- [ ] Search results appear in under 100 ms on the seed data (measure and report)
- [ ] Every id reference on an item page resolves to a working link
- [ ] Item page works for a material, a weapon, a food and a trophy
- [ ] Keyboard-only: open palette, search, open result, return
- [ ] Tests for search ranking basics and for graph lookups used by the page

**Checkpoint A:** owner reviews the live site, then Part B.

## Part B - Persistence and offline (session 2)

1. **State layer** (`src/state/`): versioned localStorage with try/catch, empty-state safe,
   migrations by version.
2. **Profiles:** create / rename / switch / delete. Progress and favorites are per profile.
3. **Checklist:** per item Collected / Crafted / Completed / Farmed toggles, progress bar per
   biome, filter by status.
4. **Favorites:** materials, recipes, gear. Favorites page and a star on every item page.
5. **Hoard overrides:** local override of the default hoard category per item.
6. **Export / Import JSON** of all profiles, with a validation step and a clear error on bad files.
7. **Progression guide (partial):** Meadows and Black Forest pages from data: important
   materials, must-keep items, boss preparation, recommended armor/weapons/food, danger notes.
   Text fields come from the data files, not from components.
8. **PWA:** `vite-plugin-pwa`, manifest, icons (non-game art), precache app shell and `/data`,
   update prompt when a new version is available.

### Part B acceptance

- [ ] Reload keeps all state; clearing storage leaves a working empty app
- [ ] Export, wipe storage, import restores everything
- [ ] After first load, the site works fully with the network off (verify in DevTools offline mode)
- [ ] Installable as an app on desktop Chrome/Edge and on a phone
- [ ] Switching profiles never leaks progress between profiles (test)
- [ ] `npm run build`, `test`, `validate` green; deployed to Pages

## Checkpoint (stop here)

Owner plays with it for a bit, lists problems and missing wishes. Update ROADMAP. Do not start Phase 2.
