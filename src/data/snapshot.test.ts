import { describe, expect, it } from 'vitest';
import { addRatings, weaponRows } from '../features/rankings/weaponRanking';

/**
 * A few computed numbers pinned on purpose. After a game patch and a data refresh, a failure here
 * means the numbers moved: read the change, then update the value below as part of the review.
 */
describe('computed values after the last refresh (Steam build 25909357)', () => {
  const rows = addRatings(weaponRows());
  const row = (id: string) => rows.find((r) => r.id === id)!;

  it('Bronze Sword', () => {
    const r = row('SwordBronze');
    expect(r.total).toBe(35);
    expect(r.combo).toBeGreaterThan(r.total);
    expect(Math.round(r.rating ?? -1)).toBeGreaterThanOrEqual(0);
  });

  it('the three highest-rated weapons', () => {
    const top = rows
      .filter((r) => r.rating !== undefined)
      .sort((a, b) => b.rating! - a.rating!)
      .slice(0, 3)
      .map((r) => r.id);
    expect(top).toHaveLength(3);
    // Ashlands end-game weapons lead the table with the default weights.
    for (const id of top) expect(row(id).zoneId).toBe('ashlands');
  });

  it('a weapon with no attack timing has no rating, and bombs are not ranked', () => {
    expect(rows.filter((r) => r.dps === undefined).every((r) => r.rating === undefined)).toBe(true);
    expect(rows.some((r) => r.id.startsWith('Bomb'))).toBe(false);
  });
});
