import { useEffect, useMemo, useRef, useState } from 'react';
import { Intro } from '../../components/Intro';
import {
  canPickFolder,
  listFiles,
  pickFolder,
  recallFolder,
  rememberFolder,
  type FolderHandle,
} from '../../state/saveFolder';
import { useApp } from '../../state/store';
import { places } from '../../data/load';
import { lookup } from '../../data/lookup';
import {
  clearWorld,
  saveWorldMe,
  saveWorldPlaces,
  useWorld,
  type SavedWorld,
} from '../../state/world';
import { KIND_LABEL, KIND_ORDER } from '../places/PlacesPage';
import { FchError, parseCharacter } from '../save/fch';
import { formatDistance, nearest, spots, type Near, type Spot } from './nearby';
import type { MapPin } from './mapData';
import type { Fog } from './terrain';
import { useWorldMap } from './useWorldMap';
import { WorldMapView } from './WorldMapView';
import { familyIndex, parseWorld } from './worldFile';
import styles from './World.module.css';

/** The three kinds of folder the page keeps an eye on, each remembered per profile. */
type Role = 'world' | 'land' | 'character';
const ROLES: Role[] = ['world', 'land', 'character'];
const ROLE_LABEL: Record<Role, string> = {
  world: 'world file',
  land: 'map files',
  character: 'character file',
};
const roleKey = (role: Role, profile: string) => `${role}:${profile}`;
/** The newest world file: the game numbers them up with every save. */
const newestWorld = (files: File[]) =>
  files
    .filter((f) => /^_main\.\d+\.db2$/.test(f.name))
    .sort((a, b) => Number(/\d+/.exec(b.name)![0]) - Number(/\d+/.exec(a.name)![0]))[0];
const landFiles = (files: File[]) =>
  files.filter((f) => /^cacheMinimap(Biome|Mask|Height)$/.test(f.name));
const characterFiles = (files: File[]) =>
  files.filter((f) => f.name.toLowerCase().endsWith('.fch') && !/_backup_|\.old$/i.test(f.name));
/** Auto-update at most this often when the window is focused again. */
const REFRESH_MS = 20_000;

type From = 'logout' | 'home' | 'death' | 'custom';
const FROM_LABEL: Record<From, string> = {
  logout: 'Where I last logged out',
  home: 'My home point',
  death: 'Where I last died',
  custom: 'A spot I type in',
};
const KIND_COLOUR: Record<(typeof KIND_ORDER)[number], string> = {
  dungeon: 'var(--ember)',
  altar: 'var(--gold)',
  merchant: 'var(--zone-blackforest)',
  quest: 'var(--zone-mistlands)',
  other: 'var(--silver)',
};
const MAP_FOLDER =
  'C:\\Users\\<you>\\AppData\\LocalLow\\IronGate\\Valheim\\worlds_local\\<world name>\\';
const WORLD_PATHS = [
  'C:\\Program Files (x86)\\Steam\\userdata\\<your id>\\892970\\remote\\worlds\\<world name>\\_main.<number>.db2 (Steam cloud copy)',
  'C:\\Users\\<you>\\AppData\\LocalLow\\IronGate\\Valheim\\worlds_local\\<world name>\\ (a local, non-cloud world)',
];

const KIND_COLOUR_HEX: Record<(typeof KIND_ORDER)[number], string> = {
  dungeon: '#e0742a',
  altar: '#d3a73b',
  merchant: '#4f9170',
  quest: '#a68fcf',
  other: '#b8bcc2',
};
/** Spots with or without a distance, so one list can show both. */
const listed = (list: readonly (Spot & Partial<Near>)[]) => list;

const NO_PINS: MapPin[] = [];

const pointOf = (
  me: SavedWorld['me'],
  from: From,
  custom: { x: string; z: string },
): Spot | null => {
  if (from === 'custom') {
    const x = Number(custom.x);
    const z = Number(custom.z);
    return custom.x.trim() !== '' &&
      custom.z.trim() !== '' &&
      Number.isFinite(x) &&
      Number.isFinite(z)
      ? { x, z }
      : null;
  }
  return me?.[from] ?? null;
};

/** Where the world's dungeons, altars and landmarks are, read from the owner's world file. */
export function WorldPage() {
  const profileId = useApp((s) => s.active);
  const profileName = useApp((s) => s.profiles[s.active].name);
  const world = useWorld(profileId);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [chosen, setFrom] = useState<From>('logout');
  const [custom, setCustom] = useState({ x: '', z: '' });
  const [kind, setKind] = useState('');
  const [query, setQuery] = useState('');
  const [onMap, setOnMap] = useState<ReadonlySet<string>>(
    () => new Set(places.filter((p) => p.kind === 'altar').map((p) => p.id)),
  );
  const [fog, setFog] = useState<Fog>('dim');
  const [showPins, setShowPins] = useState(true);
  const map = useWorldMap(profileId, fog);
  const zones = lookup.allBiomes();
  const characterName = useApp((s) => s.profiles[s.active].character?.name);
  const [remembered, setRemembered] = useState<Role[]>([]);
  const [updated, setUpdated] = useState('');

  const readWorld = async (file: File) => {
    setError('');
    setBusy(true);
    try {
      const parsed = await parseWorld(new Uint8Array(await file.arrayBuffer()));
      const family = familyIndex(places);
      const found: Record<string, number[]> = {};
      let unknown = 0;
      for (const loc of parsed.locations) {
        const id = family.get(loc.hash);
        if (!id) unknown += 1;
        else (found[id] ??= []).push(Math.round(loc.x), Math.round(loc.z));
      }
      saveWorldPlaces(profileId, file.name, found, unknown);
    } catch (e) {
      setError(e instanceof FchError ? e.message : 'Could not read that file.');
    } finally {
      setBusy(false);
    }
  };

  const readCharacter = async (file: File) => {
    setError('');
    try {
      const c = parseCharacter(new Uint8Array(await file.arrayBuffer()));
      // A character can remember several worlds; the newest one it has a logout spot in is the one being played.
      const remembered =
        [...c.worlds].reverse().find((w) => w.logout) ?? c.worlds[c.worlds.length - 1];
      if (!remembered) {
        setError('This character has not been in a world yet.');
        return;
      }
      saveWorldMe(profileId, {
        name: c.name,
        home: remembered.home,
        logout: remembered.logout,
        death: remembered.death,
      });
      if (remembered.map) void map.addSavedMap(remembered.map);
      setFrom(remembered.logout ? 'logout' : remembered.home ? 'home' : 'custom');
    } catch (e) {
      setError(e instanceof FchError ? e.message : 'Could not read that file.');
    }
  };

  /** Read what a folder holds for one role. `auto` skips what cannot have changed (the places and the land). */
  const load = async (role: Role, files: File[], auto: boolean) => {
    if (role === 'world') {
      const db2 = newestWorld(files);
      if (db2 && !(auto && world?.file === db2.name)) await readWorld(db2);
    } else if (role === 'land') {
      const maps = landFiles(files);
      if (maps.length >= 3 && !(auto && map.hasTerrain)) await map.addTerrainFiles(maps);
    } else {
      const found = characterFiles(files);
      // The profile's own character if it can be told by name, else the one saved last.
      const mine = found.find(
        (f) => f.name.toLowerCase() === `${characterName?.toLowerCase()}.fch`,
      );
      const file = mine ?? [...found].sort((a, b) => b.lastModified - a.lastModified)[0];
      if (file) await readCharacter(file);
    }
  };

  /** Pick a folder; whatever it holds (world file, map files, characters) is read and the folder remembered. */
  const readFolder = async () => {
    const folder = await pickFolder();
    if (!folder) return;
    setError('');
    const files = await listFiles(folder);
    const present = ROLES.filter((r) =>
      r === 'world'
        ? newestWorld(files)
        : r === 'land'
          ? landFiles(files).length >= 3
          : characterFiles(files).length > 0,
    );
    if (present.length === 0) {
      setError(
        'That folder has no world file (_main.<number>.db2), no map files (cacheMinimapBiome, Mask, Height) and no character file (.fch). Try the world’s own folder or the characters folder.',
      );
      return;
    }
    for (const role of present) {
      await rememberFolder(folder, roleKey(role, profileId));
      await load(role, files, false);
    }
    setRemembered((r) => [...new Set([...r, ...present])]);
    setUpdated(new Date().toLocaleTimeString());
  };

  /** Read the remembered folders again. Without a click the browser only lets this through if it still remembers the permission. */
  const refresh = async (ask: boolean) => {
    const roles: Role[] = [];
    for (const role of ROLES) {
      const handle: FolderHandle | null = await recallFolder(roleKey(role, profileId));
      if (!handle) continue;
      roles.push(role);
      let permission = (await handle.queryPermission?.({ mode: 'read' })) ?? 'granted';
      if (permission !== 'granted' && ask)
        permission = (await handle.requestPermission?.({ mode: 'read' })) ?? 'denied';
      if (permission !== 'granted') continue;
      try {
        await load(role, await listFiles(handle), !ask);
        setUpdated(new Date().toLocaleTimeString());
      } catch {
        setError('Could not read the remembered folder. Choose it again.');
      }
    }
    setRemembered(roles);
  };

  // Keep what the page shows current: when it opens, and when the window is focused again (second monitor).
  const latest = useRef(refresh);
  useEffect(() => {
    latest.current = refresh;
  });
  useEffect(() => {
    let last = 0;
    const run = () => {
      if (Date.now() - last < REFRESH_MS) return;
      last = Date.now();
      void latest.current(false);
    };
    run();
    window.addEventListener('focus', run);
    return () => window.removeEventListener('focus', run);
  }, [profileId]);

  const available = (['logout', 'home', 'death'] as const).filter((f) => world?.me?.[f]);
  // A spot that a character file did not have is not offered; fall back to the first one that it did.
  const from: From =
    chosen === 'custom' || available.includes(chosen) ? chosen : (available[0] ?? 'custom');
  const reference = pointOf(world?.me, from, custom);

  const rows = useMemo(() => {
    if (!world) return [];
    const q = query.trim().toLowerCase();
    const zoneRank = (id: string) => zones.find((z) => z.id === id)?.order ?? 99;
    return places
      .filter((p) => (world.places[p.id]?.length ?? 0) > 0)
      .filter((p) => (!kind || p.kind === kind) && (!q || p.name.toLowerCase().includes(q)))
      .map((p) => {
        const all = spots(world.places[p.id]!);
        return { place: p, all, near: reference ? nearest(all, reference, 8) : [] };
      })
      .sort(
        (a, b) =>
          KIND_ORDER.indexOf(a.place.kind) - KIND_ORDER.indexOf(b.place.kind) ||
          (a.near[0]?.metres ?? 0) - (b.near[0]?.metres ?? 0) ||
          zoneRank(a.place.zones[0]!) - zoneRank(b.place.zones[0]!) ||
          a.place.name.localeCompare(b.place.name),
      );
  }, [world, kind, query, reference, zones]);

  const layers = useMemo(
    () =>
      rows
        .filter((r) => onMap.has(r.place.id))
        .map((r) => ({ id: r.place.id, colour: KIND_COLOUR_HEX[r.place.kind], spots: r.all })),
    [rows, onMap],
  );
  const hasPlaces = world !== null && Object.keys(world.places).length > 0;
  const toggle = (id: string) =>
    setOnMap((s) => {
      const next = new Set(s);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return (
    <div className={styles.page}>
      <h1>My world</h1>
      <p className={styles.dim}>
        Kept for the profile “{profileName}”: each profile has its own world.
      </p>
      <Intro>
        <p>
          The game decides where every dungeon, boss altar and landmark goes when a world is made,
          and keeps the list in the world file. This page reads that list in your browser (nothing
          is uploaded) and shows where things are: the nearest crypt, where each boss altar is, and
          a map.
        </p>
        <p>
          It lists <strong>everything</strong> in the world, including places in zones you have not
          reached, so it spoils the map. Only places the game files name are shown; the rest are
          counted as unknown. The list is kept in this browser only and is not part of the backup,
          because you can read the file again.
        </p>
      </Intro>

      {canPickFolder() && (
        <section className={styles.panel}>
          <h2>Keep it up to date</h2>
          <p className={styles.dim}>
            Choose the folders once and the page remembers them for this profile and reads the
            newest files when you open it or come back to the window. Choose each folder in turn:
            the world’s folder in the Steam cloud saves (the world file), the world’s folder in{' '}
            <code>worlds_local</code> (the map files), and the characters folder (your position,
            explored area and pins).
          </p>
          <div className={styles.actions}>
            <button type="button" className={styles.button} onClick={() => void readFolder()}>
              Choose a folder
            </button>
            {remembered.length > 0 && (
              <button type="button" className={styles.button} onClick={() => void refresh(true)}>
                Update now
              </button>
            )}
          </div>
          {remembered.length > 0 && (
            <p className={styles.dim}>
              Remembered: {remembered.map((r) => ROLE_LABEL[r]).join(', ')}.
              {updated && ` Last read ${updated}.`} If the browser asks to view the files again,
              allow it.
            </p>
          )}
        </section>
      )}

      <section className={styles.panel}>
        <h2>1. Read the world file</h2>
        <div className={styles.actions}>
          <label className={styles.button}>
            {busy ? 'Reading ...' : 'Choose the world .db2 file'}
            <input
              type="file"
              accept=".db2"
              className={styles.hidden}
              aria-label="Choose a world file"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void readWorld(f);
                e.target.value = '';
              }}
            />
          </label>
        </div>
        {hasPlaces && (
          <p className={styles.dim}>
            Read <code>{world.file}</code>:{' '}
            {Object.values(world.places).reduce((n, l) => n + l.length / 2, 0)} places
            {world.unknown > 0 && `, and ${world.unknown} the game files do not name`}.{' '}
            <button type="button" className={styles.link} onClick={() => clearWorld(profileId)}>
              Forget it
            </button>
          </p>
        )}
        <details className={styles.hint}>
          <summary>Where is the world file?</summary>
          <ul>
            {WORLD_PATHS.map((p) => (
              <li key={p}>
                <code>{p}</code>
              </li>
            ))}
          </ul>
          <p>
            Pick the <code>.db2</code> file with the highest number in the world’s folder. It is
            updated each time the game saves, so places do not change, but this is the file to use.
            In the file dialog, click the address bar and paste the folder to get there.
          </p>
        </details>
      </section>

      <section className={styles.panel}>
        <h2>2. Where are you? (optional)</h2>
        <p className={styles.dim}>
          Your character file remembers where you logged out, your home point and where you died.
          With one of those the list is sorted by distance.
        </p>
        <label className={styles.button}>
          Choose your .fch character file
          <input
            type="file"
            accept=".fch"
            className={styles.hidden}
            aria-label="Choose a character file"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void readCharacter(f);
              e.target.value = '';
            }}
          />
        </label>
        {world?.me && <p className={styles.dim}>Read {world.me.name}’s spots.</p>}
        <div className={styles.form}>
          <label>
            Measure from
            <select value={from} onChange={(e) => setFrom(e.target.value as From)}>
              {[...available, 'custom' as const].map((f) => (
                <option key={f} value={f}>
                  {FROM_LABEL[f]}
                </option>
              ))}
            </select>
          </label>
          {from === 'custom' && (
            <>
              <label>
                East (x, metres)
                <input
                  type="number"
                  inputMode="numeric"
                  value={custom.x}
                  onChange={(e) => setCustom({ ...custom, x: e.target.value })}
                />
              </label>
              <label>
                North (z, metres)
                <input
                  type="number"
                  inputMode="numeric"
                  value={custom.z}
                  onChange={(e) => setCustom({ ...custom, z: e.target.value })}
                />
              </label>
            </>
          )}
        </div>
        {reference && (
          <p className={styles.dim}>
            Measuring from east {Math.round(reference.x)}, north {Math.round(reference.z)}.
          </p>
        )}
      </section>

      <section className={styles.panel}>
        <h2>3. The land (optional)</h2>
        <p className={styles.dim}>
          The game keeps its own picture of the world next to the world's save. Give it to the site
          and the map shows the coasts, mountains and zones, with the part you have explored lit and
          the rest dimmed.
        </p>
        <div className={styles.actions}>
          <label className={styles.button}>
            Choose the three map files
            <input
              type="file"
              multiple
              className={styles.hidden}
              aria-label="Choose the map files"
              onChange={(e) => {
                void map.addTerrainFiles([...(e.target.files ?? [])]);
                e.target.value = '';
              }}
            />
          </label>
        </div>
        {map.hasTerrain && (
          <p className={styles.dim}>
            Map read.{' '}
            <button type="button" className={styles.link} onClick={map.forget}>
              Forget the map
            </button>
          </p>
        )}
        <details className={styles.hint}>
          <summary>Where are the map files?</summary>
          <p>
            In <code>{MAP_FOLDER}</code>: <code>cacheMinimapBiome</code>,{' '}
            <code>cacheMinimapMask</code> and <code>cacheMinimapHeight</code>. They have no ending.
            Select all three in the file dialog at once (hold Ctrl), and set the file type to “All
            files”. A folder pick (Chrome or Edge) finds them by itself: choose the world’s folder
            in <code>worlds_local</code> for the map, or the world’s folder in the Steam cloud saves
            for the world file.
          </p>
        </details>
      </section>

      {(error || map.error) && (
        <p className={styles.error} role="alert">
          {error || map.error}
        </p>
      )}

      {(hasPlaces || map.hasTerrain) && (
        <section className={styles.panel} aria-label="Map">
          <h2>Map</h2>
          <div className={styles.form}>
            {map.saved && (
              <>
                <label>
                  Unexplored land
                  <select value={fog} onChange={(e) => setFog(e.target.value as Fog)}>
                    <option value="dim">Dimmed</option>
                    <option value="hide">Hidden, like in game</option>
                    <option value="none">Shown</option>
                  </select>
                </label>
                <label className={styles.onMap}>
                  <input
                    type="checkbox"
                    checked={showPins}
                    onChange={(e) => setShowPins(e.target.checked)}
                  />
                  My pins ({map.saved.pins.filter((p) => !p.name.startsWith('$')).length})
                </label>
              </>
            )}
          </div>
          <WorldMapView
            key={reference ? 'me' : 'none'}
            image={map.image}
            layers={layers}
            pins={showPins && map.saved ? map.saved.pins : NO_PINS}
            reference={reference}
          />
          <p className={styles.dim}>
            North is up. Drag to move, scroll to zoom.{' '}
            {map.hasTerrain
              ? 'The land is the game’s own map of this world.'
              : 'Without the map files (step 3) there is no land, only the places.'}{' '}
            It starts with the boss altars; tick more places below to draw them.
          </p>
        </section>
      )}

      {hasPlaces && (
        <>
          <section className={styles.panel}>
            <h2>Places</h2>
            <div className={styles.form}>
              <label>
                Kind
                <select value={kind} onChange={(e) => setKind(e.target.value)}>
                  <option value="">All kinds</option>
                  {KIND_ORDER.map((k) => (
                    <option key={k} value={k}>
                      {KIND_LABEL[k]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Search
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="crypt, tower ..."
                />
              </label>
            </div>
            <ul className={styles.list}>
              {rows.map(({ place, all, near }) => (
                <li key={place.id} className={styles.place}>
                  <details>
                    <summary>
                      <span
                        className={styles.swatch}
                        style={{ background: KIND_COLOUR[place.kind] }}
                        aria-hidden="true"
                      />
                      <strong>{place.name}</strong>
                      <span className={styles.dim}>
                        {' '}
                        · {KIND_LABEL[place.kind]} · {all.length} in this world
                        {near[0] &&
                          ` · nearest ${formatDistance(near[0].metres)} ${near[0].direction}`}
                      </span>
                    </summary>
                    <p className={styles.dim}>
                      {place.zones
                        .map((id) => zones.find((z) => z.id === id)?.name ?? id)
                        .join(', ')}
                      {reference
                        ? '. Nearest first:'
                        : '. Add your position above to sort by distance.'}
                    </p>
                    <ol className={styles.spots}>
                      {listed(reference ? near : all.slice(0, 8)).map((s) => (
                        <li key={`${s.x},${s.z}`}>
                          {s.metres !== undefined &&
                            `${formatDistance(s.metres)} ${s.direction} · `}
                          east {s.x}, north {s.z}
                        </li>
                      ))}
                    </ol>
                  </details>
                  <label className={styles.onMap}>
                    <input
                      type="checkbox"
                      checked={onMap.has(place.id)}
                      onChange={() => toggle(place.id)}
                    />
                    On map
                  </label>
                </li>
              ))}
            </ul>
            {rows.length === 0 && <p className={styles.dim}>No place matches that.</p>}
          </section>
        </>
      )}
    </div>
  );
}
