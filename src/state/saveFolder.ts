/**
 * Remembers which folder of character files the owner picked, so the next visit is one click.
 * The browser keeps only a handle; it asks permission again each session. Stored in this browser
 * only (IndexedDB), and the site works when that is blocked.
 */
export interface FolderHandle {
  name: string;
  values(): AsyncIterable<{ kind: string; name: string; getFile?: () => Promise<File> }>;
  queryPermission?(opts: { mode: 'read' }): Promise<string>;
  requestPermission?(opts: { mode: 'read' }): Promise<string>;
}

const DB = 'vcs:v1:folders';
const STORE = 'handles';
const CHARACTERS = 'characters';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function rememberFolder(handle: FolderHandle, key = CHARACTERS): Promise<void> {
  try {
    const db = await open();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(handle, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Blocked storage: the folder just has to be picked again next time.
  }
}

export async function recallFolder(key = CHARACTERS): Promise<FolderHandle | null> {
  try {
    const db = await open();
    const handle = await new Promise<FolderHandle | null>((resolve, reject) => {
      const req = db.transaction(STORE).objectStore(STORE).get(key);
      req.onsuccess = () => resolve((req.result as FolderHandle | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return handle;
  } catch {
    return null;
  }
}

/** True when this browser can open a folder (Chrome, Edge); others use the file picker. */
export function canPickFolder(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

export async function pickFolder(): Promise<FolderHandle | null> {
  try {
    const picker = (
      window as unknown as { showDirectoryPicker: (o: { mode: 'read' }) => Promise<FolderHandle> }
    ).showDirectoryPicker;
    return await picker.call(window, { mode: 'read' });
  } catch {
    return null; // cancelled, or the browser refused this folder
  }
}

/** Every file directly in a folder. */
export async function listFiles(folder: FolderHandle): Promise<File[]> {
  const files: File[] = [];
  for await (const entry of folder.values()) {
    if (entry.kind === 'file' && entry.getFile) files.push(await entry.getFile());
  }
  return files;
}

/** The character files in a folder, without the game's own backups and `.old` copies. */
export async function listCharacterFiles(folder: FolderHandle): Promise<File[]> {
  const files: File[] = [];
  for await (const entry of folder.values()) {
    if (entry.kind !== 'file' || !entry.getFile) continue;
    if (!entry.name.toLowerCase().endsWith('.fch')) continue;
    files.push(await entry.getFile());
  }
  return files.sort((a, b) => b.lastModified - a.lastModified);
}

/** Backups made by the game or by backup mods; shown last and marked. */
export function isBackup(fileName: string): boolean {
  return /_backup_|\.old$/i.test(fileName);
}
