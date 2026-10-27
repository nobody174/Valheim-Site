import { EntityLink } from '../../components/EntityLink';
import type { Recipe } from '../../data/schemas';
import styles from './Items.module.css';

function Ingredients({ list }: { list: { item: string; qty: number }[] }) {
  return (
    <ul className={styles.inline}>
      {list.map((g) => (
        <li key={g.item}>
          {g.qty} × <EntityLink id={g.item} />
        </li>
      ))}
    </ul>
  );
}

/** Direct inputs, output, station and level, upgrade costs. The full graph is Phase 3. */
export function RecipeBlock({ recipe }: { recipe: Recipe }) {
  const station = recipe.station;
  return (
    <div className={styles.recipe}>
      <div className={styles.recipeHead}>
        <span>
          Makes {recipe.output.qty} × <EntityLink id={recipe.output.item} />
        </span>
        <span className={styles.dim}>
          {station ? (
            <>
              at <EntityLink id={station.id} />, level {station.minLevel}
            </>
          ) : (
            'no station needed'
          )}
        </span>
      </div>
      <Ingredients list={recipe.inputs} />
      {recipe.upgrades.length > 0 && (
        <details>
          <summary>Upgrade costs</summary>
          <dl className={styles.upgrades}>
            {recipe.upgrades.map((u) => (
              <div key={u.quality}>
                <dt>Quality {u.quality}</dt>
                <dd>
                  <Ingredients list={u.inputs} />
                </dd>
              </div>
            ))}
          </dl>
        </details>
      )}
    </div>
  );
}
