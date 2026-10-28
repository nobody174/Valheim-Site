import { EntityLink } from '../../components/EntityLink';
import { gameData } from '../../data/load';
import { trustReport } from './trust';
import styles from '../items/Items.module.css';
import tiles from './Trust.module.css';

const report = trustReport(gameData);
const pct = (n: number, of: number) => (of === 0 ? '0%' : `${Math.round((n / of) * 100)}%`);

/** The honesty page: how much of the data has been checked, and what is still a guess. */
export function TrustPage() {
  const { overall, zones, unverified } = report;
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
        The list of entries most worth checking is the &quot;Spot-check list&quot; in <code>docs/DATA_SOURCES.md</code>{' '}
        in the repository. When one is seen working in game, it moves to &quot;seen in game&quot; here.
      </p>
    </div>
  );
}
