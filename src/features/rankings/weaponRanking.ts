import { lookup } from '../../data/lookup';
import {
  AMMO_GROUP,
  combatDamage,
  isRankable,
  maxQuality,
  totalCombatDamage,
  weaponGroup,
} from '../../data/weaponStats';

export const SORT_KEYS = ['damage', 'name', 'zone', 'knockback', 'durability'] as const;
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
  damage: Record<string, number>;
  knockback?: number;
  durability?: number;
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
}

/** Descending is the natural direction for numbers, ascending for names and zones. */
export const defaultDir = (sort: SortKey): SortDir =>
  sort === 'name' || sort === 'zone' ? 'asc' : 'desc';

/** Every weapon that deals combat damage, with its stats at an upgrade level. */
export function weaponRows(quality = 1): WeaponRow[] {
  const order = new Map(lookup.allBiomes().map((b) => [b.id, b.order]));
  return lookup
    .allWeapons()
    .filter(isRankable)
    .map((w) => {
      const item = lookup.item(w.item);
      const zoneId = item?.biome ?? null;
      return {
        id: w.item,
        name: item?.name ?? w.item,
        group: weaponGroup(w),
        zoneId,
        zoneName: lookup.biomeName(zoneId) ?? 'Unknown zone',
        zoneOrder: zoneId ? (order.get(zoneId) ?? Infinity) : Infinity,
        total: totalCombatDamage(w, quality),
        damage: combatDamage(w, quality),
        knockback: w.knockback,
        durability: w.durability,
      };
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

const metric = (row: WeaponRow, key: SortKey): number | string | undefined => {
  switch (key) {
    case 'damage':
      return row.total;
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

  return rows
    .filter((r) => (opts.group === AMMO_GROUP ? r.group === AMMO_GROUP : r.group !== AMMO_GROUP))
    .filter((r) => !opts.group || opts.group === AMMO_GROUP || r.group === opts.group)
    .filter((r) => {
      if (zoneOrder === undefined) return true;
      return opts.upTo ? r.zoneOrder <= zoneOrder : r.zoneOrder === zoneOrder;
    })
    .filter((r) => !text || r.name.toLowerCase().includes(text))
    .sort((a, b) => {
      const x = metric(a, opts.sort);
      const y = metric(b, opts.sort);
      // Missing values (no knockback in the data) always sink to the bottom.
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
