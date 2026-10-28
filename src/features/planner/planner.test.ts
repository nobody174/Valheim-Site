import { describe, expect, it } from 'vitest';
import type { Recipe } from '../../data/schemas';
import { buildPlan, type PlanContext } from './planner';

const prov = { source: 'test', verified: 'cross-checked' as const };

/** A recipe, with only the fields the planner reads. */
function recipe(
  output: string,
  inputs: [string, number][],
  opts: {
    qty?: number;
    station?: [string, number];
    upgrades?: { quality: number; inputs: [string, number][] }[];
  } = {},
): Recipe {
  return {
    id: `recipe.${output}`,
    kind: 'craft',
    output: { item: output, qty: opts.qty ?? 1 },
    station: opts.station ? { id: opts.station[0], minLevel: opts.station[1] } : null,
    inputs: inputs.map(([item, qty]) => ({ item, qty })),
    upgrades: (opts.upgrades ?? []).map((u) => ({
      quality: u.quality,
      inputs: u.inputs.map(([item, qty]) => ({ item, qty })),
    })),
    ...prov,
  } as Recipe;
}

const ctxOf = (recipes: Recipe[]): PlanContext => ({
  recipesFor: (id) => recipes.filter((r) => r.output.item === id),
});

const sword = recipe('Sword', [['Bronze', 8], ['Wood', 2]], {
  station: ['forge', 1],
  upgrades: [
    { quality: 2, inputs: [['Bronze', 4]] },
    { quality: 3, inputs: [['Bronze', 6], ['Wood', 1]] },
  ],
});
// One smelting run makes 2 Bronze from 2 Copper and 1 Tin.
const bronze = recipe('Bronze', [['Copper', 2], ['Tin', 1]], { qty: 2, station: ['smelter', 1] });
const copper = recipe('Copper', [['CopperOre', 1]], { station: ['smelter', 1] });
const ctx = ctxOf([sword, bronze, copper]);
const need = (plan: ReturnType<typeof buildPlan>, item: string) =>
  plan.raw.find((l) => l.item === item);

describe('buildPlan', () => {
  it('expands a recipe into raw materials, rounding crafts up to whole runs', () => {
    // 8 Bronze = 4 runs of (2 Copper + 1 Tin); 4 x 2 Copper = 8 Copper = 8 Copper Ore.
    const plan = buildPlan([{ item: 'Sword', qty: 1 }], ctx);
    expect(need(plan, 'CopperOre')?.missing).toBe(8);
    expect(need(plan, 'Tin')?.missing).toBe(4);
    expect(need(plan, 'Wood')?.missing).toBe(2);
    expect(plan.steps.find((s) => s.output === 'Bronze')?.times).toBe(4);
    expect(plan.crafted.find((c) => c.item === 'Bronze')?.qty).toBe(8);
  });

  it('rounds up when the output does not divide evenly', () => {
    // 3 Bronze needs 2 runs (makes 4), so 4 Copper and 2 Tin.
    const plan = buildPlan([{ item: 'Bronze', qty: 3 }], ctx);
    expect(need(plan, 'Tin')?.missing).toBe(2);
    expect(plan.crafted.find((c) => c.item === 'Bronze')?.qty).toBe(4);
  });

  it('scales with the quantity and merges several targets', () => {
    const plan = buildPlan(
      [
        { item: 'Sword', qty: 2 },
        { item: 'Bronze', qty: 2 },
      ],
      ctx,
    );
    // 2 swords = 16 Bronze, plus 2 more = 18 Bronze = 9 runs = 9 Tin.
    expect(need(plan, 'Tin')?.missing).toBe(9);
    expect(need(plan, 'Wood')?.missing).toBe(4);
  });

  it('adds every upgrade step up to the target quality, for each unit', () => {
    const plan = buildPlan([{ item: 'Sword', qty: 2, quality: 3 }], ctx);
    // Per sword: 8 + 4 + 6 = 18 Bronze, 2 + 1 = 3 Wood. Two swords: 36 Bronze, 6 Wood.
    expect(need(plan, 'Wood')?.missing).toBe(6);
    expect(plan.crafted.find((c) => c.item === 'Bronze')?.qty).toBe(36);
    // Quality 2 only stops before the third step.
    const two = buildPlan([{ item: 'Sword', qty: 1, quality: 2 }], ctx);
    expect(need(two, 'Wood')?.missing).toBe(2);
    expect(two.crafted.find((c) => c.item === 'Bronze')?.qty).toBe(12);
  });

  it('raises the station level with each upgrade quality', () => {
    const plain = buildPlan([{ item: 'Sword', qty: 1 }], ctx);
    expect(plain.stations.find((s) => s.id === 'forge')?.level).toBe(1);
    const up = buildPlan([{ item: 'Sword', qty: 1, quality: 3 }], ctx);
    expect(up.stations.find((s) => s.id === 'forge')?.level).toBe(3); // 1 + (3 - 1)
    expect(up.stations.find((s) => s.id === 'smelter')?.level).toBe(1);
  });

  it('uses the inventory before crafting, at every level', () => {
    // Holding 8 Bronze skips the whole smelting chain; holding 3 Wood covers the Wood.
    const plan = buildPlan([{ item: 'Sword', qty: 1 }], ctx, { Bronze: 8, Wood: 3 });
    expect(plan.raw.find((l) => l.item === 'CopperOre')).toBeUndefined();
    expect(need(plan, 'Wood')).toEqual({ item: 'Wood', need: 2, have: 2, missing: 0 });
    expect(plan.fromInventory.find((i) => i.item === 'Bronze')?.qty).toBe(8);
    // A partial stack still helps: 5 Bronze means 3 more, which is 2 runs.
    const partial = buildPlan([{ item: 'Sword', qty: 1 }], ctx, { Bronze: 5 });
    expect(partial.crafted.find((c) => c.item === 'Bronze')?.qty).toBe(4);
    expect(need(partial, 'Tin')?.missing).toBe(2);
  });

  it('treats an item with no recipe as raw', () => {
    const plan = buildPlan([{ item: 'Mystery', qty: 5 }], ctx);
    expect(plan.raw).toEqual([{ item: 'Mystery', need: 5, have: 0, missing: 5 }]);
    expect(plan.steps).toEqual([]);
  });

  it('survives a recipe loop and reports it', () => {
    const loop = ctxOf([recipe('A', [['B', 1]]), recipe('B', [['A', 1]])]);
    const plan = buildPlan([{ item: 'A', qty: 1 }], loop);
    expect(plan.cycles.length).toBeGreaterThan(0);
    expect(plan.raw.length).toBeGreaterThan(0);
  });

  it('ignores zero or negative quantities', () => {
    expect(buildPlan([{ item: 'Sword', qty: 0 }], ctx).steps).toEqual([]);
  });
});
