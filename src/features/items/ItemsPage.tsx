import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { EntityLink } from '../../components/EntityLink';
import { HOARD_OPTIONS, HoardBadge, VerifiedBadge } from '../../components/Badges';
import { lookup } from '../../data/lookup';
import { effectiveHoard } from '../../state/model';
import { useProfile } from '../../state/store';
import styles from './Items.module.css';

export const CATEGORY_LABELS: Record<string, string> = {
  weapon: 'Weapons',
  armor: 'Armor',
  tool: 'Tools',
  food: 'Food',
  mead: 'Meads',
  material: 'Materials',
  trophy: 'Trophies',
  trinket: 'Trinkets',
  piece: 'Building pieces',
  misc: 'Misc',
};

/** Filters live in the URL, so a filtered list can be linked to and survives a refresh. */
export function ItemsPage() {
  const profile = useProfile();
  const [params, setParams] = useSearchParams();
  const text = params.get('q') ?? '';
  const hoard = params.get('hoard') ?? '';
  const biome = params.get('biome') ?? '';
  const category = params.get('category') ?? '';

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const rows = useMemo(() => {
    const t = text.trim().toLowerCase();
    return lookup
      .allItems()
      .filter((i) => !hoard || effectiveHoard(i, profile) === hoard)
      .filter((i) => !biome || i.biome === biome)
      .filter((i) => !category || i.category === category)
      .filter((i) => !t || i.name.toLowerCase().includes(t))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [hoard, biome, category, text, profile]);

  const filtered = Boolean(text || hoard || biome || category);
  const present = [...new Set(lookup.allItems().map((i) => i.category))];

  return (
    <section>
      <h1>Items</h1>
      <p className={styles.lead}>
        Everything in the database. Use the hoard filter to see what to keep and what you can safely
        throw away.
      </p>
      <div className={styles.filters}>
        <label>
          Name
          <input
            type="search"
            value={text}
            onChange={(e) => set('q', e.target.value)}
            placeholder="Filter by name"
          />
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
          Hoard
          <select value={hoard} onChange={(e) => set('hoard', e.target.value)}>
            <option value="">All</option>
            {HOARD_OPTIONS.map(([value, name]) => (
              <option key={value} value={value}>
                {name}
              </option>
            ))}
          </select>
        </label>
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
        <p className={styles.empty}>No items match these filters.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Biome</th>
                <th>Hoard</th>
                <th className={styles.hideOnMobile}>Data</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => (
                <tr key={i.id}>
                  <td>
                    <EntityLink id={i.id} />
                  </td>
                  <td>{CATEGORY_LABELS[i.category] ?? i.category}</td>
                  <td>{lookup.biomeName(i.biome) ?? '-'}</td>
                  <td>
                    <HoardBadge
                      hoard={effectiveHoard(i, profile)}
                      qty={i.recommendedQty}
                      custom={i.id in profile.hoardOverrides}
                    />
                  </td>
                  <td className={styles.hideOnMobile}>
                    <VerifiedBadge level={i.verified} note={i.note} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
