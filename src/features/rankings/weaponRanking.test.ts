import { describe, expect, it } from 'vitest';
import { lookup } from '../../data/lookup';
import { AMMO_GROUP, combatDamage, damageAt, totalCombatDamage } from '../../data/weaponStats';
import {
  addRatings,
  defaultDir,
  filterAndSort,
  groupByZone,
  weaponGroups,
  weaponRows,
  type RankOptions,
} from './weaponRanking';
import { DEFAULT_WEIGHTS, formatWeights, parseWeights } from './weights';

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
    expect(list[0]?.id).not.toBe('Club');
  });

  it('lists ammunition when asked', () => {
    const list = filterAndSort(rows, { ...base, group: AMMO_GROUP });
    expect(list.map((r) => r.id).sort()).toEqual(
      rows.filter((r) => r.group === AMMO_GROUP).map((r) => r.id).sort(),
    );
    expect(list.map((r) => r.id)).toContain('ArrowFire');
  });

  it('filters by weapon type', () => {
    const list = filterAndSort(rows, { ...base, group: 'Swords' });
    expect(list.map((r) => r.id)).toEqual(expect.arrayContaining(['SwordIron', 'SwordBronze']));
    expect(list.every((r) => r.id.startsWith('Sword'))).toBe(true);
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
      'AtgeirIron',
      'AtgeirBronze',
    ]);
  });
});

describe('groupByZone', () => {
  it('splits by zone in progression order and keeps the ranking inside each zone', () => {
    const groups = groupByZone(filterAndSort(weaponRows(), base));
    expect(groups.map((g) => g.zoneId).slice(0, 3)).toEqual(['meadows', 'blackforest', 'swamp']);
    for (const g of groups) {
      for (let i = 1; i < g.rows.length; i++) {
        expect(g.rows[i - 1]!.total).toBeGreaterThanOrEqual(g.rows[i]!.total);
      }
    }
  });
});

describe('combo, stamina and dps columns', () => {
  const row = (id: string, creature = '') => weaponRows(1, creature).find((r) => r.id === id)!;

  it('derives per-combo damage and stamina efficiency from the attack data', () => {
    // Bronze sword: 35 damage, three swings counting 1 + 1 + 2 = 4 hits, 8 stamina a swing.
    const sword = row('SwordBronze');
    expect(sword.combo).toBe(140);
    expect(sword.perStamina).toBeCloseTo(140 / 24);
    expect(sword.reach).toBeCloseTo(2.4);
    expect(sword.dps).toBeGreaterThan(20);
  });

  it('gives bows no timing-based numbers', () => {
    expect(row('Bow').dps).toBeUndefined();
  });

  it('scales damage by the creature resistances', () => {
    // Troll: resistant to blunt, weak to pierce.
    expect(row('Club', 'Troll').total).toBe(6);
    expect(row('SpearBronze', 'Troll').total).toBeCloseTo(52.5);
    // Skeleton: weak to blunt, resistant to pierce.
    expect(row('MaceBronze', 'Skeleton').total).toBeCloseTo(52.5);
    expect(row('SpearBronze', 'Skeleton').total).toBeCloseTo(17.5);
    // No creature: unchanged.
    expect(row('Club').total).toBe(12);
  });

  it('re-ranks weapons when a creature is chosen', () => {
    const normal = filterAndSort(weaponRows(1), base).map((r) => r.id);
    const troll = filterAndSort(weaponRows(1, 'Troll'), base).map((r) => r.id);
    expect(troll).not.toEqual(normal);
    expect(troll.indexOf('SpearBronze')).toBeLessThan(normal.indexOf('SpearBronze'));
  });

  it('sorts by dps with weapons that have no estimate last', () => {
    const list = filterAndSort(weaponRows(), { ...base, sort: 'dps', dir: 'desc' });
    const withDps = list.filter((r) => r.dps !== undefined);
    expect(withDps.length).toBeGreaterThan(5);
    for (let i = 1; i < withDps.length; i++) {
      expect(withDps[i - 1]!.dps!).toBeGreaterThanOrEqual(withDps[i]!.dps!);
    }
    expect(list.slice(0, withDps.length).every((r) => r.dps !== undefined)).toBe(true);
  });
});

describe('ratings', () => {
  const mk = (id: string, dps?: number, perStamina?: number, reach?: number) => ({
    id,
    name: id,
    group: 'Swords',
    zoneId: 'meadows',
    zoneName: 'Meadows',
    zoneOrder: 1,
    total: 10,
    damage: {},
    dps,
    perStamina,
    reach,
  });
  const only = (key: 'dps' | 'stamina' | 'reach') => ({
    dps: 0,
    stamina: 0,
    reach: 0,
    [key]: 1,
  });

  it('scores the best on every measure 100 and the worst 0', () => {
    const rows = addRatings([mk('a', 10, 10, 10), mk('b', 20, 20, 20), mk('c', 30, 30, 30)]);
    expect(rows.map((r) => r.rating)).toEqual([0, 50, 100]);
  });

  it('weights the measures', () => {
    const rows = [mk('fast', 30, 10, 10), mk('efficient', 10, 30, 10), mk('long', 10, 10, 30)];
    const rate = (w: { dps: number; stamina: number; reach: number }) =>
      Object.fromEntries(addRatings(rows, w).map((r) => [r.id, Math.round(r.rating!)]));
    expect(rate(only('dps')).fast).toBe(100);
    expect(rate(only('stamina')).efficient).toBe(100);
    expect(rate(only('reach')).long).toBe(100);
    const even = rate({ dps: 1, stamina: 1, reach: 1 });
    expect(even.fast).toBe(even.long);
  });

  it('shares the average between ties', () => {
    const rows = addRatings([mk('a', 5, 1, 1), mk('b', 5, 1, 1), mk('c', 9, 1, 1)], only('dps'));
    expect(rows.map((r) => r.rating)).toEqual([25, 25, 100]);
  });

  it('gives no rating to a weapon missing a weighted measure', () => {
    const rows = addRatings([mk('a', 10, 10, 10), mk('b', undefined, 5, 5)]);
    expect(rows[1]!.rating).toBeUndefined();
  });

  it('rates only what is listed, so the score changes with the filters', () => {
    const all = filterAndSort(weaponRows(), base);
    const meadows = filterAndSort(weaponRows(), { ...base, zone: 'meadows', upTo: false });
    const id = meadows.find((r) => r.rating !== undefined)!.id;
    expect(meadows.find((r) => r.id === id)!.rating).not.toBe(all.find((r) => r.id === id)!.rating);
  });

  it('parses and formats weights from the URL, falling back on bad input', () => {
    expect(parseWeights('1,2,3')).toEqual({ dps: 1, stamina: 2, reach: 3 });
    expect(parseWeights('x,2,3')).toEqual(DEFAULT_WEIGHTS);
    expect(parseWeights('1,2')).toEqual(DEFAULT_WEIGHTS);
    expect(parseWeights('0,0,0')).toEqual(DEFAULT_WEIGHTS);
    expect(parseWeights('-1,2,3')).toEqual(DEFAULT_WEIGHTS);
    expect(parseWeights(null)).toEqual(DEFAULT_WEIGHTS);
    expect(formatWeights({ dps: 1, stamina: 2, reach: 3 })).toBe('1,2,3');
  });
});
