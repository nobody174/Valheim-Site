import { describe, expect, it } from 'vitest';
import type { Recipe } from '../../data/schemas';
import { lookup } from '../../data/lookup';
import { maxUpgradeQuality, upgradeCost } from './upgradeCost';

const recipe = {
  id: 'recipe.X',
  kind: 'craft',
  output: { item: 'X', qty: 1 },
  station: { id: 'forge', minLevel: 2 },
  inputs: [],
  upgrades: [
    { quality: 2, inputs: [{ item: 'Iron', qty: 4 }] },
    { quality: 3, inputs: [{ item: 'Iron', qty: 8 }, { item: 'Wood', qty: 2 }] },
    { quality: 4, inputs: [{ item: 'Iron', qty: 12 }] },
  ],
} as unknown as Recipe;

const qty = (c: ReturnType<typeof upgradeCost>, item: string) =>
  c.total.find((i) => i.item === item)?.qty;

describe('upgradeCost', () => {
  it('adds every step above the current quality up to the target', () => {
    const c = upgradeCost(recipe, 1, 4);
    expect(c.steps.map((s) => s.quality)).toEqual([2, 3, 4]);
    expect(qty(c, 'Iron')).toBe(24);
    expect(qty(c, 'Wood')).toBe(2);
  });

  it('starts after the quality you already have', () => {
    const c = upgradeCost(recipe, 2, 3);
    expect(c.steps.map((s) => s.quality)).toEqual([3]);
    expect(qty(c, 'Iron')).toBe(8);
  });

  it('needs the recipe level plus one per quality step', () => {
    expect(upgradeCost(recipe, 1, 2).stationLevel).toBe(3); // 2 + (2 - 1)
    expect(upgradeCost(recipe, 1, 4).stationLevel).toBe(5);
  });

  it('is empty when there is nothing to do', () => {
    expect(upgradeCost(recipe, 3, 3)).toEqual({ steps: [], total: [], stationLevel: 0 });
    expect(upgradeCost(recipe, 4, 2).steps).toEqual([]);
  });

  it('knows the highest quality, and matches real data for the Club', () => {
    expect(maxUpgradeQuality(recipe)).toBe(4);
    const club = lookup.allRecipes().find((r) => r.output.item === 'Club')!;
    const total = upgradeCost(club, 1, maxUpgradeQuality(club));
    expect(total.steps.length).toBe(club.upgrades.length);
    expect(total.stationLevel).toBeGreaterThanOrEqual(1);
  });
});
