import { useEffect, useState } from 'react';
import { Intro } from '../../components/Intro';
import { EntityLink } from '../../components/EntityLink';
import { gameData, saveKeys } from '../../data/load';
import { profileForCharacter } from '../../state/model';
import {
  canPickFolder,
  isBackup,
  listCharacterFiles,
  pickFolder,
  recallFolder,
  rememberFolder,
  type FolderHandle,
} from '../../state/saveFolder';
import { appStore, useApp, useProfile } from '../../state/store';
import { importCharacter, type CharacterImport, type CharacterSnapshot } from './character';
import { FchError, parseCharacter } from './fch';
import styles from './Character.module.css';

const SAVE_PATHS = [
  'C:\\Users\\<you>\\AppData\\LocalLow\\IronGate\\Valheim\\characters_local',
  'C:\\Program Files (x86)\\Steam\\userdata\\<your id>\\892970\\remote\\characters (Steam cloud saves)',
];

const when = (iso: string) => new Date(iso).toLocaleString();
const sortedEntries = (r: Record<string, number>) => Object.entries(r).sort((a, b) => b[1] - a[1]);

/** Read a character file from the owner's disk and show what the character has and has done. */
export function CharacterPage() {
  const profile = useProfile();
  const snapshot = profile.character;
  const [folder, setFolder] = useState<FolderHandle | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [remembered, setRemembered] = useState<FolderHandle | null>(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<{ file: string; imp: CharacterImport } | null>(null);

  useEffect(() => {
    let alive = true;
    void recallFolder().then((h) => alive && setRemembered(h));
    return () => {
      alive = false;
    };
  }, []);

  const openFolder = async (handle: FolderHandle) => {
    setError('');
    try {
      if (handle.requestPermission && (await handle.requestPermission({ mode: 'read' })) !== 'granted') {
        setError('The browser did not give read access to that folder.');
        return;
      }
      const found = await listCharacterFiles(handle);
      setFolder(handle);
      setFiles(found);
      if (found.length === 0) setError('No .fch character files in that folder.');
      await rememberFolder(handle);
      setRemembered(handle);
    } catch {
      setError('Could not read that folder. Try the file picker instead.');
    }
  };

  const choose = async () => {
    const handle = await pickFolder();
    if (handle) await openFolder(handle);
  };

  const read = async (file: File) => {
    setError('');
    setPreview(null);
    try {
      const parsed = parseCharacter(new Uint8Array(await file.arrayBuffer()));
      setPreview({ file: file.name, imp: importCharacter(parsed, gameData, saveKeys, new Date()) });
    } catch (e) {
      setError(e instanceof FchError ? e.message : 'Could not read that file.');
    }
  };

  const targetName = useApp((s) => {
    if (!preview) return '';
    const id = profileForCharacter(s, preview.imp.snapshot.name);
    return id ? s.profiles[id].name : `a new profile named ${preview.imp.snapshot.name}`;
  });

  const mine = files.filter((f) => !isBackup(f.name));
  const backups = files.filter((f) => isBackup(f.name));

  return (
    <div className={styles.page}>
      <h1>My character</h1>
      <Intro>
        <p>
        Read your Valheim character file and the site ticks what you have found and made, and shows your gear and
        skills. The file is read in this browser; nothing is uploaded.
        </p>
      </Intro>

      <section className={styles.panel}>
        <h2>Read a character</h2>
        <div className={styles.actions}>
          {canPickFolder() && (
            <button type="button" className={styles.button} onClick={() => void choose()}>
              Choose the characters folder
            </button>
          )}
          {remembered && (
            <button type="button" className={styles.button} onClick={() => void openFolder(remembered)}>
              Open last folder ({remembered.name})
            </button>
          )}
          <label className={styles.button}>
            Choose a .fch file
            <input
              type="file"
              accept=".fch"
              className={styles.hidden}
              aria-label="Choose a character file"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void read(f);
                e.target.value = '';
              }}
            />
          </label>
        </div>
        <details className={styles.hint}>
          <summary>Where are my character files?</summary>
          <ul>
            {SAVE_PATHS.map((p) => (
              <li key={p}>
                <code>{p}</code>
              </li>
            ))}
          </ul>
          <p>
            Browsers do not let a page open the Program Files folder, so for the Steam cloud copy use “Choose a .fch
            file” and paste the path into the file dialog.
          </p>
        </details>
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        {folder && mine.length > 0 && (
          <ul className={styles.files} aria-label={`Characters in ${folder.name}`}>
            {mine.map((f) => (
              <li key={f.name}>
                <button type="button" className={styles.button} onClick={() => void read(f)}>
                  {f.name.replace(/\.fch$/i, '')}
                </button>
                <span className={styles.dim}>saved {new Date(f.lastModified).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
        {backups.length > 0 && (
          <details className={styles.hint}>
            <summary>{backups.length} backups</summary>
            <ul className={styles.files}>
              {backups.map((f) => (
                <li key={f.name}>
                  <button type="button" className={styles.button} onClick={() => void read(f)}>
                    {f.name.replace(/\.fch$/i, '')}
                  </button>
                </li>
              ))}
            </ul>
          </details>
        )}
        {preview && (
          <div className={styles.preview} role="status">
            <p>
              <strong>{preview.imp.snapshot.name}</strong> ({preview.file}): {preview.imp.collected.length} items
              found, {preview.imp.crafted.length} made, {preview.imp.snapshot.gear.length} stacks in the inventory.
              This adds ticks to <strong>{targetName}</strong>; nothing is un-ticked.
            </p>
            {preview.imp.unknown.length > 0 && (
              <p className={styles.dim}>
                {preview.imp.unknown.length} names in the file are not in the site&apos;s data yet and were
                skipped.
              </p>
            )}
            <button
              type="button"
              className={styles.primary}
              onClick={() => {
                appStore.getState().applyCharacter(preview.imp);
                setPreview(null);
              }}
            >
              Add to my checklist
            </button>
          </div>
        )}
      </section>

      {snapshot ? <Summary snapshot={snapshot} /> : <p className={styles.dim}>No character read for this profile yet.</p>}
    </div>
  );
}

function Summary({ snapshot }: { snapshot: CharacterSnapshot }) {
  const worn = snapshot.gear.filter((g) => g.equipped);
  const carried = snapshot.gear.filter((g) => !g.equipped);
  const skills = sortedEntries(snapshot.skills);
  return (
    <>
      <section className={styles.panel}>
        <h2>
          {snapshot.name} <span className={styles.dim}>read {when(snapshot.importedAt)}</span>
        </h2>
        <dl className={styles.stats}>
          <div>
            <dt>Health</dt>
            <dd>{snapshot.maxHealth}</dd>
          </div>
          <div>
            <dt>Stamina</dt>
            <dd>{snapshot.maxStamina}</dd>
          </div>
          <div>
            <dt>Enemies killed</dt>
            <dd>{snapshot.stats.kills}</dd>
          </div>
          <div>
            <dt>Deaths</dt>
            <dd>{snapshot.stats.deaths}</dd>
          </div>
          <div>
            <dt>Crafted or upgraded</dt>
            <dd>{snapshot.stats.craftsAndUpgrades}</dd>
          </div>
          <div>
            <dt>Pieces built</dt>
            <dd>{snapshot.stats.builds}</dd>
          </div>
          <div>
            <dt>Hours played</dt>
            <dd>{snapshot.stats.hoursPlayed}</dd>
          </div>
        </dl>
      </section>

      <section className={styles.panel}>
        <h2>Gear worn</h2>
        {worn.length === 0 ? (
          <p className={styles.dim}>Nothing equipped.</p>
        ) : (
          <ul className={styles.list}>
            {worn.map((g, i) => (
              <li key={`${g.item}${i}`}>
                <EntityLink id={g.item} />
                {g.quality > 1 && <span className={styles.dim}> level {g.quality}</span>}
              </li>
            ))}
          </ul>
        )}
        <h2>Carried</h2>
        <ul className={styles.list}>
          {carried.map((g, i) => (
            <li key={`${g.item}${i}`}>
              <EntityLink id={g.item} />
              {g.stack > 1 && <span className={styles.dim}> × {g.stack}</span>}
              {g.quality > 1 && <span className={styles.dim}> level {g.quality}</span>}
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.panel}>
        <h2>Skills</h2>
        <ul className={styles.skills}>
          {skills.map(([name, level]) => (
            <li key={name}>
              <span>{name}</span>
              <progress value={level} max={100} aria-label={`${name} ${level} of 100`} />
              <span className={styles.dim}>{level}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.panel}>
        <h2>Progress</h2>
        <p>
          <strong>Zones seen:</strong> {snapshot.biomes.join(', ') || 'none'}
        </p>
        <p>
          <strong>Bosses beaten</strong> (trophy held):{' '}
          {snapshot.bosses.length === 0
            ? 'none yet'
            : snapshot.bosses.map((b, i) => (
                <span key={b}>
                  {i > 0 && ', '}
                  <EntityLink id={b} />
                </span>
              ))}
        </p>
        <p>
          <strong>Stations:</strong>{' '}
          {Object.entries(snapshot.stations).map(([id, level], i) => (
            <span key={id}>
              {i > 0 && ', '}
              <EntityLink id={id} /> {level}
            </span>
          ))}
        </p>
        <h3>Most killed</h3>
        <ul className={styles.list}>
          {sortedEntries(snapshot.kills)
            .slice(0, 10)
            .map(([id, n]) => (
              <li key={id}>
                <EntityLink id={id} /> <span className={styles.dim}>× {n}</span>
              </li>
            ))}
        </ul>
      </section>
    </>
  );
}
