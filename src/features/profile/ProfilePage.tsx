import { useState } from 'react';
import { Intro } from '../../components/Intro';
import { buildExport, parseImport, type ExportFile } from '../../state/model';
import { appStore, useApp } from '../../state/store';
import styles from '../items/Items.module.css';

function downloadExport(): void {
  const file = buildExport(appStore.getState());
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `valheim-companion-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function ProfileRow({ id }: { id: string }) {
  const profile = useApp((s) => s.profiles[id]);
  const isActive = useApp((s) => s.active === id);
  const canDelete = useApp((s) => s.order.length > 1);
  const { switchProfile, renameProfile, deleteProfile } = appStore.getState();
  const [name, setName] = useState(profile.name);
  const [confirming, setConfirming] = useState(false);

  return (
    <li className={styles.row}>
      <input
        type="text"
        value={name}
        maxLength={40}
        aria-label={`Name of profile ${profile.name}`}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => (name.trim() ? renameProfile(id, name) : setName(profile.name))}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />
      {isActive ? (
        <span className={styles.ok}>Active</span>
      ) : (
        <button type="button" className={styles.toggle} onClick={() => switchProfile(id)}>
          Switch to
        </button>
      )}
      {canDelete &&
        (confirming ? (
          <>
            <span>Delete this profile and its progress?</span>
            <button
              type="button"
              className={`${styles.toggle} ${styles.danger}`}
              onClick={() => deleteProfile(id)}
            >
              Yes, delete
            </button>
            <button type="button" className={styles.toggle} onClick={() => setConfirming(false)}>
              Cancel
            </button>
          </>
        ) : (
          <button type="button" className={styles.toggle} onClick={() => setConfirming(true)}>
            Delete
          </button>
        ))}
    </li>
  );
}

export function ProfilePage() {
  const order = useApp((s) => s.order);
  const { createProfile, importData } = appStore.getState();
  const [newName, setNewName] = useState('');
  const [pending, setPending] = useState<ExportFile | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const onFile = async (file: File | undefined) => {
    setMessage(null);
    setPending(null);
    if (!file) return;
    const result = parseImport(await file.text());
    if (result.ok) setPending(result.data);
    else setMessage({ ok: false, text: result.error });
  };

  const apply = (mode: 'replace' | 'merge') => {
    if (!pending) return;
    importData(pending, mode);
    setMessage({
      ok: true,
      text:
        mode === 'replace'
          ? `Imported. Everything was replaced with ${pending.profiles.length} profile(s) from the file.`
          : `Imported. Added ${pending.profiles.length} profile(s) next to your existing ones.`,
    });
    setPending(null);
  };

  return (
    <section>
      <h1>Profile &amp; data</h1>
      <Intro>
        <p>
        A profile keeps its own checklist, favorites and hoard choices, for example one per
        character or world. Everything is stored in this browser only.
        </p>
      </Intro>

      <section className={styles.section}>
        <h2>Profiles</h2>
        <ul className={styles.inline} style={{ display: 'block' }}>
          {order.map((id) => (
            <ProfileRow key={id} id={id} />
          ))}
        </ul>
        <form
          className={styles.row}
          onSubmit={(e) => {
            e.preventDefault();
            createProfile(newName);
            setNewName('');
          }}
        >
          <input
            type="text"
            value={newName}
            maxLength={40}
            placeholder="New profile name"
            aria-label="New profile name"
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="submit" className={styles.toggle} disabled={!newName.trim()}>
            Add profile
          </button>
        </form>
      </section>

      <section className={styles.section}>
        <h2>Back up and restore</h2>
        <p className={styles.dim}>
          Browsers can lose site data. Download a backup now and then; import it to restore.
        </p>
        <div className={styles.row}>
          <button type="button" className={styles.toggle} onClick={downloadExport}>
            Download backup (JSON)
          </button>
          <label className={styles.toggle}>
            Import a backup…
            <input
              type="file"
              accept="application/json,.json"
              style={{ display: 'none' }}
              onChange={(e) => {
                void onFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </label>
        </div>
        {pending && (
          <div className={styles.warn}>
            <p>
              This file has {pending.profiles.length} profile(s):{' '}
              {pending.profiles.map((p) => p.name).join(', ')}. How should it be imported?
            </p>
            <div className={styles.row}>
              <button
                type="button"
                className={`${styles.toggle} ${styles.danger}`}
                onClick={() => apply('replace')}
              >
                Replace everything
              </button>
              <button type="button" className={styles.toggle} onClick={() => apply('merge')}>
                Add to my profiles
              </button>
              <button type="button" className={styles.toggle} onClick={() => setPending(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}
        {message && (
          <p role="status" className={message.ok ? styles.ok : styles.error}>
            {message.text}
          </p>
        )}
      </section>
    </section>
  );
}
