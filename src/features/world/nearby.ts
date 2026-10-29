export interface Spot {
  x: number;
  z: number;
}

export interface Near extends Spot {
  /** Straight-line distance in metres. */
  metres: number;
  direction: string;
}

const COMPASS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'] as const;

/** Compass direction from `from` to `to`. In Valheim, east is +x and north is +z. */
export function direction(from: Spot, to: Spot): string {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  if (dx === 0 && dz === 0) return 'here';
  const angle = Math.atan2(dx, dz); // 0 = north, clockwise
  return COMPASS[Math.round((angle / (Math.PI / 4) + 8) % 8) % 8]!;
}

export function metresBetween(a: Spot, b: Spot): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

export function formatDistance(metres: number): string {
  return metres < 1000 ? `${Math.round(metres / 10) * 10} m` : `${(metres / 1000).toFixed(1)} km`;
}

/** Turn the flat x, z, x, z ... list of a place into spots. */
export function spots(flat: readonly number[]): Spot[] {
  const out: Spot[] = [];
  for (let i = 0; i + 1 < flat.length; i += 2) out.push({ x: flat[i]!, z: flat[i + 1]! });
  return out;
}

/** The `count` spots closest to `from`, nearest first. */
export function nearest(list: readonly Spot[], from: Spot, count: number): Near[] {
  return list
    .map((s) => ({ ...s, metres: metresBetween(from, s), direction: direction(from, s) }))
    .sort((a, b) => a.metres - b.metres)
    .slice(0, count);
}
