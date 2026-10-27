import { graph, lookup } from '../../data/lookup';
import type { Armor } from '../../data/schemas';

export const ARMOR_SORT_KEYS = ['armor', 'weight', 'movement', 'craft', 'upgrade', 'name', 'zone'] as const;
export type ArmorSortKey = (typeof ARMOR_SORT_KEYS)[number];

export interface ArmorRow {
  id: string;
  name: string;
  slot: Armor['slot'];
  zoneId: string | null;
  zoneName: string;
  zoneOrder: number;
  /** Armor value at the chosen upgrade level: armor + armorPerLevel * (level - 1). */
  armor: number;
  weight?: number;
  /** Movement speed change, for example -0.05 for 5% slower. Undefined means no change. */
  movement?: number;
  durability?: number;
  setName?: string;
  setSize?: number;
  setEffect?: string;
  /** Total items in the crafting recipe. */
  craftItems?: number;
  /** Total items to upgrade from level 1 to the chosen level. */
  upgradeItems?: number;
}

/**
 * Ready-made views. Each one is only a sort order and a filter over the same numbers, and the
 * rule is shown on the page. Mage is left out because the data has no Eitr or magic armor yet.
 */
export const ARMOR_PRESETS = [
  { key: 'tank', label: 'Tank', rule: 'Highest armor first, whatever it weighs or does to your speed.' },
  {
    key: 'exploration',
    label: 'Exploration',
    rule: 'Only pieces that do not slow you down, highest armor first.',
  },
  { key: 'light', label: 'Light', rule: 'Lightest first; equal weight goes to the higher armor.' },
  {
    key: 'sets',
    label: 'Set bonus',
    rule: 'Pieces from a set with a bonus first, then highest armor.',
  },
] as const;
export type ArmorPreset = (typeof ARMOR_PRESETS)[number]['key'];

export interface ArmorOptions {
  slot: string;
  zone: string;
  upTo: boolean;
  text: string;
  sort: ArmorSortKey;
  dir: 'asc' | 'desc';
  /** A preset replaces the sort order (and may filter); empty means use sort and dir as given. */
  preset: ArmorPreset | '';
}

export const defaultArmorDir = (sort: ArmorSortKey): 'asc' | 'desc' =>
  sort === 'armor' || sort === 'movement' ? 'desc' : 'asc';

export const maxArmorQuality = (): number =>
  Math.max(1, ...lookup.allArmor().map((a) => a.maxQuality ?? 1));

const sum = (list: { qty: number }[]) => list.reduce((n, g) => n + g.qty, 0);

export function armorRows(quality = 1): ArmorRow[] {
  const order = new Map(lookup.allBiomes().map((b) => [b.id, b.order]));
  return lookup.allArmor().map((a) => {
    const item = lookup.item(a.item);
    const zoneId = item?.biome ?? null;
    const level = Math.min(Math.max(1, Math.floor(quality)), a.maxQuality ?? 1);
    const recipe = graph.recipesFor(a.item)[0];
    return {
      id: a.item,
      name: item?.name ?? a.item,
      slot: a.slot,
      zoneId,
      zoneName: lookup.biomeName(zoneId) ?? 'Unknown zone',
      zoneOrder: zoneId ? (order.get(zoneId) ?? Infinity) : Infinity,
      armor: a.armor + (a.armorPerLevel ?? 0) * (level - 1),
      weight: item?.weight ?? undefined,
      movement: a.movementModifier,
      durability: a.durability,
      setName: a.setName,
      setSize: a.setSize,
      setEffect: a.setEffect,
      craftItems: recipe ? sum(recipe.inputs) : undefined,
      upgradeItems: recipe
        ? sum(recipe.upgrades.filter((u) => u.quality <= level).flatMap((u) => u.inputs))
        : undefined,
    };
  });
}

const value = (r: ArmorRow, key: ArmorSortKey): number | string | undefined => {
  switch (key) {
    case 'armor':
      return r.armor;
    case 'weight':
      return r.weight;
    case 'movement':
      return r.movement ?? 0;
    case 'craft':
      return r.craftItems;
    case 'upgrade':
      return r.upgradeItems;
    case 'name':
      return r.name;
    case 'zone':
      return r.zoneOrder;
  }
};

export function rankArmor(rows: ArmorRow[], opts: ArmorOptions): ArmorRow[] {
  const zoneOrder = lookup.allBiomes().find((b) => b.id === opts.zone)?.order;
  const text = opts.text.trim().toLowerCase();
  let list = rows
    .filter((r) => !opts.slot || r.slot === opts.slot)
    .filter((r) => {
      if (zoneOrder === undefined) return true;
      return opts.upTo ? r.zoneOrder <= zoneOrder : r.zoneOrder === zoneOrder;
    })
    .filter((r) => !text || r.name.toLowerCase().includes(text));

  const byArmor = (a: ArmorRow, b: ArmorRow) => b.armor - a.armor || a.name.localeCompare(b.name);

  switch (opts.preset) {
    case 'tank':
      return list.sort(byArmor);
    case 'exploration':
      list = list.filter((r) => (r.movement ?? 0) >= 0);
      return list.sort(byArmor);
    case 'light':
      return list.sort(
        (a, b) =>
          (a.weight ?? Infinity) - (b.weight ?? Infinity) || byArmor(a, b),
      );
    case 'sets':
      return list.sort(
        (a, b) => Number(Boolean(b.setEffect)) - Number(Boolean(a.setEffect)) || byArmor(a, b),
      );
  }

  const sign = opts.dir === 'asc' ? 1 : -1;
  return list.sort((a, b) => {
    const x = value(a, opts.sort);
    const y = value(b, opts.sort);
    if (x === undefined && y !== undefined) return 1;
    if (y === undefined && x !== undefined) return -1;
    if (x !== undefined && y !== undefined && x !== y) {
      const cmp = typeof x === 'string' ? x.localeCompare(String(y)) : Number(x) - Number(y);
      if (cmp !== 0) return sign * cmp;
    }
    return byArmor(a, b);
  });
}
