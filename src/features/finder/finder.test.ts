import { describe, expect, it } from 'vitest';
import type { Recipe } from '../../data/schemas';
import { whatCanIMake } from './finder';

const recipe = (id: string, inputs: [string, number][]): Recipe =>
  ({
    id,
    kind: 'craft',
    output: { item: id, qty: 1 },
    station: null,
    inputs: inputs.map(([item, qty]) => ({ item, qty })),
    upgrades: [],
    source: 'test',
    verified: 'unverified',
  }) as Recipe;

describe('whatCanIMake', () => {
  const recipes = [
    recipe('Axe', [
      ['Wood', 4],
      ['Flint', 2],
    ]),
    recipe('Club', [['Wood', 3]]),
    recipe('Sword', [
      ['Iron', 20],
      ['Wood', 2],
      ['Leather', 5],
    ]),
    recipe('Bow', [['Fiber', 10]]),
  ];

  it('separates what can be made from what is a little short', () => {
    const { ready, close } = whatCanIMake(recipes, { Wood: 8, Flint: 1 });
    expect(ready.map((c) => c.recipe.id)).toEqual(['Club']);
    expect(ready[0]!.times).toBe(2);
    expect(close.map((c) => c.recipe.id)).toEqual(['Axe', 'Sword']);
    expect(close[0]!.missing).toEqual([{ item: 'Flint', short: 1 }]);
  });

  it('does not suggest recipes that share nothing with what is held', () => {
    const { close } = whatCanIMake(recipes, { Wood: 1 });
    expect(close.map((c) => c.recipe.id)).not.toContain('Bow');
  });
});
