import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { graph, lookup } from './lookup';

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

describe('station build costs', () => {
  /** Stations allowed to have no build cost, each with the reason. Empty: every station has one. */
  const NO_COST: Record<string, string> = {};

  it('every station has a build cost, or is listed here with a reason', () => {
    const empty = lookup
      .allStations()
      .filter((s) => s.buildRequirements.length === 0 && !(s.id in NO_COST))
      .map((s) => s.id);
    expect(empty).toEqual([]);
  });

  it('NO_COST lists only stations that really have no cost, each with a reason', () => {
    const stations = new Map(lookup.allStations().map((s) => [s.id, s]));
    for (const [id, reason] of Object.entries(NO_COST)) {
      const station = stations.get(id);
      expect(station, `${id} is not a station`).toBeDefined();
      expect(station?.buildRequirements, `${id} has a cost now; remove it from NO_COST`).toHaveLength(0);
      expect(reason.length).toBeGreaterThan(10);
    }
  });
});

describe('item descriptions', () => {
  it('every item that nothing is made from says what it is (game description) or what to do with it', () => {
    const missing = lookup
      .allItems()
      .filter((i) => i.category !== 'trophy')
      .filter((i) => graph.usedIn(i.id).length === 0 && lookup.summonsFor(i.id).length === 0)
      .filter((i) => !i.description && !i.use)
      .map((i) => i.id);
    expect(missing).toEqual([]);
  });
});

describe('player-facing text', () => {
  /** A prefab id such as ArmorFenringChest: lower case followed directly by an upper case letter. */
  const PREFAB = /[a-z][A-Z]/;

  it('contains no internal prefab ids in notes, hoard notes or use lines', () => {
    const bad: string[] = [];
    for (const i of lookup.allItems()) {
      const texts = [i.hoardNote, i.note, i.use, ...i.obtainedFrom.flatMap((o) =>
        'note' in o ? [o.note] : 'node' in o ? [o.node] : [],
      )];
      for (const t of texts) if (t && PREFAB.test(t)) bad.push(`${i.id}: ${t}`);
    }
    expect(bad).toEqual([]);
  });
});

describe('dropped recipes', () => {
  const read = (name: string) =>
    JSON.parse(readFileSync(new URL(`../../tools/extract/${name}`, import.meta.url), 'utf8'));
  const dropped = read('dropped_recipes.json').outputNotConfigured as { recipe: string }[];
  const reasons = read('dropped_reasons.json') as Record<string, string>;

  it('every recipe the builder leaves out has a written reason', () => {
    const missing = dropped.filter((r) => !(r.recipe in reasons)).map((r) => r.recipe);
    expect(missing).toEqual([]);
  });

  it('dropped_reasons.json has no reason for a recipe that is no longer dropped', () => {
    const names = new Set(dropped.map((r) => r.recipe));
    const stale = Object.keys(reasons).filter((r) => !names.has(r));
    expect(stale).toEqual([]);
  });
});

describe('armor sets', () => {
  it('every armor set has as many pieces in the data as its declared size', () => {
    const sets = new Map<string, { size: number; count: number }>();
    for (const a of lookup.allArmor()) {
      if (!a.setName) continue;
      const s = sets.get(a.setName) ?? { size: a.setSize ?? 0, count: 0 };
      s.count += 1;
      sets.set(a.setName, s);
    }
    const wrong = [...sets].filter(([, s]) => s.size !== s.count).map(([n, s]) => `${n}: ${s.count}/${s.size}`);
    expect(wrong).toEqual([]);
  });
});
