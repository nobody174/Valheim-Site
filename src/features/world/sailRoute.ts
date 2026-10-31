import type { Spot } from './nearby';
import { MAP_SIZE, METRES_PER_PIXEL, type Terrain } from './terrain';

/** The game's sea level, in metres of terrain height. */
const SEA_LEVEL = 30;
/** A cell counts as sailable water only when all of it is clearly below sea level, so a boat is not sent over a sandbar. */
const WATER_BELOW = SEA_LEVEL - 1;
/** How far from a point on land to look for the nearest water, in cells. */
const SNAP_RADIUS = 40;
/** Deep water costs up to this many times what shallow water costs, so the route hugs the shallows. */
const DEEP_PENALTY = 1;

export interface SailRoute {
  /** Where the boat leaves the shore, then the turns, then where it lands. World metres. */
  points: Spot[];
  /** Length over water, in metres. */
  seaMetres: number;
}

interface Grid {
  n: number;
  cell: number;
  water: Uint8Array;
  /** 0 (shallow) to 1 (deep) for water cells. */
  deep: Float32Array;
  /** Which stretch of connected water a cell belongs to (0 for land), so an unreachable goal is known at once. */
  comp: Int32Array;
  /** Cells in each stretch of water, by comp number. */
  compSize: number[];
}

/** Number the stretches of connected water (a boat moves along edges, as the route search does). */
function labelWater(water: Uint8Array, n: number) {
  const comp = new Int32Array(n * n);
  const compSize = [0];
  const stack: number[] = [];
  for (let seed = 0; seed < n * n; seed++) {
    if (!water[seed] || comp[seed]) continue;
    const id = compSize.length;
    let size = 0;
    comp[seed] = id;
    stack.push(seed);
    while (stack.length > 0) {
      const at = stack.pop()!;
      size++;
      const x = at % n;
      const y = (at - x) / n;
      if (x > 0 && water[at - 1] && !comp[at - 1]) (comp[at - 1] = id), stack.push(at - 1);
      if (x < n - 1 && water[at + 1] && !comp[at + 1]) (comp[at + 1] = id), stack.push(at + 1);
      if (y > 0 && water[at - n] && !comp[at - n]) (comp[at - n] = id), stack.push(at - n);
      if (y < n - 1 && water[at + n] && !comp[at + n]) (comp[at + n] = id), stack.push(at + n);
    }
    compSize.push(size);
  }
  return { comp, compSize };
}

/** A pond or lake smaller than this is not somewhere to launch a boat for a trip across the world. */
const MIN_SEA_CELLS = 400;

/** The map boiled down to blocks of `cell` pixels: a block is water when every pixel in it is. */
function buildGrid(terrain: Terrain, size: number, cell: number): Grid {
  const n = Math.floor(size / cell);
  const water = new Uint8Array(n * n);
  const deep = new Float32Array(n * n);
  for (let gy = 0; gy < n; gy++) {
    for (let gx = 0; gx < n; gx++) {
      let top = -Infinity;
      let sum = 0;
      for (let y = gy * cell; y < gy * cell + cell; y++) {
        for (let x = gx * cell; x < gx * cell + cell; x++) {
          const h = terrain.height[y * size + x]!;
          if (h > top) top = h;
          sum += h;
        }
      }
      const at = gy * n + gx;
      if (top < WATER_BELOW) {
        water[at] = 1;
        const depth = SEA_LEVEL - sum / (cell * cell);
        deep[at] = Math.min(1, Math.max(0, depth / 30));
      }
    }
  }
  const { comp, compSize } = labelWater(water, n);
  return { n, cell, water, deep, comp, compSize };
}

/** The grid is the slow part, and the same map is asked many times, so it is built once per map. */
const grids = new WeakMap<Terrain, Grid>();

/** A small binary heap of [priority, node]. */
class Heap {
  private items: [number, number][] = [];
  get size() {
    return this.items.length;
  }
  push(priority: number, node: number) {
    const a = this.items;
    a.push([priority, node]);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p]![0] <= a[i]![0]) break;
      [a[p], a[i]] = [a[i]!, a[p]!];
      i = p;
    }
  }
  pop(): number {
    const a = this.items;
    const top = a[0]!;
    const last = a.pop()!;
    if (a.length > 0) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && a[l]![0] < a[m]![0]) m = l;
        if (r < a.length && a[r]![0] < a[m]![0]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i]!, a[m]!];
        i = m;
      }
    }
    return top[1];
  }
}

const toCell = (g: Grid, p: Spot, size: number) => {
  const px = p.x / METRES_PER_PIXEL + size / 2;
  const py = p.z / METRES_PER_PIXEL + size / 2;
  return { gx: Math.floor(px / g.cell), gy: Math.floor(py / g.cell) };
};

const toWorld = (g: Grid, gx: number, gy: number, size: number): Spot => ({
  x: ((gx + 0.5) * g.cell - size / 2) * METRES_PER_PIXEL,
  z: ((gy + 0.5) * g.cell - size / 2) * METRES_PER_PIXEL,
});

/** The water cell nearest to a point, which may itself be on land. */
function snap(g: Grid, gx: number, gy: number): number | null {
  const seaSize = Math.min(MIN_SEA_CELLS, Math.max(...g.compSize) / 2);
  let best: number | null = null;
  let bestD = Infinity;
  for (let dy = -SNAP_RADIUS; dy <= SNAP_RADIUS; dy++) {
    for (let dx = -SNAP_RADIUS; dx <= SNAP_RADIUS; dx++) {
      const x = gx + dx;
      const y = gy + dy;
      const at = y * g.n + x;
      if (x < 0 || y < 0 || x >= g.n || y >= g.n || !g.water[at]) continue;
      if (g.compSize[g.comp[at]!]! < seaSize) continue;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = y * g.n + x;
      }
    }
  }
  return best;
}

/** Whether the straight line between two cells stays in water, so a corner can be cut. */
function clear(g: Grid, a: number, b: number): boolean {
  const ax = a % g.n;
  const ay = Math.floor(a / g.n);
  const bx = b % g.n;
  const by = Math.floor(b / g.n);
  const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay)) * 2;
  for (let s = 0; s <= steps; s++) {
    const t = steps === 0 ? 0 : s / steps;
    const x = Math.round(ax + (bx - ax) * t);
    const y = Math.round(ay + (by - ay) * t);
    if (!g.water[y * g.n + x]) return false;
  }
  return true;
}

/**
 * A boat route from one spot to another over the game's own sea, going round the land instead of across it.
 * Both ends are moved to the nearest water. The route is the cheapest path over water where deep water costs more,
 * so it keeps to the shallows near coasts rather than the open sea; it is a suggestion, not a guarantee of safety.
 * Returns null when no water joins the two ends.
 */
export function sailRoute(
  terrain: Terrain,
  from: Spot,
  to: Spot,
  size = MAP_SIZE,
  cell = 8,
): SailRoute | null {
  let g = grids.get(terrain);
  if (!g || g.n !== Math.floor(size / cell)) {
    g = buildGrid(terrain, size, cell);
    grids.set(terrain, g);
  }
  const a = toCell(g, from, size);
  const b = toCell(g, to, size);
  const start = snap(g, a.gx, a.gy);
  const goal = snap(g, b.gx, b.gy);
  // Both ends must sit on the same stretch of sea; otherwise there is no sailing there, and no need to search.
  if (start !== null && goal !== null && g.comp[start] !== g.comp[goal]) return null;
  if (start === null || goal === null) return null;

  const { n } = g;
  const goalX = goal % n;
  const goalY = Math.floor(goal / n);
  const cost = new Float32Array(n * n).fill(Infinity);
  const came = new Int32Array(n * n).fill(-1);
  const heap = new Heap();
  cost[start] = 0;
  heap.push(0, start);

  while (heap.size > 0) {
    const at = heap.pop();
    if (at === goal) break;
    const x = at % n;
    const y = Math.floor(at / n);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue;
        const next = ny * n + nx;
        if (!g.water[next]) continue;
        // No squeezing between two land corners.
        if (dx !== 0 && dy !== 0 && (!g.water[y * n + nx] || !g.water[ny * n + x])) continue;
        const step = Math.hypot(dx, dy) * (1 + DEEP_PENALTY * g.deep[next]!);
        const total = cost[at]! + step;
        if (total < cost[next]!) {
          cost[next] = total;
          came[next] = at;
          heap.push(total + Math.hypot(goalX - nx, goalY - ny), next);
        }
      }
    }
  }
  if (cost[goal] === Infinity) return null;

  const chain: number[] = [];
  for (let at = goal; at !== -1; at = came[at]!) chain.push(at);
  chain.reverse();

  // Cut corners wherever the straight line is still all water.
  const kept = [chain[0]!];
  let anchor = 0;
  for (let i = 1; i < chain.length; i++) {
    if (!clear(g, chain[anchor]!, chain[i]!)) {
      kept.push(chain[i - 1]!);
      anchor = i - 1;
    }
  }
  kept.push(chain[chain.length - 1]!);

  const points = kept.map((c) => toWorld(g, c % n, Math.floor(c / n), size));
  let seaMetres = 0;
  for (let i = 1; i < points.length; i++) {
    seaMetres += Math.hypot(points[i]!.x - points[i - 1]!.x, points[i]!.z - points[i - 1]!.z);
  }
  return { points, seaMetres };
}
