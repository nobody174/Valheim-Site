import { describe, expect, it } from 'vitest';
import { skillRange } from './weaponStats';

describe('skillRange', () => {
  it('matches the in-game tooltip: a 40 damage axe shows (15-27) at skill ~21', () => {
    const r = skillRange(20.8);
    expect(Math.round(40 * r.min)).toBe(15);
    expect(Math.round(40 * r.max)).toBe(27);
  });
  it('is clamped at the ends', () => {
    expect(skillRange(0)).toMatchObject({ min: 0.25, max: 0.55 });
    expect(skillRange(100)).toMatchObject({ min: 0.85, max: 1 });
    expect(skillRange(500).max).toBe(1);
  });
});
