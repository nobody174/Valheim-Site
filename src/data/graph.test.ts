import { describe, expect, it } from 'vitest';
import { buildGraph } from './graph';
import type { Item, Recipe } from './schemas';

const prov = { source: 'test', verified: 'unverified' as const };
const item = (id: string, obtainedFrom: Item['obtainedFrom'] = []): Item => ({
  id,
  name: id,
  category: 'material',
  biome: null,
  weight: 1,
  stackSize: 10,
  tags: [],
  hoard: 'safe_discard',
  obtainedFrom,
  ...prov,
});
const recipe = (
  id: string,
  out: string,
  inputs: string[],
  upgradeInputs: string[] = [],
): Recipe => ({
  id,
  kind: 'craft',
  output: { item: out, qty: 1 },
  station: null,
  inputs: inputs.map((i) => ({ item: i, qty: 1 })),
  upgrades: upgradeInputs.length
    ? [{ quality: 2, inputs: upgradeInputs.map((i) => ({ item: i, qty: 1 })) }]
    : [],
  ...prov,
});

const graph = buildGraph({
  items: [
    item('Wood', [{ type: 'gather', node: 'tree' }]),
    item('Club'),
    item('Bone'),
    item('Torch'),
  ],
  recipes: [
    recipe('recipe.Club', 'Club', ['Wood'], ['Bone']),
    recipe('recipe.Torch', 'Torch', ['Wood']),
  ],
});

describe('buildGraph', () => {
  it('recipesFor returns recipes producing the item', () => {
    expect(graph.recipesFor('Club').map((r) => r.id)).toEqual(['recipe.Club']);
    expect(graph.recipesFor('Wood')).toEqual([]);
  });

  it('usedIn returns recipes consuming the item, including upgrade inputs', () => {
    expect(graph.usedIn('Wood').map((r) => r.id)).toEqual(['recipe.Club', 'recipe.Torch']);
    expect(graph.usedIn('Bone').map((r) => r.id)).toEqual(['recipe.Club']);
    expect(graph.usedIn('Club')).toEqual([]);
  });

  it('obtainedFrom returns the item sources', () => {
    expect(graph.obtainedFrom('Wood')).toEqual([{ type: 'gather', node: 'tree' }]);
    expect(graph.obtainedFrom('Unknown')).toEqual([]);
  });
});
