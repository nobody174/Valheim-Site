import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { lookup } from './lookup';

/** Categories the player crafts. Materials and trophies are gathered or dropped, so they need no recipe. */
const CRAFTED = new Set(['weapon', 'armor', 'tool', 'food', 'mead']);

const noRecipe = JSON.parse(
  readFileSync(new URL('../../tools/extract/no_recipe.json', import.meta.url), 'utf8'),
) as Record<string, string>;

describe('recipe completeness', () => {
  const made = new Set(lookup.allRecipes().map((r) => r.output.item));

  it('every craftable item has a recipe or is listed in tools/extract/no_recipe.json', () => {
    const missing = lookup
      .allItems()
      .filter((i) => CRAFTED.has(i.category) && !made.has(i.id) && !(i.id in noRecipe))
      .map((i) => i.id);
    expect(missing).toEqual([]);
  });

  it('no_recipe.json lists only items that really have no recipe, each with a reason', () => {
    for (const [id, reason] of Object.entries(noRecipe)) {
      expect(lookup.item(id), `${id} is not an item`).toBeDefined();
      expect(made.has(id), `${id} has a recipe now; remove it from no_recipe.json`).toBe(false);
      expect(reason.length).toBeGreaterThan(10);
    }
  });
});

describe('item sources', () => {
  /** Items whose source nobody could confirm (no game file lists it and no guide was found). */
  const KNOWN_GAPS = ['CarrotSeeds', 'ElderBark'];

  it('every item says where to get it, except the documented gaps', () => {
    const none = lookup
      .allItems()
      .filter((i) => i.obtainedFrom.length === 0 && !KNOWN_GAPS.includes(i.id))
      .map((i) => i.id);
    expect(none).toEqual([]);
  });

  it('the documented gaps are still gaps', () => {
    for (const id of KNOWN_GAPS) expect(lookup.item(id)?.obtainedFrom, id).toHaveLength(0);
  });
});
