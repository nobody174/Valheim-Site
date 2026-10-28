import { armorRows, type ArmorRow } from '../rankings/armorRanking';
import { weaponRows, type WeaponRow } from '../rankings/weaponRanking';

export type CompareKind = 'weapon' | 'armor';

export interface CompareRow {
  label: string;
  /** One entry per compared item; undefined when the data has no value. */
  values: (string | undefined)[];
  /** Index of the best value, when the row is numeric and a best exists. */
  best?: number;
}

export interface Comparison {
  kind: CompareKind;
  ids: string[];
  rows: CompareRow[];
}

const round = (n: number, digits = 1) => String(Math.round(n * 10 ** digits) / 10 ** digits);
const label = (k: string) => k.charAt(0).toUpperCase() + k.slice(1);

/** A numeric row; `higher` says which end is best. Ties and missing values mark no best. */
function numeric(
  name: string,
  nums: (number | undefined)[],
  format: (n: number) => string,
  higher = true,
): CompareRow {
  const present = nums.filter((n): n is number => n !== undefined);
  const target = present.length > 1 ? (higher ? Math.max(...present) : Math.min(...present)) : undefined;
  const winners = target === undefined ? [] : nums.filter((n) => n === target);
  return {
    label: name,
    values: nums.map((n) => (n === undefined ? undefined : format(n))),
    best: winners.length === 1 ? nums.indexOf(target) : undefined,
  };
}

const text = (name: string, values: (string | undefined)[]): CompareRow => ({ label: name, values });

/** Which kind an item is, or undefined when it is neither a rankable weapon nor armor. */
export function compareKindOf(id: string, level = 1): CompareKind | undefined {
  if (weaponRows(level).some((w) => w.id === id)) return 'weapon';
  if (armorRows(level).some((a) => a.id === id)) return 'armor';
  return undefined;
}

/**
 * Side-by-side numbers for two to four weapons or armor pieces at one upgrade level. Only items of
 * the first item's kind are kept, in the order given. Every number comes from the same code as the
 * rankings, so the two pages agree.
 */
export function compare(ids: readonly string[], level = 1): Comparison | undefined {
  const kind = ids.length ? compareKindOf(ids[0]!, level) : undefined;
  if (!kind) return undefined;
  if (kind === 'weapon') {
    const all = weaponRows(level);
    const items = ids.map((id) => all.find((r) => r.id === id)).filter((r): r is WeaponRow => !!r);
    return {
      kind,
      ids: items.map((r) => r.id),
      rows: [
        text('Zone', items.map((r) => r.zoneName)),
        text('Type', items.map((r) => r.group)),
        numeric('Per hit', items.map((r) => r.total), (n) => round(n, 0)),
        numeric('Per combo', items.map((r) => r.combo), (n) => round(n, 0)),
        numeric('Per stamina', items.map((r) => r.perStamina), (n) => round(n)),
        numeric('DPS ≈ (estimate)', items.map((r) => r.dps), (n) => round(n, 0)),
        numeric('Reach', items.map((r) => r.reach), (n) => round(n)),
        numeric('Knockback', items.map((r) => r.knockback), (n) => round(n)),
        numeric('Durability', items.map((r) => r.durability), (n) => round(n, 0)),
        text(
          'Damage types',
          items.map((r) =>
            Object.entries(r.damage)
              .map(([k, v]) => `${label(k)} ${round(v, 0)}`)
              .join(', '),
          ),
        ),
      ],
    };
  }
  const all = armorRows(level);
  const items = ids.map((id) => all.find((r) => r.id === id)).filter((r): r is ArmorRow => !!r);
  return {
    kind,
    ids: items.map((r) => r.id),
    rows: [
      text('Zone', items.map((r) => r.zoneName)),
      text('Slot', items.map((r) => label(r.slot))),
      numeric('Armor', items.map((r) => r.armor), (n) => round(n, 0)),
      numeric('Weight', items.map((r) => r.weight), (n) => round(n), false),
      numeric('Movement speed', items.map((r) => r.movement ?? 0), (n) => `${n > 0 ? '+' : ''}${Math.round(n * 100)}%`),
      numeric('Durability', items.map((r) => r.durability), (n) => round(n, 0)),
      text('Set', items.map((r) => r.setName && `${r.setName} (${r.setSize ?? '?'})`)),
      numeric('Craft: items needed', items.map((r) => r.craftItems), (n) => round(n, 0), false),
      numeric('Upgrade: items needed', items.map((r) => r.upgradeItems), (n) => round(n, 0), false),
    ],
  };
}
