import { useMemo } from 'react';
import { Intro } from '../../components/Intro';
import { useSearchParams } from 'react-router';
import { EntityLink } from '../../components/EntityLink';
import { graph, lookup } from '../../data/lookup';
import { CATEGORY_LABELS } from '../items/ItemsPage';
import { hasFlag, PROGRESS_FLAGS, type ProgressFlag } from '../../state/model';
import { useApp, useProfile } from '../../state/store';
import styles from '../items/Items.module.css';

const FLAG_LABEL: Record<ProgressFlag, string> = {
  collected: 'Collected',
  crafted: 'Crafted',
  completed: 'Completed',
  farmed: 'Farmed',
};

/** "any", or "<flag>:yes" / "<flag>:no" */
function matchesStatus(status: string, has: (flag: ProgressFlag) => boolean): boolean {
  if (!status) return true;
  const [flag, want] = status.split(':') as [ProgressFlag, string];
  return has(flag) === (want === 'yes');
}

export function ChecklistPage() {
  const profile = useProfile();
  const toggle = useApp((s) => s.toggleFlag);
  const [params, setParams] = useSearchParams();
  const biome = params.get('biome') ?? '';
  const category = params.get('category') ?? '';
  const status = params.get('status') ?? '';

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const items = lookup.allItems();
  const craftable = useMemo(
    () => new Set(items.filter((i) => graph.recipesFor(i.id).length > 0).map((i) => i.id)),
    [items],
  );

  const bars = lookup.allBiomes().map((b) => {
    const inBiome = items.filter((i) => i.biome === b.id);
    const count = (flag: ProgressFlag, pool = inBiome) =>
      pool.filter((i) => hasFlag(profile, i.id, flag)).length;
    return {
      biome: b,
      total: inBiome.length,
      collected: count('collected'),
      crafted: count('crafted'),
      craftableTotal: inBiome.filter((i) => craftable.has(i.id)).length,
      completed: count('completed'),
      farmed: count('farmed'),
    };
  });

  const rows = items
    .filter((i) => !biome || i.biome === biome)
    .filter((i) => !category || i.category === category)
    .filter((i) => matchesStatus(status, (f) => hasFlag(profile, i.id, f)))
    .sort((a, b) => a.name.localeCompare(b.name));

  const present = [...new Set(items.map((i) => i.category))];
  const filtered = Boolean(biome || category || status);

  return (
    <section>
      <h1>Checklist</h1>
      <Intro>
        <p>
        Tick items off as you go. Progress is saved in this browser for the active profile (
        <strong>{profile.name}</strong>).
        </p>
      </Intro>

      <p className={styles.dim}>
        <strong>Collected</strong>: you have found it. <strong>Crafted</strong>: you have made it.{' '}
        <strong>Completed</strong>: you are done with it. <strong>Farmed</strong>: you have enough
        stocked up.
      </p>

      <div className={styles.bars}>
        {bars.map((b) => (
          <div key={b.biome.id}>
            <div className={styles.barMeta}>
              <strong>{b.biome.name}</strong>
              <span>
                {b.collected}/{b.total} collected
              </span>
            </div>
            <div
              className={styles.bar}
              role="progressbar"
              aria-label={`${b.biome.name} collected`}
              aria-valuemin={0}
              aria-valuemax={b.total}
              aria-valuenow={b.collected}
            >
              <div
                className={styles.barFill}
                style={{ width: `${b.total ? (b.collected / b.total) * 100 : 0}%` }}
              />
            </div>
            <div className={styles.barMeta}>
              <span>
                Crafted {b.crafted}/{b.craftableTotal}
              </span>
              <span>
                Completed {b.completed}/{b.total}
              </span>
              <span>
                Farmed {b.farmed}/{b.total}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.filters}>
        <label>
          Biome
          <select value={biome} onChange={(e) => set('biome', e.target.value)}>
            <option value="">All</option>
            {lookup.allBiomes().map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Category
          <select value={category} onChange={(e) => set('category', e.target.value)}>
            <option value="">All</option>
            {present.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c] ?? c}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={status} onChange={(e) => set('status', e.target.value)}>
            <option value="">Any</option>
            {PROGRESS_FLAGS.flatMap((f) => [
              <option key={`${f}:no`} value={`${f}:no`}>
                Not {FLAG_LABEL[f].toLowerCase()}
              </option>,
              <option key={`${f}:yes`} value={`${f}:yes`}>
                {FLAG_LABEL[f]}
              </option>,
            ])}
          </select>
        </label>
        {filtered && (
          <button
            type="button"
            className={styles.reset}
            onClick={() => setParams({}, { replace: true })}
          >
            Clear filters
          </button>
        )}
      </div>
      <p className={styles.dim} aria-live="polite">
        {rows.length} {rows.length === 1 ? 'item' : 'items'}
      </p>

      {rows.length === 0 ? (
        <p className={styles.empty}>Nothing matches these filters.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Item</th>
                {PROGRESS_FLAGS.map((f) => (
                  <th key={f} className={styles.checkCell}>
                    {FLAG_LABEL[f]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => (
                <tr key={i.id}>
                  <td>
                    <EntityLink id={i.id} />
                  </td>
                  {PROGRESS_FLAGS.map((f) => (
                    <td key={f} className={styles.checkCell}>
                      <label className={styles.checkTap}>
                        <input
                          type="checkbox"
                          checked={hasFlag(profile, i.id, f)}
                          aria-label={`${FLAG_LABEL[f]}: ${i.name}`}
                          onChange={() => toggle(i.id, f)}
                        />
                      </label>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
