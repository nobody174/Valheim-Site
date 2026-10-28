import { useMemo } from 'react';
import { Intro } from '../../components/Intro';
import { useSearchParams } from 'react-router';
import { EntityLink } from '../../components/EntityLink';
import { lookup } from '../../data/lookup';
import type { Recipe } from '../../data/schemas';
import { RecipeBlock } from './RecipeBlock';
import styles from './Items.module.css';

const NO_STATION = '_none';

function stationLabel(id: string): string {
  return id === NO_STATION ? 'No station (hand-crafted)' : (lookup.station(id)?.name ?? id);
}

/** All recipes, grouped by crafting station, searchable by output or ingredient name. */
export function RecipesPage() {
  const [params, setParams] = useSearchParams();
  const text = params.get('q') ?? '';
  const station = params.get('station') ?? '';

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const groups = useMemo(() => {
    const t = text.trim().toLowerCase();
    const nameOf = (id: string) => (lookup.item(id)?.name ?? id).toLowerCase();
    const match = (r: Recipe) =>
      !t || nameOf(r.output.item).includes(t) || r.inputs.some((i) => nameOf(i.item).includes(t));
    const byStation = new Map<string, Recipe[]>();
    for (const r of lookup.allRecipes()) {
      const key = r.station?.id ?? NO_STATION;
      if ((station && key !== station) || !match(r)) continue;
      byStation.set(key, [...(byStation.get(key) ?? []), r]);
    }
    return [...byStation.entries()]
      .map(([id, recipes]) => ({
        id,
        label: stationLabel(id),
        recipes: recipes.sort((a, b) => nameOf(a.output.item).localeCompare(nameOf(b.output.item))),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [text, station]);

  const total = groups.reduce((n, g) => n + g.recipes.length, 0);
  const stationIds = [...new Set(lookup.allRecipes().map((r) => r.station?.id ?? NO_STATION))].sort(
    (a, b) => stationLabel(a).localeCompare(stationLabel(b)),
  );

  return (
    <section>
      <h1>Recipes</h1>
      <Intro>
        <p>
        What you can make, grouped by where you make it. Search by what you want or by an ingredient
        you have.
        </p>
      </Intro>
      <div className={styles.filters}>
        <label>
          Search
          <input
            type="search"
            value={text}
            onChange={(e) => set('q', e.target.value)}
            placeholder="e.g. sword, bronze, leather"
          />
        </label>
        <label>
          Station
          <select value={station} onChange={(e) => set('station', e.target.value)}>
            <option value="">All stations</option>
            {stationIds.map((id) => (
              <option key={id} value={id}>
                {stationLabel(id)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className={styles.dim} aria-live="polite">
        {total} {total === 1 ? 'recipe' : 'recipes'}
      </p>
      {groups.length === 0 && (
        <p className={styles.empty}>No recipes match. Try a shorter search.</p>
      )}
      {groups.map((g) => (
        <section key={g.id} className={styles.section}>
          <h2>
            {g.id === NO_STATION ? g.label : <EntityLink id={g.id} />}{' '}
            <span className={styles.count}>{g.recipes.length}</span>
          </h2>
          <div className={styles.recipeGrid}>
            {g.recipes.map((r) => (
              <RecipeBlock key={r.id} recipe={r} />
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}
