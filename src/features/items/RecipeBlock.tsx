import { useState } from 'react';
import { EntityLink } from '../../components/EntityLink';
import type { Recipe } from '../../data/schemas';
import { requiredStationLevel } from '../../data/stationLevels';
import { FavoriteStar } from './ItemActions';
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
const KIND_VERB: Record<Recipe['kind'], string> = {
  craft: 'Makes',
  cook: 'Cooks into',
  smelt: 'Smelts into',
  ferment: 'Ferments into',
  other: 'Makes',
};

function duration(sec: number): string {
  return sec >= 120 ? `${Math.round(sec / 60)} min` : `${Math.round(sec)} s`;
}

export function RecipeBlock({ recipe }: { recipe: Recipe }) {
  const station = recipe.station;
  const [open, setOpen] = useState(true);
  return (
    <div className={styles.recipe}>
      <div className={styles.recipeHead}>
        <span>
          <button
            type="button"
            className={styles.recipeToggle}
            aria-expanded={open}
            aria-label={`${open ? 'Collapse' : 'Expand'} recipe for ${recipe.output.item}`}
            onClick={() => setOpen(!open)}
          >
            {open ? '▾' : '▸'}
          </button>
          <FavoriteStar kind="recipes" id={recipe.id} label={`recipe for ${recipe.output.item}`} />
          {KIND_VERB[recipe.kind]} {recipe.output.qty} × <EntityLink id={recipe.output.item} />
          {recipe.timeSec ? (
            <span className={styles.dim}> ({duration(recipe.timeSec)})</span>
          ) : null}
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
      {open && <Ingredients list={recipe.inputs} />}
      {open && recipe.upgrades.length > 0 && (
        <details>
          <summary>Upgrade costs</summary>
          <dl className={styles.upgrades}>
            {recipe.upgrades.map((u) => (
              <div key={u.quality}>
                <dt>
                  Quality {u.quality}
                  {station && (
                    <span className={styles.dim}>
                      {' '}
                      · level {requiredStationLevel(station.minLevel, u.quality)}
                    </span>
                  )}
                </dt>
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
