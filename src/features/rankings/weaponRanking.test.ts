import { describe, expect, it } from 'vitest';
import { lookup } from '../../data/lookup';
import { AMMO_GROUP, combatDamage, damageAt, totalCombatDamage } from '../../data/weaponStats';
import {
  defaultDir,
  filterAndSort,
  groupByZone,
  weaponGroups,
  weaponRows,
  type RankOptions,
} from './weaponRanking';

const base: RankOptions = { group: '', zone: '', upTo: true, text: '', sort: 'damage', dir: 'desc' };
const weapon = (id: string) => {
  const w = lookup.weapon(id);
  if (!w) throw new Error(`no weapon ${id}`);
  return w;
};

describe('weapon damage maths', () => {
  it('ignores tool-only damage types', () => {
    // AxeBronze lists slash 40 and chop 40; only the slash hurts creatures.
    expect(combatDamage(weapon('AxeBronze'))).toEqual({ slash: 40 });
    expect(totalCombatDamage(weapon('AxeBronze'))).toBe(40);
    expect(combatDamage(weapon('PickaxeBronze'))).toEqual({ pierce: 25 });
  });

  it('adds damage per upgrade level and clamps to the maximum', () => {
    const sword = weapon('SwordBronze');
    expect(damageAt(sword, 1).slash).toBe(35);
    expect(damageAt(sword, 4).slash).toBe(35 + 6 * 3);
    expect(damageAt(sword, 99).slash).toBe(damageAt(sword, 4).slash);
  });

  it('does not upgrade items that have no max quality', () => {
    // Arrows list a per-level value but cannot be upgraded.
    expect(damageAt(weapon('ArrowWood'), 4).pierce).toBe(22);
  });
});

describe('weapon rows', () => {
  const rows = weaponRows();

  it('leaves out shields, which deal no damage', () => {
    expect(rows.find((r) => r.id === 'ShieldWood')).toBeUndefined();
    expect(rows.find((r) => r.id === 'SwordBronze')).toBeDefined();
  });

  it('keeps ammunition apart from the weapon types', () => {
    expect(weaponRows().find((r) => r.id === 'ArrowWood')?.group).toBe(AMMO_GROUP);
    expect(weaponGroups()).toContain(AMMO_GROUP);
  });

  it('uses the upgrade level for the totals', () => {
    const at = (q: number) => weaponRows(q).find((r) => r.id === 'SwordBronze')?.total;
    expect(at(1)).toBe(35);
    expect(at(4)).toBe(53);
  });
});

describe('filterAndSort', () => {
  const rows = weaponRows();

  it('ranks strongest first by default and hides ammunition', () => {
    const list = filterAndSort(rows, base);
    expect(list.length).toBeGreaterThan(5);
    for (let i = 1; i < list.length; i++) {
      expect(list[i - 1]!.total).toBeGreaterThanOrEqual(list[i]!.total);
    }
    expect(list.some((r) => r.group === AMMO_GROUP)).toBe(false);
    expect(list[0]?.id).toBe('AtgeirBronze');
  });

  it('lists ammunition when asked', () => {
    const list = filterAndSort(rows, { ...base, group: AMMO_GROUP });
    expect(list.map((r) => r.id).sort()).toEqual(['ArrowBronze', 'ArrowFlint', 'ArrowWood']);
  });

  it('filters by weapon type', () => {
    const list = filterAndSort(rows, { ...base, group: 'Swords' });
    expect(list.map((r) => r.id)).toEqual(['SwordBronze']);
  });

  it('shows only the chosen zone when "earlier zones" is off', () => {
    const list = filterAndSort(rows, { ...base, zone: 'meadows', upTo: false });
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((r) => r.zoneId === 'meadows')).toBe(true);
  });

  it('includes earlier zones by default, so a later zone sees everything available by then', () => {
    const exact = filterAndSort(rows, { ...base, zone: 'blackforest', upTo: false });
    const upTo = filterAndSort(rows, { ...base, zone: 'blackforest', upTo: true });
    expect(exact.every((r) => r.zoneId === 'blackforest')).toBe(true);
    expect(upTo.some((r) => r.zoneId === 'meadows')).toBe(true);
    expect(upTo.length).toBeGreaterThan(exact.length);
    // The best weapon by Black Forest is at least as good as the best one in Meadows alone.
    const meadowsBest = filterAndSort(rows, { ...base, zone: 'meadows' })[0]!;
    expect(upTo[0]!.total).toBeGreaterThanOrEqual(meadowsBest.total);
  });

  it('sorts by name ascending and by zone', () => {
    const byName = filterAndSort(rows, { ...base, sort: 'name', dir: defaultDir('name') });
    const names = byName.map((r) => r.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    const byZone = filterAndSort(rows, { ...base, sort: 'zone', dir: 'asc' });
    expect(byZone[0]?.zoneId).toBe('meadows');
  });

  it('puts weapons with no value for the sorted column last', () => {
    const list = filterAndSort(rows, { ...base, sort: 'knockback', dir: 'desc' });
    const firstMissing = list.findIndex((r) => r.knockback === undefined);
    if (firstMissing >= 0) {
      expect(list.slice(firstMissing).every((r) => r.knockback === undefined)).toBe(true);
    }
  });

  it('filters by name', () => {
    expect(filterAndSort(rows, { ...base, text: 'bronze axe' }).map((r) => r.id)).toEqual(['AxeBronze']);
    expect(filterAndSort(rows, { ...base, text: 'zzzz' })).toEqual([]);
    expect(filterAndSort(rows, { ...base, text: 'atgeir' }).map((r) => r.id)).toEqual([
      'AtgeirBronze',
    ]);
  });
});

describe('groupByZone', () => {
  it('splits by zone in progression order and keeps the ranking inside each zone', () => {
    const groups = groupByZone(filterAndSort(weaponRows(), base));
    expect(groups.map((g) => g.zoneId)).toEqual(['meadows', 'blackforest']);
    for (const g of groups) {
      for (let i = 1; i < g.rows.length; i++) {
        expect(g.rows[i - 1]!.total).toBeGreaterThanOrEqual(g.rows[i]!.total);
      }
    }
  });
});
