import { confirmedChecks, gameData } from '../../data/load';
import { setGameCheck, useGameChecks } from '../../state/gameChecks';
import items from '../items/Items.module.css';
import { rowsForEntity, rowStatus, type CheckRow } from './spotcheck';
import styles from './SpotCheck.module.css';

const KIND: Record<string, string> = {
  gear: 'Stats',
  recipe: 'Recipe',
  food: 'Food numbers',
  creature: 'Drops',
  boss: 'Altar and drops',
  where: 'Where to find it',
};

const kindOf = (row: CheckRow) => KIND[row.key.split(':')[0] ?? ''] ?? 'Line';

/**
 * On an item, creature or boss page: what the site says about it, with a one-tap Matches or Different
 * to record what the game showed. Answers are kept for the whole browser, not per profile. Lines that
 * were already seen in game show as done.
 */
export function GameCheckPanel({ id }: { id: string }) {
  const answers = useGameChecks();
  const rows = rowsForEntity(gameData, id);
  if (rows.length === 0) return null;
  const todo = rows.filter((r) => rowStatus(r, confirmedChecks) !== 'confirmed');

  return (
    <details className={items.section}>
      <summary>
        Check this in game
        {todo.length === 0 ? ' · all seen' : ` · ${todo.length} to check`}
      </summary>
      <ul className={styles.rows}>
        {rows.map((r) => {
          const status = rowStatus(r, confirmedChecks);
          const state = answers[r.key];
          return (
            <li key={r.key} className={styles.row} data-state={status === 'confirmed' ? 'ok' : state}>
              <span className={styles.what}>
                <span>
                  <strong>{kindOf(r)}</strong>
                  <span className={styles.expect}>{r.expect}</span>
                  {status === 'changed' && (
                    <span className={styles.expect}>This line changed since it was seen in game; check it again.</span>
                  )}
                </span>
              </span>
              {status === 'confirmed' ? (
                <span className={styles.expect}>Seen in game</span>
              ) : (
                <span className={styles.answers}>
                  <button type="button" aria-pressed={state === 'ok'} onClick={() => setGameCheck(r.key, 'ok')}>
                    Matches
                  </button>
                  <button type="button" aria-pressed={state === 'bad'} onClick={() => setGameCheck(r.key, 'bad')}>
                    Different
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </details>
  );
}
