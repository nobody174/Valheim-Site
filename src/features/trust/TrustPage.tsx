import { Link } from 'react-router';
import { EntityLink } from '../../components/EntityLink';
import { gameData } from '../../data/load';
import { useGameChecks } from '../../state/gameChecks';
import { trustReport } from './trust';
import styles from '../items/Items.module.css';
import tiles from './Trust.module.css';

const report = trustReport(gameData);
const pct = (n: number, of: number) => (of === 0 ? '0%' : `${Math.round((n / of) * 100)}%`);

/** The honesty page: how much of the data has been checked, and what is still a guess. */
export function TrustPage() {
  const { overall, zones, unverified } = report;
  const mine = Object.values(useGameChecks());
  const matched = mine.filter((v) => v === 'ok').length;
  const different = mine.length - matched;
  return (
    <div>
      <h1>Data trust</h1>
      <p>
        Nearly everything here is read from the game&apos;s own files, which is accurate but is not the same as seeing
        it work in game. This page says how much is checked and what is still a guess.
      </p>

      <div className={tiles.tiles}>
        <div className={tiles.tile}>
          <strong>{overall.inGame}</strong>
          <span>seen in game</span>
        </div>
        <div className={tiles.tile}>
          <strong>{overall.fromFiles}</strong>
          <span>read from the game files</span>
        </div>
        <div className={tiles.tile}>
          <strong>{overall.unverified}</strong>
          <span>written by hand, not checked</span>
        </div>
        <div className={tiles.tile}>
          <strong>{overall.total}</strong>
          <span>entries in all</span>
        </div>
      </div>

      <h2>By zone</h2>
      <div className={styles.tableWrap} tabIndex={0} role="region" aria-label="Checked entries by zone">
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Zone</th>
              <th>Entries</th>
              <th>From game files</th>
              <th>Not checked</th>
              <th>Seen in game</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((z) => (
              <tr key={z.id}>
                <td>{z.name}</td>
                <td>{z.total}</td>
                <td>
                  {z.fromFiles} <span className={styles.dimNote}>{pct(z.fromFiles, z.total)}</span>
                </td>
                <td>{z.unverified}</td>
                <td>{z.inGame}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>What is still a guess, and why</h2>
      {unverified.map((g) => (
        <details key={g.reason} className={tiles.group}>
          <summary>
            <strong>{g.entries.length}</strong> {g.reason}
          </summary>
          <p>
            {g.entries.map((e, i) => (
              <span key={e.id}>
                {i > 0 && ', '}
                <EntityLink id={e.id} />
              </span>
            ))}
          </p>
        </details>
      ))}

      <h2>Help check it</h2>
      <p>
        Take the <Link to="/spotcheck">Check in game</Link> list into the game and mark what matches. Entries that are
        confirmed move to &quot;seen in game&quot; here.
      </p>
      {mine.length > 0 && (
        <p>
          So far on this device: <strong>{matched}</strong> matched the game
          {different > 0 && <>, <strong>{different}</strong> were different</>}. They count here for good once you send
          them over with &quot;Copy my results&quot;.
        </p>
      )}
    </div>
  );
}
