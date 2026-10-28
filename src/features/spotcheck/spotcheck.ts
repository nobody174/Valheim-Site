import type { GameData } from '../../data/schemas';

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

const num = (n: number) => String(Math.round(n * 10) / 10);

/** The game's item tooltip never prints these, so they cannot be checked by hovering. */
const HIDDEN_IN_TOOLTIP = new Set(['chop', 'pickaxe']);
const take = <T>(list: T[], n: number) => list.slice(0, n);

type Needed = Pick<
  GameData,
  'biomes' | 'items' | 'weapons' | 'armor' | 'foods' | 'recipes' | 'creatures' | 'bosses' | 'stations'
>;

/**
 * The entries most worth checking in game, per zone: gear numbers, recipes, foods, a few creature
 * drops, the boss altar, and the hand-written "where to get" lines that nothing checks. Built from
 * the data, so it always says what the site says now.
 */
export function buildSpotChecks(data: Needed): ZoneChecks[] {
  const item = new Map(data.items.map((i) => [i.id, i]));
  const nameOf = (id: string) => item.get(id)?.name ?? data.creatures.find((c) => c.id === id)?.name ?? id;
  const station = new Map(data.stations.map((s) => [s.id, s.name]));

  return [...data.biomes]
    .sort((a, b) => a.order - b.order)
    .map((z) => {
      const inZone = (id: string) => item.get(id)?.biome === z.id;
      const groups: CheckGroup[] = [];

      const weapons = data.weapons
        .filter((w) => inZone(w.item) && w.skill !== 'None' && !/^(Arrow|Bolt)/.test(w.item))
        .sort((a, b) => Object.values(b.damage).reduce((x, y) => x + y, 0) - Object.values(a.damage).reduce((x, y) => x + y, 0));
      const armor = data.armor.filter((a) => inZone(a.item)).sort((a, b) => b.armor - a.armor);
      const gear: CheckRow[] = [
        ...take(weapons, 6).map((w) => ({
          key: `gear:${w.item}`,
          id: w.item,
          label: nameOf(w.item),
          expect: `${Object.entries(w.damage)
            .filter(([k]) => !HIDDEN_IN_TOOLTIP.has(k))
            .map(([k, v]) => `${k} ${num(v)}`)
            .join(', ')}${w.durability ? ` · durability ${num(w.durability)}` : ''}${w.blockPower ? ` · block ${num(w.blockPower)}` : ''}`,
        })),
        ...take(armor, 4).map((a) => ({
          key: `gear:${a.item}`,
          id: a.item,
          label: nameOf(a.item),
          expect: `armor ${num(a.armor)} · ${a.slot}${a.durability ? ` · durability ${num(a.durability)}` : ''}`,
        })),
      ];
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
        .sort((a, b) => (a.station?.id ?? '').localeCompare(b.station?.id ?? '') || nameOf(a.output.item).localeCompare(nameOf(b.output.item)));
      // Spread over stations: take every other so one station does not fill the list.
      const picked = made.filter((_, i) => i % 2 === 0);
      const recipes = take(picked, 8).map((r) => ({
        key: `recipe:${r.id}`,
        id: r.output.item,
        label: nameOf(r.output.item),
        expect: `${r.station ? `${station.get(r.station.id) ?? r.station.id} level ${r.station.minLevel}: ` : ''}${r.inputs
          .map((i) => `${i.qty} ${nameOf(i.item)}`)
          .join(', ')}`,
      }));
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
        .sort((a, b) => (b.health ?? 0) - (a.health ?? 0));
      const foodRows = take(foods, 5).map((f) => ({
        key: `food:${f.item}`,
        id: f.item,
        label: nameOf(f.item),
        expect: `health ${num(f.health ?? 0)} · stamina ${num(f.stamina ?? 0)} · lasts ${Math.round((f.durationSec ?? 0) / 60)} min`,
      }));
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
        .sort((a, b) => b.drops.length - a.drops.length);
      const creatureRows = take(creatures, 3).map((c) => ({
        key: `creature:${c.id}`,
        id: c.id,
        label: c.name,
        expect: `drops ${c.drops.map((d) => nameOf(d.item)).join(', ')}`,
      }));
      if (creatureRows.length) {
        groups.push({
          id: 'creatures',
          title: 'Creature drops',
          how: 'Kill a few and look at what they drop. Rare drops may need several tries.',
          rows: creatureRows,
        });
      }

      const bossRows = data.bosses
        .filter((b) => b.biome === z.id)
        .map((b) => ({
          key: `boss:${b.id}`,
          id: b.id,
          label: b.name,
          expect: `summon with ${b.summonItems.map((s) => `${s.qty} ${nameOf(s.item)}`).join(', ') || 'unknown'} · drops ${b.drops.map((d) => nameOf(d.item)).join(', ')}`,
        }));
      if (bossRows.length) {
        groups.push({
          id: 'boss',
          title: 'Boss altar',
          how: 'The altar tells you what it wants. The drops are what the boss leaves.',
          rows: bossRows,
        });
      }

      const guessed = data.items
        .filter((i) => i.biome === z.id && i.verified === 'unverified')
        .flatMap((i) => {
          const note = i.obtainedFrom.find((o) => o.type === 'gather' || o.type === 'other');
          const text = note ? ('node' in note ? note.node : 'note' in note ? note.note : '') : '';
          return text ? [{ key: `where:${i.id}`, id: i.id, label: i.name, expect: text }] : [];
        });
      if (guessed.length) {
        groups.push({
          id: 'where',
          title: 'Written by hand: where to get it',
          how: 'These lines are from guides, not the game files. Do they match what you found?',
          rows: take(guessed, 6),
        });
      }

      return { zone: z.id, name: z.name, groups };
    });
}
