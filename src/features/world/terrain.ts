import { FchError } from '../save/fch';
import { gunzip } from './worldFile';

/**
 * The game's own picture of a world, kept next to the world as `cacheMinimapBiome`, `cacheMinimapMask`
 * and `cacheMinimapHeight` (Minimap.SaveMapTextureDataToDisk). Each is gzip packed, 2048 x 2048 pixels, row 0
 * at the south edge: biome and mask are RGBA bytes, height is a 16-bit float per pixel.
 */
export const MAP_SIZE = 2048;
/** Metres per map pixel (Minimap.m_pixelSize); the map is centred on the world's middle. */
export const METRES_PER_PIXEL = 12;
const SEA_LEVEL = 30;

export interface TerrainFiles {
  biome: Uint8Array;
  mask: Uint8Array;
  height: Uint8Array;
}

export interface Terrain {
  biome: Uint8Array;
  mask: Uint8Array;
  height: Float32Array;
}

export function halfToFloat(h: number): number {
  const sign = h & 0x8000 ? -1 : 1;
  const exp = (h >> 10) & 0x1f;
  const frac = h & 0x3ff;
  if (exp === 0) return sign * 2 ** -14 * (frac / 1024);
  if (exp === 31) return frac ? NaN : sign * Infinity;
  return sign * 2 ** (exp - 15) * (1 + frac / 1024);
}

export async function decodeTerrain(files: TerrainFiles, size = MAP_SIZE): Promise<Terrain> {
  const [biome, mask, halves] = await Promise.all([gunzip(files.biome), gunzip(files.mask), gunzip(files.height)]);
  const pixels = size * size;
  if (biome.length !== pixels * 4 || mask.length !== pixels * 4 || halves.length !== pixels * 2) {
    throw new FchError('The map files are not the size this site expects (2048 x 2048). They may be from another game version.');
  }
  const view = new DataView(halves.buffer, halves.byteOffset, halves.byteLength);
  const height = new Float32Array(pixels);
  for (let i = 0; i < pixels; i++) height[i] = halfToFloat(view.getUint16(i * 2, true));
  return { biome, mask, height };
}

/** Map pixel (column, row from the south) of a world position, and back. */
export const toPixel = (x: number, z: number, size = MAP_SIZE) => ({
  px: x / METRES_PER_PIXEL + size / 2,
  py: z / METRES_PER_PIXEL + size / 2,
});

export type Fog = 'none' | 'dim' | 'hide';

/**
 * Paint the terrain as the game's map looks: biome colours with the land shaded by its height, forests
 * darker, the sea deeper in colour with depth. Unexplored pixels are dimmed or hidden when an explored map
 * is given. The result is RGBA with row 0 at the top (north), ready for ImageData.
 */
export function renderTerrain(t: Terrain, explored: Uint8Array | null, fog: Fog, size = MAP_SIZE): Uint8ClampedArray {
  const out = new Uint8ClampedArray(size * size * 4);
  for (let row = 0; row < size; row++) {
    const i = size - 1 - row; // texture row, from the south
    for (let col = 0; col < size; col++) {
      const at = i * size + col;
      const h = t.height[at]!;
      let r: number;
      let g: number;
      let b: number;
      if (h < SEA_LEVEL) {
        const depth = Math.min(1, (SEA_LEVEL - h) / 60);
        r = 38 - 24 * depth;
        g = 64 - 34 * depth;
        b = 84 - 36 * depth;
      } else {
        // Light from the north-west: a slope that falls towards the south-east is lit.
        const west = t.height[at - (col > 0 ? 1 : 0)]!;
        const east = t.height[at + (col < size - 1 ? 1 : 0)]!;
        const north = t.height[at + (i < size - 1 ? size : 0)]!;
        const south = t.height[at - (i > 0 ? size : 0)]!;
        const shade = Math.max(0.55, Math.min(1.35, 1 + (west - east + (north - south)) * 0.035));
        const forest = t.mask[at * 4]! > 128 || t.mask[at * 4 + 1]! > 128 ? 0.78 : 1;
        r = t.biome[at * 4]! * shade * forest;
        g = t.biome[at * 4 + 1]! * shade * forest;
        b = t.biome[at * 4 + 2]! * shade * forest;
      }
      if (explored && fog !== 'none' && !explored[at]) {
        const keep = fog === 'hide' ? 0.08 : 0.4;
        r *= keep;
        g *= keep;
        b *= keep;
      }
      const o = (row * size + col) * 4;
      out[o] = r;
      out[o + 1] = g;
      out[o + 2] = b;
      out[o + 3] = 255;
    }
  }
  return out;
}
