import { describe, expect, it } from 'vitest';
import { validateData, type RawData } from './validate-lib';

const prov = { source: 'test', verified: 'unverified' };
type Doc = Record<string, Record<string, unknown>[]>;

function base(): RawData {
  return {
    meta: { gameVersion: 'test', lastReviewed: '2026-01-01' },
    biomes: [{ id: 'meadows', name: 'Meadows', order: 1, ...prov }],
    items: [
      {
        id: 'Wood',
        name: 'Wood',
        category: 'material',
        biome: 'meadows',
        weight: 2,
        stackSize: 50,
        hoard: 'must_keep',
        ...prov,
      },
      {
        id: 'Club',
        name: 'Club',
        category: 'weapon',
        biome: 'meadows',
        weight: 2,
        stackSize: 1,
        hoard: 'safe_discard',
        ...prov,
      },
    ],
    recipes: [
      {
        id: 'recipe.Club',
        output: { item: 'Club', qty: 1 },
        station: { id: 'workbench', minLevel: 1 },
        inputs: [{ item: 'Wood', qty: 4 }],
        ...prov,
      },
    ],
    stations: [{ id: 'workbench', name: 'Workbench', ...prov }],
    weapons: [],
    armor: [],
    foods: [],
    trophies: [],
    creatures: [],
    bosses: [],
    pieces: [],
  };
}

const fresh = () => structuredClone(base()) as unknown as Doc;
const errorsOf = (d: Doc) => validateData(d as unknown as RawData).errors.join('\n');

describe('validateData', () => {
  it('accepts valid data', () => {
    expect(errorsOf(fresh())).toBe('');
  });

  it('fails on a duplicate id', () => {
    const d = fresh();
    d.items.push({ ...d.items[0] });
    expect(errorsOf(d)).toMatch(/duplicate id "Wood"/);
  });

  it('fails on a duplicate id across files', () => {
    const d = fresh();
    d.stations.push({ id: 'Wood', name: 'x', ...prov });
    expect(errorsOf(d)).toMatch(/duplicate id "Wood"/);
  });

  it('fails on a dangling item reference', () => {
    const d = fresh();
    d.recipes[0].inputs = [{ item: 'Nope', qty: 1 }];
    expect(errorsOf(d)).toMatch(/dangling item reference "Nope"/);
  });

  it('fails on a dangling station reference', () => {
    const d = fresh();
    d.recipes[0].station = { id: 'ghost', minLevel: 1 };
    expect(errorsOf(d)).toMatch(/dangling station reference "ghost"/);
  });

  it('fails on missing source', () => {
    const d = fresh();
    delete d.items[0].source;
    expect(errorsOf(d)).toMatch(/source/);
  });

  it('fails on missing verified', () => {
    const d = fresh();
    delete d.items[0].verified;
    expect(errorsOf(d)).toMatch(/verified/);
  });

  it('fails on keep_some without recommendedQty', () => {
    const d = fresh();
    d.items[0].hoard = 'keep_some';
    expect(errorsOf(d)).toMatch(/requires recommendedQty/);
  });

  it('accepts keep_some with recommendedQty', () => {
    const d = fresh();
    d.items[0].hoard = 'keep_some';
    d.items[0].recommendedQty = 20;
    expect(errorsOf(d)).toBe('');
  });
});
