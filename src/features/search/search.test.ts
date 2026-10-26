import { describe, expect, it } from 'vitest';
import { gameData } from '../../data/load';
import { createSearch } from './search';

const search = createSearch(gameData);
const firstId = (q: string) => search(q).flatMap((g) => g.hits)[0]?.id;

describe('search', () => {
  it('returns nothing for an empty query', () => {
    expect(search('')).toEqual([]);
    expect(search('   ')).toEqual([]);
  });

  it('ranks an exact name first', () => {
    expect(firstId('Bronze Sword')).toBe('SwordBronze');
    expect(firstId('wood')).toBe('Wood');
  });

  it('matches prefixes', () => {
    const ids = search('bron', 50).flatMap((g) => g.hits.map((h) => h.id));
    expect(ids).toContain('Bronze');
    expect(ids).toContain('SwordBronze');
  });

  it('tolerates a typo', () => {
    expect(search('bronse sword').flatMap((g) => g.hits.map((h) => h.id))).toContain('SwordBronze');
  });

  it('matches the internal id too', () => {
    expect(search('SwordBronze').flatMap((g) => g.hits.map((h) => h.id))).toContain('SwordBronze');
  });

  it('groups results by category, trophies separate from items', () => {
    const groups = search('eikthyr');
    const keys = groups.map((g) => g.group);
    expect(keys).toContain('bosses');
    expect(keys).toContain('trophies');
    expect(groups.find((g) => g.group === 'trophies')?.hits[0].id).toBe('TrophyEikthyr');
  });

  it('finds creatures and stations', () => {
    expect(search('greydwarf').some((g) => g.group === 'creatures')).toBe(true);
    expect(search('workbench').some((g) => g.group === 'stations')).toBe(true);
  });

  it('answers in under 100 ms on the seed data', () => {
    const queries = ['b', 'bron', 'sword', 'greydwarf', 'cooked meat', 'tr', 'xyzzy'];
    const t0 = performance.now();
    for (const q of queries) search(q);
    const perQuery = (performance.now() - t0) / queries.length;
    console.log(`search: ${perQuery.toFixed(2)} ms/query`);
    expect(perQuery).toBeLessThan(100);
  });
});
