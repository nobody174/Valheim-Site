import { describe, expect, it } from 'vitest';
import { compare, compareKindOf } from './compare';

const row = (c: ReturnType<typeof compare>, name: string) => c!.rows.find((r) => r.label === name)!;

describe('compare', () => {
  it('tells weapons from armor and rejects everything else', () => {
    expect(compareKindOf('SwordBronze')).toBe('weapon');
    expect(compareKindOf('ArmorBronzeChest')).toBe('armor');
    expect(compareKindOf('Wood')).toBeUndefined();
    expect(compare(['Wood', 'Stone'])).toBeUndefined();
    expect(compare([])).toBeUndefined();
  });

  it('puts weapons side by side and marks the best per row', () => {
    const c = compare(['SwordBronze', 'SwordIron'])!;
    expect(c.kind).toBe('weapon');
    expect(c.ids).toEqual(['SwordBronze', 'SwordIron']);
    const hit = row(c, 'Per hit');
    expect(hit.values).toHaveLength(2);
    // Iron Sword hits harder than the Bronze Sword in the game files.
    expect(hit.best).toBe(1);
    expect(row(c, 'Zone').best).toBeUndefined();
  });

  it('uses the same numbers as the upgrade level asked for', () => {
    const base = compare(['SwordBronze', 'SwordIron'], 1)!;
    const up = compare(['SwordBronze', 'SwordIron'], 4)!;
    expect(Number(row(up, 'Per hit').values[0])).toBeGreaterThan(Number(row(base, 'Per hit').values[0]));
  });

  it('keeps only items of the first item kind, in the order given', () => {
    const c = compare(['SwordIron', 'ArmorBronzeChest', 'SwordBronze'])!;
    expect(c.ids).toEqual(['SwordIron', 'SwordBronze']);
  });

  it('compares armor, with lower weight counting as better', () => {
    const c = compare(['ArmorBronzeChest', 'ArmorIronChest'])!;
    expect(c.kind).toBe('armor');
    const armor = row(c, 'Armor');
    expect(armor.best).toBe(1);
    const weights = row(c, 'Weight').values.map(Number);
    expect(row(c, 'Weight').best).toBe(weights[0]! < weights[1]! ? 0 : 1);
  });

  it('marks no best when values tie or are missing', () => {
    const c = compare(['SwordBronze', 'SwordBronze'])!;
    expect(row(c, 'Per hit').best).toBeUndefined();
  });
});
