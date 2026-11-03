import { describe, expect, it } from 'vitest';
import { lookup } from './lookup';
import { quickCard } from './quick';

/** Trophies are for display (and the boss powers), so a missing "used for" line is not a gap for them. */
describe('item uses', () => {
  it('every item that is not a trophy says what it is for', () => {
    const blank = lookup
      .allItems()
      .filter((i) => i.category !== 'trophy' && !quickCard(i.id).usedFor)
      .map((i) => i.id);
    expect(blank).toEqual([]);
  });
});
