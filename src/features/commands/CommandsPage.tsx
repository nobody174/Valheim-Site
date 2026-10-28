import { useState } from 'react';
import { GuideTag } from '../../components/Badges';
import { commands } from '../../data/load';
import styles from '../items/Items.module.css';

/** The game's console commands, as written in the game's code, with a filter. */
export function CommandsPage() {
  const [query, setQuery] = useState('');
  const [onlyCheats, setOnlyCheats] = useState<'all' | 'plain' | 'cheat'>('all');
  const q = query.trim().toLowerCase();
  const shown = commands.filter(
    (c) =>
      (onlyCheats === 'all' || (onlyCheats === 'cheat') === c.cheat) &&
      (!q || c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)),
  );

  return (
    <div>
      <h1>Console commands</h1>
      <p>
        Press <kbd>F5</kbd> in game to open the console <GuideTag />. Commands marked <em>needs devcommands</em> only
        work after you type <code>devcommands</code> first. The game warns that using them is at your own risk, and
        a character that used cheats is marked as cheated. Prefer a separate test character.
      </p>
      <p>
        <label>
          Filter{' '}
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="spawn, skill, teleport ..."
          />
        </label>{' '}
        <label>
          Show{' '}
          <select value={onlyCheats} onChange={(e) => setOnlyCheats(e.target.value as typeof onlyCheats)}>
            <option value="all">all commands</option>
            <option value="plain">work without devcommands</option>
            <option value="cheat">need devcommands</option>
          </select>
        </label>{' '}
        <span>{shown.length} shown</span>
      </p>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Command</th>
              <th>What it does (the game&apos;s own text)</th>
              <th>Example</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((c) => (
              <tr key={c.name}>
                <td>
                  <code>{c.name}</code>
                  {c.cheat && <div className={styles.dimNote}>needs devcommands</div>}
                  {c.serverOnly && <div className={styles.dimNote}>host or server</div>}
                </td>
                <td>{c.description || 'No description in the game.'}</td>
                <td>
                  {c.example ? (
                    <>
                      <code>{c.example}</code> <GuideTag />
                    </>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {shown.length === 0 && <p className={styles.empty}>No command matches that.</p>}
    </div>
  );
}
