import { useEffect, useMemo, useState } from 'react';
import { EntityLink } from '../../components/EntityLink';
import { Intro } from '../../components/Intro';
import { gameData } from '../../data/load';
import { adoptProfileChecks, setGameCheck, useGameChecks } from '../../state/gameChecks';
import { appStore } from '../../state/store';
import { buildSpotChecks } from './spotcheck';
import styles from './SpotCheck.module.css';

/** The first zones are open; later ones fold away until you get there. */
const OPEN_ZONES = 3;

/** A list to take into the game: what the site says, to compare with what the game shows. */
export function SpotCheckPage() {
  const checks = useGameChecks();
  useEffect(() => {
    const { profiles } = appStore.getState();
    adoptProfileChecks(Object.values(profiles));
  }, []);
  const zones = useMemo(() => buildSpotChecks(gameData), []);
  const [copied, setCopied] = useState(false);

  const all = zones.flatMap((z) => z.groups.flatMap((g) => g.rows));
  const done = all.filter((r) => checks[r.key]).length;
  const bad = all.filter((r) => checks[r.key] === 'bad');

  const report = () => {
    const lines = all
      .filter((r) => checks[r.key])
      .map((r) => `${checks[r.key] === 'ok' ? 'OK' : 'DIFFERENT'} | ${r.key} | ${r.label} | site says: ${r.expect}`);
    void navigator.clipboard?.writeText(lines.join('\n')).then(() => setCopied(true));
  };

  return (
    <div>
      <h1>Check in game</h1>
      <Intro>
        <p>
          Almost everything on this site is read from the game files, but none of it has been seen working in game. Take
          this list in with you. For each line, look at the thing in game and press <strong>Matches</strong> or{' '}
          <strong>Different</strong>. This is about the site, not your character: each answer saves by itself on this device the moment you press, whichever profile you use, so there is no Save button. Press &quot;Copy my results&quot; and
          send them over, and the matching entries are marked as seen in game.
        </p>
      </Intro>

      <p className={styles.bar}>
        <strong>
          {done} of {all.length}
        </strong>{' '}
        checked, saved automatically on this device{bad.length > 0 && <span className={styles.badCount}> · {bad.length} different</span>}
        <button type="button" onClick={report} disabled={done === 0}>
          Copy my results
        </button>
        {copied && <span role="status"> Copied.</span>}
      </p>

      {zones.map((z, zi) => {
        const rows = z.groups.flatMap((g) => g.rows);
        const zoneDone = rows.filter((r) => checks[r.key]).length;
        return (
          <details key={z.zone} className={styles.zone} open={zi < OPEN_ZONES} data-zone={z.zone}>
            <summary>
              <span className={styles.zoneName}>{z.name}</span>
              <span className={styles.zoneCount}>
                {zoneDone} / {rows.length}
              </span>
            </summary>
            {z.groups.map((g) => (
              <section key={g.id} className={styles.group}>
                <h2>{g.title}</h2>
                <p className={styles.how}>{g.how}</p>
                <ul className={styles.rows}>
                  {g.rows.map((r) => {
                    const state = checks[r.key];
                    return (
                      <li key={r.key} className={styles.row} data-state={state}>
                        <span className={styles.what}>
                          <span>
                            <EntityLink id={r.id} />
                            <span className={styles.expect}>{r.expect}</span>
                          </span>
                        </span>
                        <span className={styles.answers}>
                          <button
                            type="button"
                            aria-pressed={state === 'ok'}
                            onClick={() => setGameCheck(r.key, 'ok')}
                          >
                            Matches
                          </button>
                          <button
                            type="button"
                            aria-pressed={state === 'bad'}
                            onClick={() => setGameCheck(r.key, 'bad')}
                          >
                            Different
                          </button>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </details>
        );
      })}
    </div>
  );
}
