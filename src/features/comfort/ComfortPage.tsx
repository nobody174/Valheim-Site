import { useState } from 'react';
import { GuideTag } from '../../components/Badges';
import { EntityLink } from '../../components/EntityLink';
import { Intro } from '../../components/Intro';
import { COMFORT_RULES, COMFORT_UNCHECKED, comfortGroups, comfortTotal } from '../../data/comfort';
import { lookup } from '../../data/lookup';
import styles from './Comfort.module.css';

/** Tick the groups you have a piece for; the total counts one piece per group. */
export function ComfortPage() {
  const groups = comfortGroups();
  const [picks, setPicks] = useState<Record<string, string | undefined>>({});
  const total = comfortTotal(picks);
  const ticked = groups.filter((g) => g.pieces.some((p) => p.id === picks[g.name])).length;
  const possible = groups.reduce((sum, g) => sum + (g.best.comfort ?? 0), 0);

  const toggle = (name: string, bestId: string) =>
    setPicks((p) => ({ ...p, [name]: p[name] ? undefined : bestId }));

  return (
    <section>
      <h1>Comfort planner</h1>
      <Intro>
        <p>
          Comfort decides how big your Rested bonus is. Tick a group when your room has a piece from
          it and the total adds up the strongest piece of each ticked group.
        </p>
      </Intro>
      <ul className={styles.rules}>
        {COMFORT_RULES.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <p className={styles.unchecked}>
        <GuideTag /> {COMFORT_UNCHECKED.join(' ')} Check your own number in game.
      </p>

      <p className={styles.total} aria-live="polite">
        <strong>{total}</strong> comfort from {ticked} of {groups.length} groups
        <span className={styles.dim}> (every group with its best piece: {possible})</span>
      </p>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Have it</th>
              <th>Group</th>
              <th>Best piece</th>
              <th>Comfort</th>
              <th>Made near</th>
              <th>Materials</th>
              <th>Piece I have</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => {
              const chosen = g.pieces.find((p) => p.id === picks[g.name]);
              return (
                <tr key={g.name}>
                  <td>
                    <label className={styles.tick}>
                      <input
                        type="checkbox"
                        aria-label={`I have a ${g.name} piece`}
                        checked={Boolean(chosen)}
                        onChange={() => toggle(g.name, g.best.id)}
                      />
                    </label>
                  </td>
                  <td>{g.name}</td>
                  <td>
                    <span className={styles.nameCell}>
                      <EntityLink id={g.best.id} />
                    </span>
                  </td>
                  <td>+{g.best.comfort}</td>
                  <td>{g.best.station ? <EntityLink id={g.best.station} /> : 'Anywhere'}</td>
                  <td>
                    <ul className={styles.inline}>
                      {g.best.requirements.map((r) => (
                        <li key={r.item}>
                          {r.qty} × <EntityLink id={r.item} />
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td>
                    <select
                      aria-label={`Which ${g.name} piece I have`}
                      value={chosen?.id ?? ''}
                      onChange={(e) =>
                        setPicks((p) => ({ ...p, [g.name]: e.target.value || undefined }))
                      }
                    >
                      <option value="">None</option>
                      {g.pieces.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (+{p.comfort})
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className={styles.dim}>
        {lookup.allPieces().filter((p) => p.comfort).length} pieces with a comfort value are in the
        data. Some, such as the carved furniture and jute curtains, are missing until the items they
        need are added.
      </p>
    </section>
  );
}
