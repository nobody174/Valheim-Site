import { describe, expect, it } from 'vitest';
import { bestCombos, type FoodEntry, type Goal } from './foodOptimizer';

const f = (id: string, health: number, stamina: number, eitr = 0, durationSec = 1500): FoodEntry => ({
  id,
  health,
  stamina,
  eitr,
  durationSec,
});

const small = [
  f('A', 50, 10),
  f('B', 10, 60),
  f('C', 30, 30),
  f('D', 45, 5, 0, 600),
  f('E', 5, 5, 90),
  f('F', 20, 40, 10),
];

/** An independent search: every ordered triple of different foods, keeping the best by the goal. */
function brute(foods: FoodEntry[], goal: Goal): number[] {
  let best: number[] | undefined;
  for (const a of foods)
    for (const b of foods)
      for (const c of foods) {
        if (a === b || b === c || a === c) continue;
        const h = a.health + b.health + c.health;
        const s = a.stamina + b.stamina + c.stamina;
        const e = a.eitr + b.eitr + c.eitr;
        const v =
          goal === 'health' ? [h, s, e] : goal === 'stamina' ? [s, h, e] : goal === 'eitr' ? [e, h, s] : [Math.min(h, s), h + s, e];
        if (!best || v.some((x, i) => (x !== best![i] ? x > best![i]! : false) && v.slice(0, i).every((y, j) => y === best![j]))) best = v;
      }
  return best!;
}

describe('bestCombos', () => {
  it.each(['health', 'stamina', 'eitr', 'balanced'] as const)('matches a brute-force search for %s', (goal) => {
    const top = bestCombos(small, goal, 1)[0]!;
    const got =
      goal === 'health'
        ? [top.health, top.stamina, top.eitr]
        : goal === 'stamina'
          ? [top.stamina, top.health, top.eitr]
          : goal === 'eitr'
            ? [top.eitr, top.health, top.stamina]
            : [Math.min(top.health, top.stamina), top.health + top.stamina, top.eitr];
    expect(got).toEqual(brute(small, goal));
  });

  it('picks three different foods', () => {
    for (const c of bestCombos(small, 'health', 20)) expect(new Set(c.ids).size).toBe(3);
  });

  it('adds up health, stamina and Eitr', () => {
    const top = bestCombos(small, 'health', 1)[0]!;
    expect(top.ids).toEqual(['A', 'C', 'D']);
    expect(top).toMatchObject({ health: 125, stamina: 45, eitr: 0, shortestSec: 600 });
  });

  it('leaves out foods that wear off too soon', () => {
    const top = bestCombos(small, 'health', 1, 900)[0]!;
    expect(top.ids).not.toContain('D');
  });

  it('returns fewer than asked when there are not enough foods, and nothing for under three', () => {
    expect(bestCombos(small.slice(0, 3), 'health', 5)).toHaveLength(1);
    expect(bestCombos(small.slice(0, 2), 'health')).toEqual([]);
  });

  it('is deterministic when scores tie', () => {
    const same = [f('X', 10, 10), f('Y', 10, 10), f('Z', 10, 10), f('W', 10, 10)];
    expect(bestCombos(same, 'health', 2).map((c) => c.ids.join())).toEqual(['W,X,Y', 'W,X,Z']);
  });
});
