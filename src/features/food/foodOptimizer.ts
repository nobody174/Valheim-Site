export type Goal = 'health' | 'stamina' | 'eitr' | 'balanced';

export const GOALS: { key: Goal; label: string; rule: string }[] = [
  { key: 'health', label: 'Most health', rule: 'Highest total health; ties go to stamina, then Eitr.' },
  { key: 'stamina', label: 'Most stamina', rule: 'Highest total stamina; ties go to health, then Eitr.' },
  { key: 'eitr', label: 'Most Eitr', rule: 'Highest total Eitr; ties go to health, then stamina.' },
  {
    key: 'balanced',
    label: 'Balanced',
    rule: 'The smaller of total health and total stamina as large as possible; ties go to the larger sum.',
  },
];

export interface FoodEntry {
  id: string;
  health: number;
  stamina: number;
  eitr: number;
  durationSec: number;
}

export interface Combo {
  ids: [string, string, string];
  health: number;
  stamina: number;
  eitr: number;
  /** When the first of the three runs out. */
  shortestSec: number;
}

/** What a combo is ranked by, best first, compared left to right. */
function score(c: Combo, goal: Goal): number[] {
  switch (goal) {
    case 'health':
      return [c.health, c.stamina, c.eitr];
    case 'stamina':
      return [c.stamina, c.health, c.eitr];
    case 'eitr':
      return [c.eitr, c.health, c.stamina];
    case 'balanced':
      return [Math.min(c.health, c.stamina), c.health + c.stamina, c.eitr];
  }
}

function compareScores(a: number[], b: number[]): number {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return b[i]! - a[i]!;
  return 0;
}

/**
 * The best sets of three different foods for a goal, best first. The game lets you eat three at a
 * time and adds up their health, stamina and Eitr. Every set is tried (a few tens of thousands), so
 * the answer is exact. `minDurationSec` leaves out foods that wear off sooner than that.
 */
export function bestCombos(
  foods: readonly FoodEntry[],
  goal: Goal,
  count = 5,
  minDurationSec = 0,
): Combo[] {
  const pool = foods.filter((f) => f.durationSec >= minDurationSec);
  const found: Combo[] = [];
  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      for (let k = j + 1; k < pool.length; k++) {
        const a = pool[i]!;
        const b = pool[j]!;
        const c = pool[k]!;
        found.push({
          ids: [a.id, b.id, c.id].sort() as Combo['ids'],
          health: a.health + b.health + c.health,
          stamina: a.stamina + b.stamina + c.stamina,
          eitr: a.eitr + b.eitr + c.eitr,
          shortestSec: Math.min(a.durationSec, b.durationSec, c.durationSec),
        });
      }
    }
  }
  return found
    .sort(
      (x, y) =>
        compareScores(score(x, goal), score(y, goal)) || x.ids.join().localeCompare(y.ids.join()),
    )
    .slice(0, count);
}
