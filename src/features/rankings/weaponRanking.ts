import { comboMultiplier, comboSeconds, comboStamina } from '../../data/attackModel';
import { lookup } from '../../data/lookup';
import {
  AMMO_GROUP,
  combatDamage,
  damageVs,
  isRankable,
  maxQuality,
  skillRange,
  weaponGroup,
} from '../../data/weaponStats';
import { DEFAULT_WEIGHTS, type RatingWeights } from './weights';

export const SORT_KEYS = [
  'damage',
  'combo',
  'stamina',
  'dps',
  'reach',
  'rating',
  'name',
  'zone',
  'knockback',
  'durability',
] as const;
export type SortKey = (typeof SORT_KEYS)[number];
export type SortDir = 'asc' | 'desc';

export interface WeaponRow {
  id: string;
  name: string;
  /** Skill, or "Ammunition" for arrows and bolts. */
  group: string;
  zoneId: string | null;
  zoneName: string;
  /** Position of the zone in the progression, or Infinity when the item has no zone. */
  zoneOrder: number;
  /** Combat damage of one hit summed over all damage types, at the chosen upgrade level. */
  total: number;
  /** With a skill level: the lowest and highest one hit can do (the game's bracketed range). */
  range?: [number, number];
  damage: Record<string, number>;
  /** Damage of a whole combo: one hit times the combo's multipliers. */
  combo?: number;
  /** Combo damage per point of stamina spent. */
  perStamina?: number;
  /** Estimated damage per second over a continuous combo. Needs attack timing; approximate. */
  dps?: number;
  reach?: number;
  knockback?: number;
  durability?: number;
  /** 0 to 100 blend of dps, stamina and reach. An opinion; see weights.ts. */
  rating?: number;
}

export interface RankOptions {
  group: string;
  /** Biome id, or '' for every zone. */
  zone: string;
  /** With a zone chosen: also include every earlier zone (what you can have by then). */
  upTo: boolean;
  text: string;
  sort: SortKey;
  dir: SortDir;
  weights?: RatingWeights;
}

/** Descending is the natural direction for numbers, ascending for names and zones. */
export const defaultDir = (sort: SortKey): SortDir =>
  sort === 'name' || sort === 'zone' ? 'asc' : 'desc';

/**
 * Every weapon that deals combat damage, with its stats at an upgrade level. With a creature, the
 * damage of each type is scaled by that creature's resistances.
 */
export function weaponRows(quality = 1, creatureId = '', skill?: number): WeaponRow[] {
  const factor = skill === undefined ? undefined : skillRange(skill);
  const order = new Map(lookup.allBiomes().map((b) => [b.id, b.order]));
  const target = creatureId ? (lookup.creature(creatureId) ?? lookup.boss(creatureId)) : undefined;
  return lookup
    .allWeapons()
    .filter(isRankable)
    .map((w) => {
      const item = lookup.item(w.item);
      const zoneId = item?.biome ?? null;
      const full = damageVs(combatDamage(w, quality), target?.resistances);
      const fullTotal = Object.values(full).reduce((a, b) => a + b, 0);
      const mean = factor?.mean ?? 1;
      const damage = Object.fromEntries(Object.entries(full).map(([t, v]) => [t, v * mean]));
      const total = fullTotal * mean;
      const row: WeaponRow = {
        id: w.item,
        name: item?.name ?? w.item,
        group: weaponGroup(w),
        zoneId,
        zoneName: lookup.biomeName(zoneId) ?? 'Unknown zone',
        zoneOrder: zoneId ? (order.get(zoneId) ?? Infinity) : Infinity,
        total,
        range: factor ? [fullTotal * factor.min, fullTotal * factor.max] : undefined,
        damage,
        knockback: w.knockback,
        durability: w.durability,
      };
      const attack = w.attack;
      if (attack) {
        row.reach = attack.rangeM;
        row.combo = total * comboMultiplier(attack);
        const stamina = comboStamina(attack);
        if (stamina > 0) row.perStamina = row.combo / stamina;
        const seconds = comboSeconds(attack);
        if (seconds) row.dps = row.combo / seconds;
      }
      return row;
    });
}

/** Highest upgrade level any listed weapon reaches. */
export function topQuality(): number {
  return Math.max(1, ...lookup.allWeapons().filter(isRankable).map(maxQuality));
}

/** Weapon types present in the data, for the type filter. Ammunition is kept separate. */
export function weaponGroups(): string[] {
  return [...new Set(weaponRows().map((r) => r.group))].sort((a, b) => a.localeCompare(b));
}

/**
 * Score each row 0 to 100 against the other rows. For each measure a row gets its percentile among
 * the rows that have it (the weakest scores 0, the strongest 1, ties share the average); the score
 * is the weighted mean of those percentiles. Rows missing any weighted measure get no rating.
 */
export function addRatings(
  rows: WeaponRow[],
  weights: RatingWeights = DEFAULT_WEIGHTS,
): WeaponRow[] {
  const measures = [
    { w: weights.dps, get: (r: WeaponRow) => r.dps },
    { w: weights.stamina, get: (r: WeaponRow) => r.perStamina },
    { w: weights.reach, get: (r: WeaponRow) => r.reach },
  ].filter((m) => m.w > 0);
  const totalWeight = measures.reduce((s, m) => s + m.w, 0);

  const percentile = (values: number[], v: number): number => {
    if (values.length < 2) return 1;
    const below = values.filter((x) => x < v).length;
    const equal = values.filter((x) => x === v).length;
    return (below + (equal - 1) / 2) / (values.length - 1);
  };

  const pools = measures.map((m) => rows.map(m.get).filter((x): x is number => x !== undefined));
  return rows.map((r) => {
    const parts = measures.map((m, i) => {
      const v = m.get(r);
      return v === undefined ? undefined : m.w * percentile(pools[i] ?? [], v);
    });
    if (totalWeight === 0 || parts.some((p) => p === undefined)) return { ...r, rating: undefined };
    return { ...r, rating: (100 * parts.reduce<number>((s, p) => s + (p ?? 0), 0)) / totalWeight };
  });
}

const metric = (row: WeaponRow, key: SortKey): number | string | undefined => {
  switch (key) {
    case 'damage':
      return row.total;
    case 'combo':
      return row.combo;
    case 'stamina':
      return row.perStamina;
    case 'dps':
      return row.dps;
    case 'reach':
      return row.reach;
    case 'rating':
      return row.rating;
    case 'name':
      return row.name;
    case 'zone':
      return row.zoneOrder;
    case 'knockback':
      return row.knockback;
    case 'durability':
      return row.durability;
  }
};

export function filterAndSort(rows: WeaponRow[], opts: RankOptions): WeaponRow[] {
  const zoneOrder = lookup.allBiomes().find((b) => b.id === opts.zone)?.order;
  const text = opts.text.trim().toLowerCase();
  const sign = opts.dir === 'asc' ? 1 : -1;

  const shown = rows
    .filter((r) => (opts.group === AMMO_GROUP ? r.group === AMMO_GROUP : r.group !== AMMO_GROUP))
    .filter((r) => !opts.group || opts.group === AMMO_GROUP || r.group === opts.group)
    .filter((r) => {
      if (zoneOrder === undefined) return true;
      return opts.upTo ? r.zoneOrder <= zoneOrder : r.zoneOrder === zoneOrder;
    })
    .filter((r) => !text || r.name.toLowerCase().includes(text));

  return addRatings(shown, opts.weights).sort((a, b) => {
    const x = metric(a, opts.sort);
    const y = metric(b, opts.sort);
    // Missing values (no timing, no knockback in the data) always sink to the bottom.
    if (x === undefined && y !== undefined) return 1;
    if (y === undefined && x !== undefined) return -1;
    if (x !== undefined && y !== undefined && x !== y) {
      const cmp = typeof x === 'string' ? x.localeCompare(String(y)) : Number(x) - Number(y);
      if (cmp !== 0) return sign * cmp;
    }
    // Stable tie-break: strongest first, then by name.
    return b.total - a.total || a.name.localeCompare(b.name);
  });
}

export interface ZoneGroup {
  zoneId: string | null;
  zoneName: string;
  rows: WeaponRow[];
}

/** Rows split by zone in progression order, keeping the order they came in within each zone. */
export function groupByZone(rows: WeaponRow[]): ZoneGroup[] {
  const groups = new Map<string, ZoneGroup>();
  for (const r of rows) {
    const key = r.zoneId ?? '';
    const g = groups.get(key) ?? { zoneId: r.zoneId, zoneName: r.zoneName, rows: [] };
    g.rows.push(r);
    groups.set(key, g);
  }
  return [...groups.values()].sort(
    (a, b) => (a.rows[0]?.zoneOrder ?? Infinity) - (b.rows[0]?.zoneOrder ?? Infinity),
  );
}
