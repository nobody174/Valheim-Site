import type { Portal } from '../../state/model';

export type LinkState = 'linked' | 'alone' | 'crowded' | 'down';

/**
 * A portal connects to the other portal that carries exactly the same name. Exactly two standing
 * portals with one name work; one has nobody to go to, and three or more switch each other off.
 */
export function linkStates(portals: Portal[]): Map<string, LinkState> {
  const standing = portals.filter((p) => !p.down);
  const count = (name: string) => standing.filter((p) => p.name === name).length;
  return new Map(
    portals.map((p): [string, LinkState] => {
      if (p.down) return [p.id, 'down'];
      const n = count(p.name);
      return [p.id, n === 2 ? 'linked' : n > 2 ? 'crowded' : 'alone'];
    }),
  );
}

/** Names that differ only in capital letters: the game treats them as different portals. */
export function caseClashes(portals: Portal[]): string[] {
  const byLower = new Map<string, Set<string>>();
  for (const p of portals) {
    const key = p.name.toLowerCase();
    byLower.set(key, (byLower.get(key) ?? new Set()).add(p.name));
  }
  return [...byLower.values()]
    .filter((names) => names.size > 1)
    .map((names) => [...names].join(' / '));
}

/** Alphabetical, ignoring capitals and counting numbers as numbers: boat, portal 1, portal 2, portal 10. */
export function sortPortals(portals: readonly Portal[]): Portal[] {
  return [...portals].sort((a, b) =>
    a.name.localeCompare(b.name, 'en', { numeric: true, sensitivity: 'base' }),
  );
}
