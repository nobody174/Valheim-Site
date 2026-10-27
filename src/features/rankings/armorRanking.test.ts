import { describe, expect, it } from 'vitest';
import {
  ARMOR_PRESETS,
  armorRows,
  maxArmorQuality,
  rankArmor,
  type ArmorOptions,
} from './armorRanking';

const base: ArmorOptions = {
  slot: '',
  zone: '',
  upTo: true,
  text: '',
  sort: 'armor',
  dir: 'desc',
  preset: '',
};
const ids = (o: Partial<ArmorOptions> = {}, q = 1) =>
  rankArmor(armorRows(q), { ...base, ...o }).map((r) => r.id);
const row = (id: string, q = 1) => armorRows(q).find((r) => r.id === id)!;

describe('armor rows', () => {
  it('adds armor per level and clamps to the maximum', () => {
    expect(row('ArmorBronzeChest').armor).toBe(8);
    expect(row('ArmorBronzeChest', 4).armor).toBe(8 + 2 * 3);
    expect(row('ArmorBronzeChest', 99).armor).toBe(row('ArmorBronzeChest', 4).armor);
    // Rags stop at level 2.
    expect(row('ArmorRagsChest', 4).armor).toBe(row('ArmorRagsChest', 2).armor);
  });

  it('counts craft and upgrade items from the recipe', () => {
    // Bronze chest: 5 Bronze + 2 Deer Hide; upgrades cost 8, 11 and 14 Bronze.
    expect(row('ArmorBronzeChest').craftItems).toBe(7);
    expect(row('ArmorBronzeChest', 1).upgradeItems).toBe(0);
    expect(row('ArmorBronzeChest', 2).upgradeItems).toBe(8);
    expect(row('ArmorBronzeChest', 4).upgradeItems).toBe(8 + 11 + 14);
  });

  it('knows the maximum upgrade level', () => {
    expect(maxArmorQuality()).toBeGreaterThanOrEqual(4);
  });
});

describe('rankArmor', () => {
  it('sorts by armor, highest first, and can flip', () => {
    const list = rankArmor(armorRows(), base);
    for (let i = 1; i < list.length; i++) expect(list[i - 1]!.armor).toBeGreaterThanOrEqual(list[i]!.armor);
    const asc = rankArmor(armorRows(), { ...base, dir: 'asc' });
    for (let i = 1; i < asc.length; i++) expect(asc[i - 1]!.armor).toBeLessThanOrEqual(asc[i]!.armor);
    expect(asc[0]!.armor).toBeLessThan(list[0]!.armor);
  });

  it('filters by slot, zone and name', () => {
    expect(rankArmor(armorRows(), { ...base, slot: 'helmet' }).every((r) => r.slot === 'helmet')).toBe(true);
    const meadows = rankArmor(armorRows(), { ...base, zone: 'meadows', upTo: false });
    expect(meadows.length).toBeGreaterThan(0);
    expect(meadows.every((r) => r.zoneId === 'meadows')).toBe(true);
    expect(ids({ zone: 'blackforest' }).length).toBeGreaterThan(meadows.length);
    expect(ids({ text: 'troll' }).every((id) => /Troll/.test(id))).toBe(true);
  });

  it('puts pieces with no value for the sorted column last', () => {
    const list = rankArmor(armorRows(), { ...base, sort: 'weight', dir: 'asc' });
    const withWeight = list.filter((r) => r.weight !== undefined);
    for (let i = 1; i < withWeight.length; i++) {
      expect(withWeight[i - 1]!.weight!).toBeLessThanOrEqual(withWeight[i]!.weight!);
    }
  });

  describe('presets', () => {
    it('Tank is the highest armor first', () => {
      const list = rankArmor(armorRows(), { ...base, preset: 'tank', sort: 'name' });
      for (let i = 1; i < list.length; i++) expect(list[i - 1]!.armor).toBeGreaterThanOrEqual(list[i]!.armor);
    });

    it('Exploration drops everything that slows you down', () => {
      const list = rankArmor(armorRows(), { ...base, preset: 'exploration' });
      expect(list.length).toBeGreaterThan(0);
      expect(list.every((r) => (r.movement ?? 0) >= 0)).toBe(true);
      expect(list.map((r) => r.id)).not.toContain('ArmorBronzeChest'); // -5% speed
      expect(list.map((r) => r.id)).toContain('HelmetBronze'); // no penalty
    });

    it('Light is the lightest first', () => {
      const list = rankArmor(armorRows(), { ...base, preset: 'light' });
      const weights = list.map((r) => r.weight ?? Infinity);
      expect(weights).toEqual([...weights].sort((a, b) => a - b));
    });

    it('Set bonus lists pieces of a set with a bonus first', () => {
      const list = rankArmor(armorRows(), { ...base, preset: 'sets' });
      const firstPlain = list.findIndex((r) => !r.setEffect);
      expect(firstPlain).toBeGreaterThan(0);
      expect(list.slice(firstPlain).some((r) => r.setEffect)).toBe(false);
    });

    it('documents a rule for every preset', () => {
      for (const p of ARMOR_PRESETS) expect(p.rule.length).toBeGreaterThan(10);
    });
  });
});
