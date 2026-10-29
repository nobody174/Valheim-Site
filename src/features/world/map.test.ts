import { describe, expect, it } from 'vitest';
import { parseMapData } from './mapData';
import { decodeTerrain, halfToFloat, renderTerrain, toPixel } from './terrain';

async function gzip(bytes: Uint8Array): Promise<Uint8Array> {
  const source = new ReadableStream({
    start(c) {
      c.enqueue(bytes);
      c.close();
    },
  });
  return new Uint8Array(await new Response(source.pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
}

describe('terrain', () => {
  it('reads 16-bit floats', () => {
    expect(halfToFloat(0x3c00)).toBe(1);
    expect(halfToFloat(0xc000)).toBe(-2);
    expect(halfToFloat(0x5a00)).toBe(192);
    expect(halfToFloat(0x0000)).toBe(0);
  });

  it('puts the middle of the world at the middle of the map, north up', () => {
    expect(toPixel(0, 0)).toEqual({ px: 1024, py: 1024 });
    expect(toPixel(1200, -600)).toEqual({ px: 1124, py: 974 });
  });

  it('decodes the three files and paints sea dark, land in its biome colour, and dims the unexplored', async () => {
    const size = 2;
    const biome = new Uint8Array(size * size * 4).fill(255);
    biome.set([100, 120, 60, 255], 4); // pixel 1 (row 0 from the south, column 1)
    const mask = new Uint8Array(size * size * 4);
    const heights = new Uint8Array(size * size * 2);
    const view = new DataView(heights.buffer);
    [0xd000, 0x5a00, 0x5a00, 0x5a00].forEach((h, i) => view.setUint16(i * 2, h, true)); // pixel 0 is deep sea
    const t = await decodeTerrain({ biome: await gzip(biome), mask: await gzip(mask), height: await gzip(heights) }, size);
    expect(t.height[1]).toBe(192);
    const lit = renderTerrain(t, null, 'none', size);
    // Row 0 of the image is the north row, so texture row 1 comes first.
    const southWest = (1 * size + 0) * 4;
    expect(lit[southWest + 2]).toBeGreaterThan(lit[southWest]!); // sea is blue
    const southEast = (1 * size + 1) * 4;
    expect(lit[southEast + 1]).toBeGreaterThan(lit[southEast + 2]!); // olive land
    const explored = new Uint8Array([0, 1, 1, 1]);
    const dim = renderTerrain(t, explored, 'dim', size);
    expect(dim[southWest + 2]).toBeLessThan(lit[southWest + 2]!);
    expect(dim[southEast + 1]).toBe(lit[southEast + 1]);
  });

  it('refuses files of another size', async () => {
    const one = await gzip(new Uint8Array(4));
    await expect(decodeTerrain({ biome: one, mask: one, height: one })).rejects.toThrow(/2048/);
  });
});

describe('saved map', () => {
  it('reads the explored area and the pins', async () => {
    const out: number[] = [];
    const int = (n: number) => out.push(...new Uint8Array(new Int32Array([n]).buffer));
    const float = (n: number) => out.push(...new Uint8Array(new Float32Array([n]).buffer));
    const text = (s: string) => out.push(s.length, ...new TextEncoder().encode(s));
    const size = 16;
    int(size);
    out.push(...new Uint8Array(size * size).map((_, i) => (i === 17 ? 1 : 0))); // explored
    out.push(...new Uint8Array(size * size)); // explored by others
    int(1); // one pin
    text('Main Home Base');
    float(583);
    float(30);
    float(-181);
    int(0);
    out.push(0); // checked
    out.push(...new Uint8Array(8)); // owner id
    text('');
    out.push(0); // public position
    const packed = await gzip(new Uint8Array(out));
    const file = new Uint8Array([8, 0, 0, 0, ...new Uint8Array(new Int32Array([packed.length]).buffer), ...packed]);
    const m = await parseMapData(file);
    expect(m.size).toBe(size);
    expect(m.explored[17]).toBe(1);
    expect(m.pins).toEqual([{ name: 'Main Home Base', x: 583, z: -181, type: 0, checked: false }]);
  });
});
