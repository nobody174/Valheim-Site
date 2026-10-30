import type { Piece } from './schemas';
import { lookup } from './lookup';

export interface ComfortGroup {
  name: string;
  /** Every piece of the group the site knows, strongest first. */
  pieces: Piece[];
  best: Piece;
}

/**
 * The rules the planner states. The game files hold the comfort numbers and groups; these rules come from
 * guides and community pages that disagree in places, so the page marks them as not checked in game.
 */
export const COMFORT_RULES = [
  'Pieces count when they are within about 10 m of you, in a roofed room with a fire lit.',
  'Only the strongest piece of each group counts, so five rugs add no more than one.',
];
export const COMFORT_UNCHECKED = [
  'Shelter (the roof and walls) adds 1 or 2 points: sources disagree.',
  'The highest comfort is 20 or 22: sources disagree.',
];

/** Comfort groups with at least one piece in the data, the strongest group first. */
export function comfortGroups(): ComfortGroup[] {
  const byName = new Map<string, Piece[]>();
  for (const p of lookup.allPieces()) {
    if (!p.comfort || !p.comfortGroup) continue;
    byName.set(p.comfortGroup, [...(byName.get(p.comfortGroup) ?? []), p]);
  }
  return [...byName]
    .map(([name, list]) => {
      const pieces = [...list].sort(
        (a, b) => (b.comfort ?? 0) - (a.comfort ?? 0) || a.name.localeCompare(b.name),
      );
      return { name, pieces, best: pieces[0]! };
    })
    .sort((a, b) => (b.best.comfort ?? 0) - (a.best.comfort ?? 0) || a.name.localeCompare(b.name));
}

/** Comfort from the chosen pieces, `group name -> piece id`. Each group counts once, whatever the pick. */
export function comfortTotal(picks: Record<string, string | undefined>): number {
  let total = 0;
  for (const g of comfortGroups()) {
    const pick = g.pieces.find((p) => p.id === picks[g.name]);
    if (pick) total += pick.comfort ?? 0;
  }
  return total;
}
