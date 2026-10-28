import { Graph, layout } from '@dagrejs/dagre';
import type { GraphModel } from './graphModel';

export const NODE_WIDTH = 170;
export const NODE_HEIGHT = 44;

export interface Placed {
  id: string;
  x: number;
  y: number;
}

/**
 * Left-to-right layered layout (ingredients on the left, products on the right). Returns the
 * top-left corner of each node; every node has the same size, so overlap checks are simple.
 */
export function layoutModel(model: GraphModel): Placed[] {
  const g = new Graph();
  g.setGraph({ rankdir: 'LR', nodesep: 28, ranksep: 110, marginx: 16, marginy: 16 });
  g.setDefaultEdgeLabel(() => ({}));
  for (const n of model.nodes) g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  for (const e of model.edges) g.setEdge(e.source, e.target);
  layout(g);
  return model.nodes.map((n) => {
    const p = g.node(n.id);
    return { id: n.id, x: p.x - NODE_WIDTH / 2, y: p.y - NODE_HEIGHT / 2 };
  });
}
