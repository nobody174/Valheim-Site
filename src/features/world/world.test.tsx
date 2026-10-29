// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { places } from '../../data/load';
import { clearWorld, resetWorldCache, saveWorldMe, saveWorldPlaces } from '../../state/world';
import { FchError, stableHash } from '../save/fch';
import { direction, formatDistance, metresBetween, nearest, spots } from './nearby';
import { WorldPage } from './WorldPage';
import { familyIndex, parseWorld, WORLD_DATA_VERSION } from './worldFile';

/** A world file as the game writes it: version, net time, then the gzip-packed zone system block. */
async function buildWorld(list: { prefab: string; x: number; z: number }[], version = WORLD_DATA_VERSION) {
  const inner: number[] = [];
  const bytes = (n: number, write: (v: DataView) => void) => {
    const v = new DataView(new ArrayBuffer(n));
    write(v);
    inner.push(...new Uint8Array(v.buffer));
  };
  const int = (n: number) => bytes(4, (v) => v.setInt32(0, n, true));
  const float = (n: number) => bytes(4, (v) => v.setFloat32(0, n, true));
  int(2); // two generated zones
  bytes(8, (v) => {
    v.setInt16(0, 1, true);
    v.setInt16(4, 2, true);
  });
  int(32); // location version
  int(1); // one global key
  inner.push(4, ...new TextEncoder().encode('boss'));
  inner.push(1); // locations generated
  int(list.length);
  for (const l of list) {
    int(stableHash(l.prefab));
    float(l.x);
    float(5);
    float(l.z);
    inner.push(1);
  }
  const source = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(inner));
      controller.close();
    },
  });
  const packed = new Uint8Array(await new Response(source.pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
  const head = new DataView(new ArrayBuffer(16));
  head.setInt32(0, version, true);
  head.setFloat64(4, 1234, true);
  head.setInt32(12, packed.length, true);
  return new Uint8Array([...new Uint8Array(head.buffer), ...packed]);
}

describe('nearby', () => {
  it('points the compass the way Valheim does: east is +x, north is +z', () => {
    const o = { x: 0, z: 0 };
    expect(direction(o, { x: 0, z: 100 })).toBe('north');
    expect(direction(o, { x: 100, z: 100 })).toBe('north-east');
    expect(direction(o, { x: 100, z: 0 })).toBe('east');
    expect(direction(o, { x: 0, z: -100 })).toBe('south');
    expect(direction(o, { x: -100, z: -100 })).toBe('south-west');
    expect(direction(o, { x: -100, z: 0 })).toBe('west');
    expect(direction(o, { x: -100, z: 100 })).toBe('north-west');
    expect(direction(o, o)).toBe('here');
  });

  it('measures, formats and sorts', () => {
    expect(metresBetween({ x: 0, z: 0 }, { x: 3, z: 4 })).toBe(5);
    expect(formatDistance(640)).toBe('640 m');
    expect(formatDistance(1234)).toBe('1.2 km');
    const near = nearest(spots([500, 0, 0, 100, -2000, 0]), { x: 0, z: 0 }, 2);
    expect(near.map((n) => [n.x, n.z, n.direction])).toEqual([
      [0, 100, 'north'],
      [500, 0, 'east'],
    ]);
  });
});

describe('world file', () => {
  it('reads every place with its position', async () => {
    const w = await parseWorld(
      await buildWorld([
        { prefab: 'Crypt2', x: 100.4, z: -250 },
        { prefab: 'Eikthyrnir', x: -30, z: 40 },
      ]),
    );
    expect(w.locations).toEqual([
      { hash: stableHash('Crypt2'), x: expect.closeTo(100.4, 1), z: -250 },
      { hash: stableHash('Eikthyrnir'), x: -30, z: 40 },
    ]);
  });

  it('refuses a file of another data version, or one that is not a world', async () => {
    await expect(parseWorld(await buildWorld([], 41))).rejects.toThrow(FchError);
    await expect(parseWorld(new Uint8Array(8))).rejects.toThrow(/too small/);
    const damaged = await buildWorld([{ prefab: 'Crypt2', x: 1, z: 1 }]);
    damaged.fill(7, 20);
    await expect(parseWorld(damaged)).rejects.toThrow(/damaged|unpacked/);
  });

  it('knows the family of every prefab in the data, with no two families sharing a hash', () => {
    const family = familyIndex(places);
    const total = places.reduce((n, p) => n + p.prefabs.length, 0);
    expect(family.size).toBe(total);
    expect(family.get(stableHash('Crypt2'))).toBe('Crypt');
    expect(family.get(stableHash('Eikthyrnir'))).toBe('Eikthyrnir');
  });
});

describe('WorldPage', () => {
  beforeEach(() => {
    // jsdom has no canvas; the page draws nothing and the lists are what is tested.
    HTMLCanvasElement.prototype.getContext = () => null;
    localStorage.clear();
    resetWorldCache();
  });
  afterEach(() => {
    cleanup();
    clearWorld();
  });

  const open = () =>
    render(
      <MemoryRouter>
        <WorldPage />
      </MemoryRouter>,
    );

  it('asks for the world file first', () => {
    open();
    expect(screen.getByLabelText('Choose a world file')).toBeTruthy();
    expect(screen.queryByText('Places')).toBeNull();
  });

  it('lists places nearest first from the chosen spot', async () => {
    saveWorldPlaces('_main.1.db2', { Crypt: [900, 0, 100, 0], TrollCave: [0, 5000] }, 3);
    saveWorldMe({ name: 'Venom', home: { x: 0, z: 0 } });
    open();
    expect(screen.getByText(/3 places?/)).toBeTruthy();
    expect(screen.getByText(/and 3 the game files do not name/)).toBeTruthy();
    const crypt = screen.getByText('Burial Chamber').closest('li')!;
    expect(within(crypt).getByText(/2 in this world · nearest 100 m east/)).toBeTruthy();
    await userEvent.click(within(crypt).getByText('Burial Chamber'));
    const items = within(crypt).getAllByRole('listitem').map((li) => li.textContent);
    expect(items).toEqual(['100 m east · east 100, north 0', '900 m east · east 900, north 0']);
  });
});
