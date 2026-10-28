import { describe, expect, it } from 'vitest';
import type { Recipe } from '../../data/schemas';
import { graph, lookup } from '../../data/lookup';
import { advise, type AdvisorData, type AdvisorProgress } from './advisor';

const recipe = (output: string, inputs: string[], station = 'forge'): Recipe =>
  ({
    id: `recipe.${output}`,
    kind: 'craft',
    output: { item: output, qty: 1 },
    station: { id: station, minLevel: 1 },
    inputs: inputs.map((item) => ({ item, qty: 1 })),
    upgrades: [],
  }) as unknown as Recipe;

const recipes = [
  recipe('Sword', ['Wood', 'Tin']),
  recipe('Axe', ['Wood', 'Flint']),
  recipe('Plate', ['Silver']),
];
const data: AdvisorData = {
  items: [
    { id: 'Wood', biome: 'meadows' },
    { id: 'Flint', biome: 'meadows' },
    { id: 'Tin', biome: 'meadows' },
    { id: 'Sword', biome: 'meadows' },
    { id: 'Axe', biome: 'meadows' },
    { id: 'Silver', biome: 'mountain' },
    { id: 'Plate', biome: 'mountain' },
    { id: 'TrophyA', biome: 'meadows' },
  ],
  recipesFor: (id) => recipes.filter((r) => r.output.item === id),
  bosses: [
    {
      id: 'A',
      biome: 'meadows',
      trophy: 'TrophyA',
      summonItems: [
        { item: 'Wood', qty: 1 },
        { item: 'Flint', qty: 1 },
      ],
    },
  ],
  zoneOrder: new Map([
    ['meadows', 1],
    ['mountain', 4],
  ]),
};

const progress = (
  have: string[] = [],
  crafted: string[] = [],
  inventory: Record<string, number> = {},
): AdvisorProgress => ({
  collected: (id) => have.includes(id),
  crafted: (id) => crafted.includes(id),
  inventory,
});

describe('advise', () => {
  it('suggests crafting only when every ingredient is held', () => {
    const a = advise(data, progress(['Wood', 'Flint']));
    expect(a.craft.map((c) => c.item)).toEqual(['Axe']);
    expect(a.craft[0]!.have.sort()).toEqual(['Flint', 'Wood']);
    expect(a.craft[0]!.station).toEqual({ id: 'forge', level: 1 });
  });

  it('counts the inventory as holding an ingredient', () => {
    const a = advise(data, progress([], [], { Wood: 3, Flint: 1 }));
    expect(a.craft.map((c) => c.item)).toEqual(['Axe']);
  });

  it('suggests collecting the one missing ingredient, with what it unlocks', () => {
    const a = advise(data, progress(['Wood', 'Flint']));
    expect(a.collect).toEqual([{ item: 'Tin', unlocks: ['Sword'] }]);
  });

  it('does not suggest what is already crafted, or crafting with an empty profile', () => {
    expect(advise(data, progress(['Wood', 'Flint'], ['Axe'])).craft).toEqual([]);
    expect(advise(data, progress()).craft).toEqual([]);
  });

  it('keeps later zones closed until the boss is down', () => {
    const closed = advise(data, progress(['Silver']));
    expect(closed.craft.map((c) => c.item)).not.toContain('Plate');
    expect(closed.openZone).toBe(1);
    const open = advise(data, progress(['Silver', 'TrophyA']));
    expect(open.craft.map((c) => c.item)).toContain('Plate');
    expect(open.boss).toBeUndefined();
  });

  it('reports the next boss with the summon items held and missing', () => {
    const a = advise(data, progress(['Wood']));
    expect(a.boss).toEqual({ boss: 'A', have: ['Wood'], missing: ['Flint'] });
  });
});

describe('advise on the real data', () => {
  const real: AdvisorData = {
    items: lookup.allItems(),
    recipesFor: (id) => graph.recipesFor(id),
    bosses: lookup.allBosses(),
    zoneOrder: new Map(lookup.allBiomes().map((b) => [b.id, b.order])),
  };

  it('never suggests something whose prerequisites are unmet, for many different profiles', () => {
    const ids = lookup.allItems().map((i) => i.id);
    // A simple deterministic generator, so the profiles are the same every run.
    let seed = 12345;
    const rand = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
    for (let run = 0; run < 40; run++) {
      const share = rand();
      const have = new Set(ids.filter(() => rand() < share));
      const crafted = new Set(ids.filter(() => rand() < share / 4));
      const a = advise(real, progress([...have], [...crafted]));
      const owned = (id: string) => have.has(id) || crafted.has(id);
      for (const c of a.craft) {
        const r = graph.recipesFor(c.item)[0]!;
        expect(
          r.inputs.every((i) => owned(i.item)),
          `${c.item} has a missing input`,
        ).toBe(true);
        expect(crafted.has(c.item)).toBe(false);
      }
      for (const c of a.collect) {
        expect(graph.recipesFor(c.item).length, `${c.item} can be crafted`).toBe(0);
        expect(owned(c.item)).toBe(false);
        expect(c.unlocks.length).toBeGreaterThan(0);
      }
    }
  });
});
