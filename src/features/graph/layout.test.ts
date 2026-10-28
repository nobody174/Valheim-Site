import { describe, expect, it } from 'vitest';
import { graph, lookup } from '../../data/lookup';
import { buildGraphModel, DEFAULT_DEPTH, type GraphContext } from './graphModel';
import { layoutModel, NODE_HEIGHT, NODE_WIDTH } from './layout';

const real: GraphContext = {
  recipesFor: (id) => graph.recipesFor(id),
  usedIn: (id) => graph.usedIn(id),
  item: (id) => lookup.item(id),
  droppedBy: (id) =>
    [...lookup.allCreatures(), ...lookup.allBosses()].filter((c) => c.drops.some((d) => d.item === id)).map((c) => c.id),
  creatureName: (id) => (lookup.creature(id) ?? lookup.boss(id))?.name ?? id,
};

const overlaps = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.abs(a.x - b.x) < NODE_WIDTH && Math.abs(a.y - b.y) < NODE_HEIGHT;

describe('layoutModel', () => {
  it('places ingredients to the left of what they make', () => {
    const m = buildGraphModel('Bronze', 'both', DEFAULT_DEPTH, new Set(), real);
    const at = new Map(layoutModel(m).map((p) => [p.id, p]));
    for (const e of m.edges) expect(at.get(e.source)!.x, e.id).toBeLessThan(at.get(e.target)!.x);
  });

  it('keeps nodes from overlapping at the default depth, in every mode, for chosen items', () => {
    for (const id of ['Copper', 'Bronze', 'Iron', 'SwordBronze', 'SwordNiedhogg', 'ArmorFlametalChest', 'Wood']) {
      for (const mode of ['needs', 'unlocks', 'both'] as const) {
        const placed = layoutModel(buildGraphModel(id, mode, DEFAULT_DEPTH, new Set(), real));
        for (let i = 0; i < placed.length; i++)
          for (let j = i + 1; j < placed.length; j++)
            expect(overlaps(placed[i]!, placed[j]!), `${id} ${mode}: ${placed[i]!.id} / ${placed[j]!.id}`).toBe(false);
      }
    }
  });

  it('is stable: the same graph gives the same positions', () => {
    const m = buildGraphModel('Iron', 'both', DEFAULT_DEPTH, new Set(), real);
    expect(layoutModel(m)).toEqual(layoutModel(m));
  });

  it('handles a single node', () => {
    const m = buildGraphModel('Flint', 'needs', 2, new Set(), real);
    expect(layoutModel(m)).toHaveLength(m.nodes.length);
  });
});
