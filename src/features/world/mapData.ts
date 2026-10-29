import { FchError, Reader } from '../save/fch';
import { gunzip } from './worldFile';

/**
 * The map a character has saved for one world: which map pixels were explored, and the pins. The layout
 * follows Minimap.GetMapData / SetMapData (map data version 8; the map is 2048 x 2048 pixels, one byte each).
 */
export interface MapPin {
  name: string;
  x: number;
  z: number;
  /** The game's PinType number (0 fire, 1 hammer, 2 pin, 3 circle, 4 death, 5 bed, 6 portal, 9 boss ...). */
  type: number;
  checked: boolean;
}

export interface SavedMap {
  size: number;
  /** One byte per map pixel, row 0 at the south edge; non-zero where the character has been. */
  explored: Uint8Array;
  pins: MapPin[];
}

const COMPRESSED_FROM = 7;
const PINS_FROM = 2;
const CHECKED_FROM = 3;
const OWNER_FROM = 6;
const AUTHOR_FROM = 8;

export async function parseMapData(data: Uint8Array): Promise<SavedMap> {
  const head = new Reader(data);
  const version = head.int();
  if (version < 5 || version > AUTHOR_FROM) throw new FchError(`The saved map has version ${version}; this site reads 5 to ${AUTHOR_FROM}.`);
  const body = new Reader(version >= COMPRESSED_FROM ? await gunzip(head.byteArray()) : data.subarray(4));
  const size = body.int();
  if (size < 16 || size > 8192) throw new FchError('The saved map has an unexpected size.');
  const explored = body.raw(size * size);
  body.skip(size * size); // explored by other players (shared maps)
  const pins: MapPin[] = [];
  if (version >= PINS_FROM) {
    for (let i = 0, n = body.count(10_000); i < n; i++) {
      const name = body.string();
      const at = body.point();
      const type = body.int();
      const checked = version >= CHECKED_FROM && body.bool();
      if (version >= OWNER_FROM) body.long();
      if (version >= AUTHOR_FROM) body.string();
      pins.push({ name, x: at.x, z: at.z, type, checked });
    }
  }
  return { size, explored, pins };
}
