import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { comfortGroups, comfortTotal } from './comfort';
import { lookup } from './lookup';

describe('comfort groups', () => {
  const groups = comfortGroups();
  const bed = groups.find((g) => g.name === 'Bed')!;

  it('lists each group once with its strongest piece first', () => {
    expect(new Set(groups.map((g) => g.name)).size).toBe(groups.length);
    for (const g of groups) {
      expect(g.best).toBe(g.pieces[0]);
      expect(g.pieces.every((p) => (p.comfort ?? 0) <= (g.best.comfort ?? 0))).toBe(true);
    }
    expect(bed.best.id).toBe('piece_bed02');
  });

  it('counts one piece per group, whatever else is built', () => {
    const rugs = groups.find((g) => g.name === 'Carpet')!;
    expect(comfortTotal({ Carpet: rugs.best.id })).toBe(rugs.best.comfort);
    // A piece of another group under this group's name counts for nothing.
    expect(comfortTotal({ Carpet: bed.best.id })).toBe(0);
    expect(comfortTotal({ Bed: bed.best.id, Carpet: rugs.best.id })).toBe(
      (bed.best.comfort ?? 0) + (rugs.best.comfort ?? 0),
    );
    expect(comfortTotal({})).toBe(0);
  });

  it('has the hearth and the stone throne now that the Stonecutter is in the data', () => {
    expect(lookup.piece('hearth')?.station).toBe('piece_stonecutter');
    expect(lookup.piece('piece_throne02')?.comfortGroup).toBe('Chair');
  });
});

describe('dropped comfort pieces', () => {
  const read = (name: string) =>
    JSON.parse(readFileSync(new URL(`../../tools/extract/${name}`, import.meta.url), 'utf8'));
  const dropped = read('dropped_pieces.json') as { piece: string; blocker: string }[];
  const reasons = read('dropped_piece_reasons.json') as Record<string, string>;

  it('every comfort piece the builder leaves out has a written reason', () => {
    expect(dropped.filter((r) => !(r.piece in reasons)).map((r) => r.piece)).toEqual([]);
  });

  it('has no reason for a piece that is no longer dropped', () => {
    const names = new Set(dropped.map((r) => r.piece));
    expect(Object.keys(reasons).filter((r) => !names.has(r))).toEqual([]);
  });
});
