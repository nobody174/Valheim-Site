import { useMemo, useState } from 'react';
import { Intro } from '../../components/Intro';
import { Link, useSearchParams } from 'react-router';
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { entityPath } from '../../components/EntityLink';
import { graph, lookup } from '../../data/lookup';
import itemStyles from '../items/Items.module.css';
import {
  buildGraphModel,
  DEFAULT_DEPTH,
  MAX_DEPTH,
  MAX_NODES,
  type GraphContext,
  type GraphMode,
  type GraphNode,
} from './graphModel';
import { layoutModel } from './layout';
import styles from './Graph.module.css';

const MODES: { key: GraphMode; label: string; hint: string }[] = [
  { key: 'needs', label: 'Needs', hint: 'Everything required to make it.' },
  { key: 'unlocks', label: 'Unlocks', hint: 'Everything it leads to.' },
  { key: 'both', label: 'Both', hint: 'What goes into it and what it makes.' },
];

const ctx: GraphContext = {
  recipesFor: (id) => graph.recipesFor(id),
  usedIn: (id) => graph.usedIn(id),
  item: (id) => lookup.item(id),
  droppedBy: (id) =>
    [...lookup.allCreatures(), ...lookup.allBosses()]
      .filter((c) => c.drops.some((d) => d.item === id))
      .map((c) => c.id),
  creatureName: (id) => (lookup.creature(id) ?? lookup.boss(id))?.name ?? id,
};

const stationName = (id: string) => lookup.station(id)?.name ?? id;

/** Where a node's own page lives. Creature nodes are ids like "creature:Troll". */
function pathOf(n: GraphNode): string {
  if (n.kind === 'creature') {
    const id = n.id.slice('creature:'.length);
    return entityPath(lookup.boss(id) ? 'boss' : 'creature', id);
  }
  return entityPath('item', n.id);
}

type NodeData = { label: string; node: GraphNode; dimmed: boolean; open: boolean };

function GraphNodeView({ data }: NodeProps<Node<NodeData>>) {
  const { node, dimmed, open } = data;
  const cls = [
    styles.node,
    node.root ? styles.root : '',
    node.kind === 'creature' ? styles.creature : '',
    node.kind === 'item' && node.category !== 'material' && node.category !== 'trophy' ? styles.craftable : '',
    dimmed ? styles.dim : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={cls} title={node.label}>
      <Handle type="target" position={Position.Left} className={styles.handle} isConnectable={false} />
      {node.label}
      {(node.expandable || open) && (
        <span className={styles.more}>{open ? '−' : node.hidden > 0 ? `+${node.hidden}` : '+'}</span>
      )}
      <Handle type="source" position={Position.Right} className={styles.handle} isConnectable={false} />
    </div>
  );
}

const nodeTypes = { gnode: GraphNodeView };

/** Everything reachable from a node along edges, in both directions, for the hover highlight. */
function connected(start: string, edges: { source: string; target: string }[]): Set<string> {
  const seen = new Set([start]);
  for (const forward of [true, false]) {
    const queue = [start];
    while (queue.length) {
      const id = queue.shift()!;
      for (const e of edges) {
        const [from, to] = forward ? [e.source, e.target] : [e.target, e.source];
        if (from === id && !seen.has(to)) {
          seen.add(to);
          queue.push(to);
        }
      }
    }
  }
  return seen;
}

/**
 * The crafting graph around one item. Needs, Unlocks or Both, at a chosen depth; click a node to
 * select it, then open its page or expand it. The same nodes are listed below as plain links for
 * keyboard and screen-reader use.
 */
export function GraphPage() {
  const [params, setParams] = useSearchParams();
  const items = useMemo(() => [...lookup.allItems()].sort((a, b) => a.name.localeCompare(b.name)), []);
  const id = lookup.item(params.get('item') ?? '')?.id ?? '';
  const mode = MODES.find((m) => m.key === params.get('mode'))?.key ?? 'needs';
  const depth = Math.min(MAX_DEPTH, Math.max(1, Number(params.get('depth')) || DEFAULT_DEPTH));
  const [text, setText] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string>('');
  const [hover, setHover] = useState<string>('');

  const set = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next, { replace: true });
    setExpanded(new Set());
    setSelected('');
  };

  const model = useMemo(
    () => (id ? buildGraphModel(id, mode, depth, expanded, ctx, stationName) : undefined),
    [id, mode, depth, expanded],
  );
  const placed = useMemo(() => (model ? layoutModel(model) : []), [model]);

  const lit = useMemo(() => (model && hover ? connected(hover, model.edges) : undefined), [model, hover]);
  const flowNodes: Node<NodeData>[] = (model?.nodes ?? []).map((n) => {
    const p = placed.find((x) => x.id === n.id)!;
    return {
      id: n.id,
      type: 'gnode',
      position: { x: p.x, y: p.y },
      data: { label: n.label, node: n, dimmed: lit ? !lit.has(n.id) : false, open: expanded.has(n.id) },
      selected: selected === n.id,
    };
  });
  const flowEdges: Edge[] = (model?.edges ?? []).map((e) => {
    const on = lit ? lit.has(e.source) && lit.has(e.target) : true;
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: on ? '#b8bcc2' : '#3a3d42', strokeWidth: lit && on ? 2 : 1 },
      labelStyle: { fontSize: 11, fill: '#e4e4e4' },
      labelBgStyle: { fill: '#161616' },
    };
  });

  const chosen = model?.nodes.find((n) => n.id === selected);
  const onPick = () => {
    const t = text.trim().toLowerCase();
    const hit = items.find((i) => i.name.toLowerCase() === t || i.id.toLowerCase() === t);
    if (hit) {
      set({ item: hit.id });
      setText('');
    }
  };

  return (
    <section>
      <h1>Crafting graph</h1>
      <Intro>
        <p>
        See what goes into an item and what it leads to. Click a node to select it, then open its page
        or expand it one more step. Edges show the amount, the station and the station level.
        </p>
      </Intro>
      <div className={itemStyles.filters}>
        <label>
          Item
          <input
            list="graph-items"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onPick()}
            placeholder={id ? (lookup.item(id)?.name ?? id) : 'Type an item name'}
          />
          <datalist id="graph-items">
            {items.map((i) => (
              <option key={i.id} value={i.name} />
            ))}
          </datalist>
        </label>
        <label>
          Show
          <select value={mode} onChange={(e) => set({ mode: e.target.value === 'needs' ? '' : e.target.value })}>
            {MODES.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}: {m.hint}
              </option>
            ))}
          </select>
        </label>
        <label>
          Depth
          <select
            value={depth}
            onChange={(e) => set({ depth: Number(e.target.value) === DEFAULT_DEPTH ? '' : e.target.value })}
          >
            {Array.from({ length: MAX_DEPTH }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className={itemStyles.reset} onClick={onPick}>
          Show graph
        </button>
      </div>

      {!model || !id ? (
        <p className={itemStyles.empty}>
          Choose an item to draw. You can also press &quot;Crafting graph&quot; on an item page.
        </p>
      ) : (
        <>
          <div className={styles.legend}>
            <span>Gold outline: the item you chose</span>
            <span>Bronze outline: made by crafting</span>
            <span>Dashed: a creature that drops it</span>
            <span>+ : more beyond this node</span>
          </div>
          <div className={styles.canvas} aria-label="Crafting graph" role="group">
            <ReactFlow
              key={`${id}-${mode}-${depth}-${[...expanded].join()}`}
              nodes={flowNodes}
              edges={flowEdges}
              nodeTypes={nodeTypes}
              fitView
              minZoom={0.2}
              nodesDraggable={false}
              nodesConnectable={false}
              onNodeClick={(_, n) => setSelected(n.id)}
              onNodeMouseEnter={(_, n) => setHover(n.id)}
              onNodeMouseLeave={() => setHover('')}
              proOptions={{ hideAttribution: true }}
            >
              <Background />
              <Controls showInteractive={false} />
              <MiniMap pannable zoomable style={{ background: '#1a1a1a' }} maskColor="rgba(0, 0, 0, 0.55)" nodeColor="#5a5f66" />
            </ReactFlow>
          </div>
          {model.truncated && (
            <p className={itemStyles.warn}>
              Showing the first {MAX_NODES} nodes so the graph stays smooth. Lower the depth or choose a
              narrower view.
            </p>
          )}
          <div className={styles.panel} aria-live="polite">
            {chosen ? (
              <>
                <strong>{chosen.label}</strong>{' '}
                <Link to={pathOf(chosen)}>Open page</Link>{' '}
                {chosen.kind === 'item' && !chosen.root && (
                  <Link to={`/graph?item=${chosen.id}&mode=${mode}`}>Centre the graph here</Link>
                )}{' '}
                {(chosen.expandable || expanded.has(chosen.id)) && (
                  <button
                    type="button"
                    className={itemStyles.reset}
                    onClick={() =>
                      setExpanded((cur) => {
                        const next = new Set(cur);
                        if (next.has(chosen.id)) next.delete(chosen.id);
                        else next.add(chosen.id);
                        return next;
                      })
                    }
                  >
                    {expanded.has(chosen.id) ? 'Collapse' : 'Expand one more step'}
                  </button>
                )}
              </>
            ) : (
              <span className={itemStyles.dim}>Click a node to open its page or expand it.</span>
            )}
          </div>
          <details className={itemStyles.section}>
            <summary>List view ({model.nodes.length} nodes), for keyboard and screen readers</summary>
            <ul>
              {model.nodes.map((n) => (
                <li key={n.id}>
                  <Link to={pathOf(n)}>{n.label}</Link>
                  {n.root ? ' (chosen item)' : ''}
                  {n.kind === 'creature' ? ' (creature)' : ''}
                </li>
              ))}
            </ul>
          </details>
        </>
      )}
    </section>
  );
}
