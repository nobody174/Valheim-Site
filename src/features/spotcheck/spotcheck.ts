import type { Armor, GameData, Item, Weapon } from '../../data/schemas';

export interface CheckRow {
  /** Stable key for the tick, for example "gear:SwordBronze". */
  key: string;
  id: string;
  label: string;
  /** What the site says, to compare with the game. */
  expect: string;
}

export interface CheckGroup {
  id: string;
  title: string;
  /** How to look at it in game, in a sentence. */
  how: string;
  rows: CheckRow[];
}

export interface ZoneChecks {
  zone: string;
  name: string;
  groups: CheckGroup[];
}

/**
 * Lines already seen matching in the real game: key -> the text that was confirmed (null for an old
 * entry that was filed without it). If the site's text for a line later changes, the confirmation
 * no longer covers it and the line comes back as "changed".
 */
export type Confirmed = ReadonlyMap<string, string | null>;
export type RowStatus = 'open' | 'confirmed' | 'changed';

export function rowStatus(row: CheckRow, confirmed: Confirmed): RowStatus {
  if (!confirmed.has(row.key)) return 'open';
  const text = confirmed.get(row.key);
  return text === null || text === row.expect ? 'confirmed' : 'changed';
}

const num = (n: number) => String(Math.round(n * 10) / 10);
const take = <T>(list: T[], n: number) => list.slice(0, n);

/** The game's item tooltip never prints these, so they cannot be checked by hovering. */
const HIDDEN_IN_TOOLTIP = new Set(['chop', 'pickaxe']);

type Needed = Pick<
  GameData,
  'biomes' | 'items' | 'weapons' | 'armor' | 'foods' | 'recipes' | 'creatures' | 'bosses' | 'stations'
>;

/** One function per kind of line, so the Check in game list and the item pages say the same thing. */
function rowBuilders(data: Needed) {
  const item = new Map(data.items.map((i) => [i.id, i]));
  const nameOf = (id: string) => item.get(id)?.name ?? data.creatures.find((c) => c.id === id)?.name ?? id;
  const station = new Map(data.stations.map((s) => [s.id, s.name]));

  return {
    nameOf,
    weapon: (w: Weapon): CheckRow => ({
      key: `gear:${w.item}`,
      id: w.item,
      label: nameOf(w.item),
      expect: `${Object.entries(w.damage)
        .filter(([k]) => !HIDDEN_IN_TOOLTIP.has(k))
        .map(([k, v]) => `${k} ${num(v)}`)
        .join(', ')}${w.durability ? ` · durability ${num(w.durability)}` : ''}${w.blockPower ? ` · block ${num(w.blockPower)}` : ''}`,
    }),
    armor: (a: Armor): CheckRow => ({
      key: `gear:${a.item}`,
      id: a.item,
      label: nameOf(a.item),
      expect: `armor ${num(a.armor)} · ${a.slot}${a.durability ? ` · durability ${num(a.durability)}` : ''}`,
    }),
    recipe: (r: GameData['recipes'][number]): CheckRow => ({
      key: `recipe:${r.id}`,
      id: r.output.item,
      label: nameOf(r.output.item),
      expect: `${r.station ? `${station.get(r.station.id) ?? r.station.id} level ${r.station.minLevel}: ` : ''}${r.inputs
        .map((i) => `${i.qty} ${nameOf(i.item)}`)
        .join(', ')}`,
    }),
    food: (f: GameData['foods'][number]): CheckRow => ({
      key: `food:${f.item}`,
      id: f.item,
      label: nameOf(f.item),
      expect: `health ${num(f.health ?? 0)} · stamina ${num(f.stamina ?? 0)} · lasts ${Math.round((f.durationSec ?? 0) / 60)} min`,
    }),
    creature: (c: GameData['creatures'][number]): CheckRow => ({
      key: `creature:${c.id}`,
      id: c.id,
      label: c.name,
      expect: `drops ${c.drops.map((d) => nameOf(d.item)).join(', ')}`,
    }),
    boss: (b: GameData['bosses'][number]): CheckRow => ({
      key: `boss:${b.id}`,
      id: b.id,
      label: b.name,
      expect: `summon with ${b.summonItems.map((s) => `${s.qty} ${nameOf(s.item)}`).join(', ') || 'unknown'} · drops ${b.drops.map((d) => nameOf(d.item)).join(', ')}`,
    }),
    /** The hand-written "where to get it" line, or null when the item has none. */
    where: (i: Item): CheckRow | null => {
      const note = i.obtainedFrom.find((o) => o.type === 'gather' || o.type === 'other');
      const text = note ? ('node' in note ? note.node : 'note' in note ? note.note : '') : '';
      return text ? { key: `where:${i.id}`, id: i.id, label: i.name, expect: text } : null;
    },
  };
}

/**
 * The entries most worth checking in game, per zone: gear numbers, recipes, foods, a few creature
 * drops, the boss altar, and the hand-written "where to get" lines that nothing checks. Built from
 * the data, so it always says what the site says now. Lines already confirmed (and unchanged) are
 * left out.
 */
export function buildSpotChecks(data: Needed, confirmed: Confirmed = new Map()): ZoneChecks[] {
  const b = rowBuilders(data);
  const item = new Map(data.items.map((i) => [i.id, i]));

  return [...data.biomes]
    .sort((a, c) => a.order - c.order)
    .map((z) => {
      const inZone = (id: string) => item.get(id)?.biome === z.id;
      const groups: CheckGroup[] = [];

      const weapons = data.weapons
        .filter((w) => inZone(w.item) && w.skill !== 'None' && !/^(Arrow|Bolt)/.test(w.item))
        .sort((x, y) => Object.values(y.damage).reduce((p, q) => p + q, 0) - Object.values(x.damage).reduce((p, q) => p + q, 0));
      const armor = data.armor.filter((a) => inZone(a.item)).sort((x, y) => y.armor - x.armor);
      const gear: CheckRow[] = [...take(weapons, 6).map(b.weapon), ...take(armor, 4).map(b.armor)];
      if (gear.length) {
        groups.push({
          id: 'gear',
          title: 'Weapons and armor',
          how: 'Open your inventory and hover the item. Compare the damage or armor and the durability of an un-upgraded one. The tooltip does not show chop or pickaxe damage, so those are left out.',
          rows: gear,
        });
      }

      const made = data.recipes
        .filter((r) => inZone(r.output.item) && ['weapon', 'armor', 'tool'].includes(item.get(r.output.item)?.category ?? ''))
        .sort((x, y) => (x.station?.id ?? '').localeCompare(y.station?.id ?? '') || b.nameOf(x.output.item).localeCompare(b.nameOf(y.output.item)));
      // Spread over stations: take every other so one station does not fill the list.
      const picked = made.filter((_, i) => i % 2 === 0);
      const recipes = take(picked, 8).map(b.recipe);
      if (recipes.length) {
        groups.push({
          id: 'recipes',
          title: 'Recipes',
          how: 'Stand at the station and open its crafting list. Check the materials and the station level.',
          rows: recipes,
        });
      }

      const foods = data.foods
        .filter((f) => inZone(f.item) && f.health !== undefined)
        .sort((x, y) => (y.health ?? 0) - (x.health ?? 0));
      const foodRows = take(foods, 5).map(b.food);
      if (foodRows.length) {
        groups.push({
          id: 'food',
          title: 'Foods',
          how: 'Hover the food in your inventory: health, stamina and how long it lasts.',
          rows: foodRows,
        });
      }

      const creatures = data.creatures
        .filter((c) => c.biome === z.id && c.drops.length > 0)
        .sort((x, y) => y.drops.length - x.drops.length);
      const creatureRows = take(creatures, 3).map(b.creature);
      if (creatureRows.length) {
        groups.push({
          id: 'creatures',
          title: 'Creature drops',
          how: 'Kill a few and look at what they drop. Rare drops may need several tries.',
          rows: creatureRows,
        });
      }

      const bossRows = data.bosses.filter((x) => x.biome === z.id).map(b.boss);
      if (bossRows.length) {
        groups.push({
          id: 'boss',
          title: 'Boss altar',
          how: 'The altar tells you what it wants. The drops are what the boss leaves.',
          rows: bossRows,
        });
      }

      const guessed = data.items
        .filter((i) => i.biome === z.id && (i.verified === 'unverified' || confirmed.has(`where:${i.id}`)))
        .flatMap((i) => b.where(i) ?? []);
      if (guessed.length) {
        groups.push({
          id: 'where',
          title: 'Written by hand: where to get it',
          how: 'These lines are from guides, not the game files. Do they match what you found?',
          rows: take(guessed, 6),
        });
      }

      const open = groups
        .map((g) => ({ ...g, rows: g.rows.filter((r) => rowStatus(r, confirmed) !== 'confirmed') }))
        .filter((g) => g.rows.length > 0);
      return { zone: z.id, name: z.name, groups: open };
    });
}

/** Every line there can be, one per key: used to look a confirmation up again after the data changed. */
export function allRows(data: Needed): CheckRow[] {
  const b = rowBuilders(data);
  const rows = new Map<string, CheckRow>();
  const add = (r: CheckRow | null) => r && rows.set(r.key, r);
  data.weapons.forEach((w) => add(b.weapon(w)));
  data.armor.forEach((a) => add(b.armor(a)));
  data.recipes.forEach((r) => add(b.recipe(r)));
  data.foods.forEach((f) => add(b.food(f)));
  data.creatures.forEach((c) => add(b.creature(c)));
  data.bosses.forEach((x) => add(b.boss(x)));
  data.items.forEach((i) => add(b.where(i)));
  return [...rows.values()];
}

/** The lines that can be checked for one item, creature or boss, for its own page. */
export function rowsForEntity(data: Needed, id: string): CheckRow[] {
  const b = rowBuilders(data);
  const rows: CheckRow[] = [];
  const add = (r: CheckRow | null) => r && rows.push(r);
  data.weapons.filter((w) => w.item === id).forEach((w) => add(b.weapon(w)));
  data.armor.filter((a) => a.item === id).forEach((a) => add(b.armor(a)));
  data.foods.filter((f) => f.item === id && f.health !== undefined).forEach((f) => add(b.food(f)));
  data.recipes.filter((r) => r.output.item === id).forEach((r) => add(b.recipe(r)));
  data.items.filter((i) => i.id === id).forEach((i) => add(b.where(i)));
  data.creatures.filter((c) => c.id === id && c.drops.length > 0).forEach((c) => add(b.creature(c)));
  data.bosses.filter((x) => x.id === id).forEach((x) => add(b.boss(x)));
  return rows;
}

/** Confirmed lines whose text on the site is not what was confirmed any more (or that no longer exist). */
export interface StaleConfirmation {
  key: string;
  /** The site's text now, or null when the line no longer exists. */
  now: string | null;
  was: string | null;
}

export function staleConfirmations(data: Needed, confirmed: Confirmed): StaleConfirmation[] {
  const byKey = new Map(allRows(data).map((r) => [r.key, r]));
  return [...confirmed.entries()].flatMap(([key, was]): StaleConfirmation[] => {
    const row = byKey.get(key);
    if (!row) return [{ key, now: null, was }];
    return was !== null && was !== row.expect ? [{ key, now: row.expect, was }] : [];
  });
}
