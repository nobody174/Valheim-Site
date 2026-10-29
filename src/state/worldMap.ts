/**
 * Keeps the game's own map files (about 4.5 MB) and the character's saved map in this browser (IndexedDB),
 * so the map is there on the next visit without picking files again. Stored in this browser only, left out
 * of the backup because the files can be read again, and the page works when storage is blocked.
 */
export type MapFileName = 'biome' | 'mask' | 'height' | 'saved';

const DB = 'vcs:v1:worldmap';
const STORE = 'files';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putMapFiles(files: Partial<Record<MapFileName, Uint8Array>>): Promise<void> {
  try {
    const db = await open();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      for (const [name, bytes] of Object.entries(files)) tx.objectStore(STORE).put(bytes, name);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Blocked storage: the files have to be picked again next visit.
  }
}

export async function getMapFiles(): Promise<Partial<Record<MapFileName, Uint8Array>>> {
  try {
    const db = await open();
    const found: Partial<Record<MapFileName, Uint8Array>> = {};
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE);
      for (const name of ['biome', 'mask', 'height', 'saved'] as const) {
        const req = tx.objectStore(STORE).get(name);
        req.onsuccess = () => {
          if (req.result instanceof Uint8Array) found[name] = req.result;
        };
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    return found;
  } catch {
    return {};
  }
}

export async function clearMapFiles(): Promise<void> {
  try {
    const db = await open();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Nothing to clear.
  }
}
