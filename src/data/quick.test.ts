import { describe, expect, it } from 'vitest';
import { lookup } from './lookup';
import { quickCard, quickText } from './quick';

const text = (id: string) => {
  const c = quickCard(id);
  return { farm: quickText(c.farm), usedFor: quickText(c.usedFor), make: quickText(c.make) };
};

describe('quickCard', () => {
  it('Flint: where to gather it, what it makes, marked as a guide line', () => {
    const c = quickCard('Flint');
    expect(c.farm?.guide).toBe(true);
    expect(text('Flint').farm).toMatch(/^Meadows · /);
    expect(text('Flint').usedFor).toMatch(/Flint Axe/);
    expect(text('Flint').usedFor).toMatch(/\+\d+ more$/);
    expect(c.make).toBeUndefined();
  });

  it('crafted weapons: make line with station and quantities, no farm line', () => {
    expect(text('AxeFlint').make).toBe('Workbench: 4 Wood, 6 Flint');
    expect(quickCard('AxeFlint').farm).toBeUndefined();
    expect(text('SpearFlint').make).toContain('10 Flint');
    expect(text('SpearFlint').usedFor).toMatch(/^Damage /);
  });

  it('Iron: made at a station', () => {
    expect(quickCard('Iron').make).toBeDefined();
  });

  it('a dropped item names its sources, at most two, then +N more', () => {
    expect(text('LeatherScraps').farm).toBe('Meadows · Dropped by Boar');
    expect(text('Coins').farm).toMatch(/^Black Forest · Dropped by [^,]+, [^,]+ \+\d+ more$/);
  });

  it('Acorn and Coins use the hoard label rather than inventing a purpose', () => {
    expect(quickCard('Acorn').usedFor?.fallback).toBe(true);
    expect(text('Acorn').usedFor).toBe('Safe to discard');
    expect(text('Coins').usedFor).toBe('Keep some');
  });

  it('no player-facing line contains a CamelCase prefab id', () => {
    const bad: string[] = [];
    for (const item of lookup.allItems()) {
      const c = quickCard(item.id);
      for (const line of [c.farm, c.usedFor, c.make]) {
        const t = quickText(line);
        if (/\b[A-Z][a-z]+[A-Z][A-Za-z]*\b/.test(t)) bad.push(`${item.id}: ${t}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
