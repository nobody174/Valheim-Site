import { describe, expect, it } from 'vitest';
import type { Biome, Item, Recipe } from '../../data/schemas';
import { unlocksByZone } from './guides';

const zone = (id: string, order: number) => ({ id, name: id, order }) as Biome;
const item = (id: string, biome: string | null) => ({ id, name: id, biome }) as Item;
const recipe = (id: string, inputs: string[]) =>
  ({
    id,
    output: { item: id, qty: 1 },
    inputs: inputs.map((item) => ({ item, qty: 1 })),
  }) as Recipe;

describe('unlocksByZone', () => {
  const zones = [zone('meadows', 1), zone('forest', 2)];
  const items = [item('Wood', 'meadows'), item('Tin', 'forest'), item('Trader', null)];
  const recipes = [
    recipe('Club', ['Wood']),
    recipe('Bronze', ['Wood', 'Tin']),
    recipe('Spear', ['Club', 'Tin']),
    recipe('Gift', ['Trader']),
  ];

  it('lists a recipe in the first zone where all of its inputs can be had', () => {
    const [meadows, forest] = unlocksByZone(zones, items, recipes);
    expect(meadows!.recipes.map((r) => r.id)).toEqual(['Club']);
    expect(forest!.recipes.map((r) => r.id)).toEqual(['Bronze', 'Spear']);
  });

  it('never lists a recipe that needs something with no zone and no recipe', () => {
    const all = unlocksByZone(zones, items, recipes).flatMap((z) => z.recipes.map((r) => r.id));
    expect(all).not.toContain('Gift');
  });
});
