import { useState } from 'react';
import { EntityLink } from '../../components/EntityLink';
import { Intro } from '../../components/Intro';
import { gameData } from '../../data/load';
import { newId, type Portal } from '../../state/model';
import { appStore, useProfile } from '../../state/store';
import { caseClashes, linkStates, type LinkState } from './portals';
import styles from './Portals.module.css';

const STATUS: Record<LinkState, string> = {
  linked: 'Connected to the other portal with this name',
  alone: 'No other portal has this exact name, so it goes nowhere',
  crowded: 'More than two portals share this name: the game pairs two of them and the rest go nowhere',
  down: 'Taken down',
};

const BLANK: Portal = { id: '', name: '', from: '', to: '', note: '', down: false };

const blocked = gameData.items.filter((i) => i.portalBlocked).sort((a, b) => a.name.localeCompare(b.name));

/** The player's own portals, per profile, plus what the game says about names and what can pass. */
export function PortalsPage() {
  const profile = useProfile();
  const portals = profile.portals ?? [];
  const states = linkStates(portals);
  const clashes = caseClashes(portals);
  const [draft, setDraft] = useState<Portal>(BLANK);
  const set = <K extends keyof Portal>(key: K, value: Portal[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) return;
    appStore.getState().savePortal({ ...draft, id: draft.id || newId() });
    setDraft(BLANK);
  };

  return (
    <div>
      <h1>My portals</h1>
      <Intro>
        <p>
          Your own list of portals for <strong>{profile.name}</strong>: the name on each one and where it leads. The
          game does not keep such a list, so this is just your notes. Each profile has its own.
        </p>
      </Intro>

      <form className={styles.form} onSubmit={save} aria-label="Add or edit a portal">
        <label>
          Name on the portal (10 letters at most)
          <input value={draft.name} maxLength={10} onChange={(e) => set('name', e.target.value)} placeholder="portal 2" />
        </label>
        <label>
          From
          <input value={draft.from} maxLength={60} onChange={(e) => set('from', e.target.value)} placeholder="Home base" />
        </label>
        <label>
          To
          <input value={draft.to} maxLength={60} onChange={(e) => set('to', e.target.value)} placeholder="Mountain" />
        </label>
        <label className={styles.wide}>
          Note
          <input
            value={draft.note}
            maxLength={300}
            onChange={(e) => set('note', e.target.value)}
            placeholder="Next to the swamp, reached by boat"
          />
        </label>
        <div className={`${styles.actions} ${styles.wide}`}>
          <label>
            <input type="checkbox" checked={draft.down} onChange={(e) => set('down', e.target.checked)} /> Taken down
            for now
          </label>
          <button type="submit" disabled={!draft.name.trim()}>
            {draft.id ? 'Save changes' : 'Add portal'}
          </button>
          {draft.id && (
            <button type="button" onClick={() => setDraft(BLANK)}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {clashes.length > 0 && (
        <p role="status">Names that differ only in capital letters count as different portals: {clashes.join('; ')}.</p>
      )}

      {portals.length === 0 ? (
        <p>No portals yet. Add the first one above.</p>
      ) : (
        <ul className={styles.list}>
          {portals.map((p) => {
            const state = states.get(p.id) ?? 'alone';
            return (
              <li key={p.id} className={styles.portal} data-state={state}>
                <div className={styles.head}>
                  <span className={styles.name}>{p.name}</span>
                  <span className={styles.route}>
                    {p.from || '?'} → {p.to || '?'}
                  </span>
                  <span className={styles.status}>{STATUS[state]}</span>
                </div>
                {p.note && <p className={styles.note}>{p.note}</p>}
                <div className={styles.actions}>
                  <button type="button" onClick={() => setDraft(p)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => appStore.getState().savePortal({ ...p, down: !p.down })}>
                    {p.down ? 'Mark as standing' : 'Mark as taken down'}
                  </button>
                  <button type="button" onClick={() => appStore.getState().removePortal(p.id)}>
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <h2>How portals work</h2>
      <p className={styles.dimNote}>Read from the game&apos;s own code (the version in the data), not yet tried in game.</p>
      <ul className={styles.rules}>
        <li>
          A portal pairs with another standing portal that has <strong>exactly the same name</strong>. Capital letters
          count, so &quot;Home&quot; and &quot;home&quot; never meet. A name holds 10 letters at most. Portals with no
          name at all pair up with each other too.
        </li>
        <li>
          Renaming one end (press E on it) breaks its link, because the names no longer match. Give the other end the
          same new name and they pair up again; you have to visit both. Taking a portal down and building it again
          with the same name works the same way.
        </li>
        <li>
          Portals pair two by two. If three share a name, two are paired (the game picks which) and the third has no
          partner until one pair is broken. The pair that already works is not switched off.
        </li>
        <li>
          Portals also refuse you while you carry any of the items below. The game files mark them as not portable;
          tools, weapons, armor and everything else can go through. A world setting in the game can lift this.
        </li>
      </ul>
      <h3>Cannot go through a portal</h3>
      <ul className={styles.blocked}>
        {blocked.map((i) => (
          <li key={i.id}>
            <EntityLink id={i.id} />
          </li>
        ))}
      </ul>
    </div>
  );
}
