import type { Recipe } from '../../data/schemas';

export type GraphMode = 'needs' | 'unlocks' | 'both';

export interface GraphNode {
  id: string;
  kind: 'item' | 'creature';
  label: string;
  /** Item category, for styling and the screen-reader list. */
  category?: string;
  root: boolean;
  /** More neighbours exist beyond what is shown; clicking "expand" shows them. */
  expandable: boolean;
  /** Products left out of view because too many things use this item; Expand shows them all. */
  hidden: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  /** For a recipe: the amount and the station with its level. For a drop: "drops". */
  label: string;
}

export interface GraphModel {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** True when the node cap cut the graph short. */
  truncated: boolean;
}

/** What the model reads from the data; the real lookup and test data both fit. */
export interface GraphContext {
  recipesFor(itemId: string): readonly Recipe[];
  usedIn(itemId: string): readonly Recipe[];
  item(id: string): { name: string; category: string } | undefined;
  /** Creatures and bosses that drop an item, as ids. */
  droppedBy(itemId: string): readonly string[];
  creatureName(id: string): string;
}

export const DEFAULT_DEPTH = 2;
export const MAX_DEPTH = 5;
/** The graph stops adding nodes here, so a late-game item stays smooth to pan and zoom. */
export const MAX_NODES = 80;
/** An item used in dozens of recipes shows this many products until it is expanded. */
export const MAX_FANOUT = 10;

const edgeLabel = (recipe: Recipe, qty: number, stationName: (id: string) => string) =>
  `${qty}×${recipe.station ? ` · ${stationName(recipe.station.id)} ${recipe.station.minLevel}` : ''}`;

/**
 * The part of the crafting graph around one item. "Needs" follows recipes backwards (what goes into
 * it, and into those), "Unlocks" forwards (what it is used for), "Both" does both. Each side goes
 * `depth` steps from the root; a node in `expanded` goes one step further. Edges point from
 * ingredient to product. Only the first recipe of an item is followed, as in the planner. Upgrade
 * costs are not drawn.
 */
export function buildGraphModel(
  rootId: string,
  mode: GraphMode,
  depth: number,
  expanded: ReadonlySet<string>,
  ctx: GraphContext,
  stationName: (id: string) => string = (id) => id,
): GraphModel {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();
  let truncated = false;

  const itemNode = (id: string, isRoot = false): boolean => {
    if (nodes.has(id)) return true;
    if (nodes.size >= MAX_NODES) {
      truncated = true;
      return false;
    }
    const item = ctx.item(id);
    nodes.set(id, {
      id,
      kind: 'item',
      label: item?.name ?? id,
      category: item?.category,
      root: isRoot,
      expandable: false,
      hidden: 0,
    });
    return true;
  };

  const addEdge = (source: string, target: string, label: string) => {
    const id = `${source}->${target}:${label}`;
    if (!edges.has(id)) edges.set(id, { id, source, target, label });
  };

  itemNode(rootId, true);

  /** Walk one direction. `step` lists the neighbours of a node and draws their edges. */
  const walk = (step: (id: string, depthLeft: number) => string[]) => {
    const dist = new Map<string, number>([[rootId, 0]]);
    const queue = [rootId];
    while (queue.length) {
      const id = queue.shift()!;
      const d = dist.get(id)!;
      const open = d < depth || expanded.has(id);
      const next = step(id, open ? 1 : 0);
      if (!open) {
        if (next.length > 0) nodes.get(id)!.expandable = true;
        continue;
      }
      for (const n of next) {
        if (!dist.has(n)) {
          dist.set(n, d + 1);
          queue.push(n);
        }
      }
    }
  };

  if (mode === 'needs' || mode === 'both') {
    walk((id, open) => {
      const recipe = ctx.recipesFor(id)[0];
      const found: string[] = [];
      const parts: { source: string; label: string }[] = [];
      if (recipe) {
        for (const input of recipe.inputs) parts.push({ source: input.item, label: edgeLabel(recipe, input.qty, stationName) });
      } else {
        for (const c of ctx.droppedBy(id).slice(0, 2)) parts.push({ source: `creature:${c}`, label: 'drops' });
      }
      if (!open) return parts.map((p) => p.source);
      for (const p of parts) {
        const isCreature = p.source.startsWith('creature:');
        let ok = true;
        if (isCreature) {
          const cid = p.source.slice('creature:'.length);
          if (!nodes.has(p.source)) {
            if (nodes.size >= MAX_NODES) {
              truncated = true;
              ok = false;
            } else {
              nodes.set(p.source, { id: p.source, kind: 'creature', label: ctx.creatureName(cid), root: false, expandable: false, hidden: 0 });
            }
          }
        } else ok = itemNode(p.source);
        if (!ok) continue;
        addEdge(p.source, id, p.label);
        if (!isCreature) found.push(p.source);
      }
      return found;
    });
  }

  if (mode === 'unlocks' || mode === 'both') {
    walk((id, open) => {
      const products = new Map<string, { recipe: Recipe; qty: number }>();
      for (const recipe of ctx.usedIn(id)) {
        const inputQty = recipe.inputs.find((i) => i.item === id)?.qty;
        // Only recipes that really consume it as an ingredient (not upgrade-only uses).
        if (inputQty !== undefined && ctx.recipesFor(recipe.output.item)[0] === recipe) {
          products.set(recipe.output.item, { recipe, qty: inputQty });
        }
      }
      if (!open) return [...products.keys()];
      const found: string[] = [];
      const all = [...products].sort((a, b) => (ctx.item(a[0])?.name ?? a[0]).localeCompare(ctx.item(b[0])?.name ?? b[0]));
      const shown = expanded.has(id) ? all : all.slice(0, MAX_FANOUT);
      if (shown.length < all.length) {
        const me = nodes.get(id)!;
        me.hidden = all.length - shown.length;
        me.expandable = true;
      }
      for (const [out, { recipe, qty }] of shown) {
        if (!itemNode(out)) continue;
        addEdge(id, out, edgeLabel(recipe, qty, stationName));
        found.push(out);
      }
      return found;
    });
  }

  return { nodes: [...nodes.values()], edges: [...edges.values()], truncated };
}
