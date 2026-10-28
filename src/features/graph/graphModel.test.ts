import { describe, expect, it } from 'vitest';
import type { Recipe } from '../../data/schemas';
import { graph, lookup } from '../../data/lookup';
import { buildGraphModel, MAX_FANOUT, MAX_NODES, type GraphContext } from './graphModel';

const recipe = (output: string, inputs: [string, number][], station?: [string, number]): Recipe =>
  ({
    id: `recipe.${output}`,
    kind: 'craft',
    output: { item: output, qty: 1 },
    station: station ? { id: station[0], minLevel: station[1] } : null,
    inputs: inputs.map(([item, qty]) => ({ item, qty })),
    upgrades: [],
  }) as unknown as Recipe;

const recipes = [
  recipe('Sword', [['Bronze', 8], ['Wood', 2]], ['forge', 1]),
  recipe('Bronze', [['Copper', 2], ['Tin', 1]], ['forge', 1]),
  recipe('Copper', [['CopperOre', 1]], ['smelter', 1]),
  recipe('Tin', [['TinOre', 1]], ['smelter', 1]),
  recipe('Axe', [['Wood', 4], ['Flint', 1]], ['workbench', 1]),
];
const ctx: GraphContext = {
  recipesFor: (id) => recipes.filter((r) => r.output.item === id),
  usedIn: (id) => recipes.filter((r) => r.inputs.some((i) => i.item === id)),
  item: (id) => ({ name: id, category: 'material' }),
  droppedBy: (id) => (id === 'Wood' ? ['Troll'] : []),
  creatureName: (id) => id,
};
const none = new Set<string>();
const ids = (m: ReturnType<typeof buildGraphModel>) => m.nodes.map((n) => n.id).sort();

describe('buildGraphModel', () => {
  it('Needs: follows ingredients to the chosen depth and marks the frontier', () => {
    const m = buildGraphModel('Sword', 'needs', 1, none, ctx);
    expect(ids(m)).toEqual(['Bronze', 'Sword', 'Wood', 'creature:Troll'].filter((x) => x !== 'creature:Troll').sort());
    expect(m.nodes.find((n) => n.id === 'Bronze')!.expandable).toBe(true);
    expect(m.nodes.find((n) => n.id === 'Wood')!.expandable).toBe(true); // it has a drop source
    expect(m.nodes.find((n) => n.id === 'Sword')!.root).toBe(true);
  });

  it('Needs at depth 3 reaches the ores, with nothing left to expand on the way', () => {
    const m = buildGraphModel('Sword', 'needs', 3, none, ctx);
    expect(ids(m)).toEqual(['Bronze', 'Copper', 'CopperOre', 'Sword', 'Tin', 'TinOre', 'Wood', 'creature:Troll'].sort());
    expect(m.nodes.find((n) => n.id === 'Copper')!.expandable).toBe(false);
  });

  it('labels each edge with the amount, the station and its level; drops are labelled drops', () => {
    const m = buildGraphModel('Sword', 'needs', 3, none, ctx, (id) => id.toUpperCase());
    const e = (s: string, t: string) => m.edges.find((x) => x.source === s && x.target === t)!;
    expect(e('Bronze', 'Sword').label).toBe('8× · FORGE 1');
    expect(e('CopperOre', 'Copper').label).toBe('1× · SMELTER 1');
    expect(e('creature:Troll', 'Wood').label).toBe('drops');
  });

  it('Unlocks: follows what an item is used for', () => {
    const m = buildGraphModel('Wood', 'unlocks', 1, none, ctx);
    expect(ids(m)).toEqual(['Axe', 'Sword', 'Wood']);
    const deep = buildGraphModel('Tin', 'unlocks', 2, none, ctx);
    expect(ids(deep)).toEqual(['Bronze', 'Sword', 'Tin']);
  });

  it('Both: needs and unlocks around the same root', () => {
    const m = buildGraphModel('Bronze', 'both', 1, none, ctx);
    expect(ids(m)).toEqual(['Bronze', 'Copper', 'Sword', 'Tin']);
    const into = m.edges.filter((e) => e.target === 'Bronze').length;
    const out = m.edges.filter((e) => e.source === 'Bronze').length;
    expect([into, out]).toEqual([2, 1]);
  });

  it('an expanded node shows one more step', () => {
    const closed = buildGraphModel('Sword', 'needs', 1, none, ctx);
    const open = buildGraphModel('Sword', 'needs', 1, new Set(['Bronze']), ctx);
    expect(ids(closed)).not.toContain('Copper');
    expect(ids(open)).toEqual(expect.arrayContaining(['Copper', 'Tin']));
    expect(ids(open)).not.toContain('CopperOre');
  });

  it('an item with no recipe and no use is a single node', () => {
    const m = buildGraphModel('Flint', 'needs', 2, none, ctx);
    expect(ids(m)).toEqual(['Flint']);
    expect(m.edges).toEqual([]);
  });

  it('does not repeat a node or an edge', () => {
    const m = buildGraphModel('Sword', 'both', 4, none, ctx);
    expect(new Set(m.nodes.map((n) => n.id)).size).toBe(m.nodes.length);
    expect(new Set(m.edges.map((e) => e.id)).size).toBe(m.edges.length);
  });
});

describe('buildGraphModel on the real data', () => {
  const real: GraphContext = {
    recipesFor: (id) => graph.recipesFor(id),
    usedIn: (id) => graph.usedIn(id),
    item: (id) => lookup.item(id),
    droppedBy: (id) =>
      [...lookup.allCreatures(), ...lookup.allBosses()].filter((c) => c.drops.some((d) => d.item === id)).map((c) => c.id),
    creatureName: (id) => (lookup.creature(id) ?? lookup.boss(id))?.name ?? id,
  };

  it('draws Copper, Bronze and Iron with their recipes', () => {
    for (const id of ['Copper', 'Bronze', 'Iron']) {
      const m = buildGraphModel(id, 'both', 2, none, real);
      expect(m.nodes.length, id).toBeGreaterThan(2);
      expect(m.nodes.filter((n) => n.root)).toHaveLength(1);
    }
    const bronze = buildGraphModel('Bronze', 'needs', 1, none, real);
    expect(bronze.nodes.map((n) => n.id)).toEqual(expect.arrayContaining(['Bronze', 'Copper', 'Tin']));
  });

  it('every edge connects two nodes that exist, and the cap holds for a late-game item', () => {
    for (const id of ['SwordNiedhogg', 'ArmorFlametalChest', 'Wood', 'Iron']) {
      const m = buildGraphModel(id, 'both', 5, new Set(), real);
      const have = new Set(m.nodes.map((n) => n.id));
      expect(m.nodes.length, id).toBeLessThanOrEqual(MAX_NODES);
      for (const e of m.edges) {
        expect(have.has(e.source) && have.has(e.target), `${id}: ${e.id}`).toBe(true);
      }
    }
  });
});

describe('fan-out cap', () => {
  const many = Array.from({ length: 15 }, (_, i) => recipe(`Thing${String(i).padStart(2, '0')}`, [['Iron', 1]], ['forge', 1]));
  const wide: GraphContext = {
    recipesFor: (id) => many.filter((r) => r.output.item === id),
    usedIn: (id) => many.filter((r) => r.inputs.some((i) => i.item === id)),
    item: (id) => ({ name: id, category: 'material' }),
    droppedBy: () => [],
    creatureName: (id) => id,
  };

  it('shows only the first products of a widely used item, and says how many are hidden', () => {
    const m = buildGraphModel('Iron', 'unlocks', 1, new Set(), wide);
    expect(m.nodes.filter((n) => !n.root)).toHaveLength(MAX_FANOUT);
    const root = m.nodes.find((n) => n.root)!;
    expect(root.hidden).toBe(5);
    expect(root.expandable).toBe(true);
  });

  it('expanding the item shows them all', () => {
    const m = buildGraphModel('Iron', 'unlocks', 1, new Set(['Iron']), wide);
    expect(m.nodes.filter((n) => !n.root)).toHaveLength(15);
    expect(m.nodes.find((n) => n.root)!.hidden).toBe(0);
  });
});
