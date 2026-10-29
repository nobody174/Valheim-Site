import { FchError, Reader, stableHash } from '../save/fch';

/**
 * Reads the places out of a Valheim world file (`_main.<n>.db2`) in the browser. Nothing is uploaded.
 *
 * The game decides where every dungeon, altar and landmark goes when a world is created and keeps
 * the list in this file, so the list is complete from the first day: it is not limited to what the
 * player has seen. The layout follows ZNet.SaveWorldThread and ZoneSystem.Save / Load (data version 42).
 */
export const WORLD_DATA_VERSION = 42;

export interface WorldLocation {
  /** The game's stable hash of the place's prefab name (see {@link stableHash}). */
  hash: number;
  x: number;
  z: number;
}

export interface ParsedWorld {
  locations: WorldLocation[];
}

export async function gunzip(bytes: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') {
    throw new FchError(
      'This browser cannot unpack the world file (it lacks DecompressionStream). Try a current Chrome, Edge or Firefox.',
    );
  }
  const source = new ReadableStream({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
  return new Uint8Array(
    await new Response(source.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer(),
  );
}

/** Parse the bytes of a `.db2` world file. Throws {@link FchError} with a plain message on trouble. */
export async function parseWorld(file: Uint8Array): Promise<ParsedWorld> {
  if (file.length < 32) throw new FchError('This is not a Valheim world file (it is too small).');
  const head = new Reader(file);
  const version = head.int();
  if (version !== WORLD_DATA_VERSION) {
    throw new FchError(
      `This world was saved with data version ${version}; this site reads version ${WORLD_DATA_VERSION}. Pick the "_main.<number>.db2" file of the world.`,
    );
  }
  head.skip(8); // net time
  const packed = head.byteArray();
  let bytes: Uint8Array;
  try {
    bytes = await gunzip(packed);
  } catch (e) {
    if (e instanceof FchError) throw e;
    throw new FchError('The world file could not be unpacked; it may be damaged.');
  }

  const r = new Reader(bytes);
  r.skip(r.count(1_000_000) * 4); // generated zones
  r.int(); // location version
  for (let i = 0, n = r.count(); i < n; i++) r.string(); // global keys
  r.bool(); // locations generated
  const locations: WorldLocation[] = [];
  for (let i = 0, n = r.count(); i < n; i++) {
    const hash = r.int();
    const at = r.point();
    r.bool(); // placed
    locations.push({ hash, x: at.x, z: at.z });
  }
  return { locations };
}

/** The family a place hash belongs to, from the prefab names in the data. */
export function familyIndex(
  places: readonly { id: string; prefabs: readonly string[] }[],
): Map<number, string> {
  const out = new Map<number, string>();
  for (const p of places) for (const prefab of p.prefabs) out.set(stableHash(prefab), p.id);
  return out;
}
