import { useMemo } from 'react';
import { Intro } from '../../components/Intro';
import { useSearchParams } from 'react-router';
import { EntityLink } from '../../components/EntityLink';
import { HOARD_OPTIONS, HoardBadge, VerifiedBadge } from '../../components/Badges';
import { gameData } from '../../data/load';
import { lookup } from '../../data/lookup';
import { effectiveHoard } from '../../state/model';
import { useProfile } from '../../state/store';
import { EntityIcon } from '../../components/EntityIcon';
import { QuickSummary } from '../../components/QuickCard';
import { summaryLine } from '../../data/quick';
import cards from '../../components/Cards.module.css';
import { useListView, ViewToggle } from '../../components/ViewToggle';
import { useAdvice } from '../advisor/useAdvice';
import { itemZoneOrder } from '../guides/guides';
import styles from './Items.module.css';

const ITEM_ZONE = itemZoneOrder(lookup.allBiomes(), lookup.allItems(), gameData.recipes);

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
  const [view, setView] = useListView();
  const [params, setParams] = useSearchParams();
  const text = params.get('q') ?? '';
  const hoard = params.get('hoard') ?? '';
  const biome = params.get('biome') ?? '';
  const category = params.get('category') ?? '';
  // With no filter set the list opens on what the zones reached so far can give; any filter shows everything.
  const reached = useAdvice().openZone;
  const zoneName = lookup.allBiomes().find((b) => b.order === reached)?.name;
  const showAll = params.get('zone') === 'all';

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const rows = useMemo(() => {
    const t = text.trim().toLowerCase();
    const narrow = Boolean(text || hoard || biome || category) || showAll;
    return lookup
      .allItems()
      .filter((i) => !hoard || effectiveHoard(i, profile) === hoard)
      .filter((i) => !biome || i.biome === biome)
      .filter((i) => !category || i.category === category)
      .filter((i) => narrow || (ITEM_ZONE.get(i.id) ?? Infinity) <= reached)
      .filter((i) => !t || i.name.toLowerCase().includes(t))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [hoard, biome, category, text, profile, reached, showAll]);

  const filtered = Boolean(text || hoard || biome || category);
  const limited = !filtered && !showAll;
  const present = [...new Set(lookup.allItems().map((i) => i.category))];

  return (
    <section>
      <h1>Items</h1>
      <Intro>
        <p>
          Everything in the database. Use the hoard filter to see what to keep and what you can
          safely throw away.
        </p>
      </Intro>
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
      <div className={cards.top}>
        <ViewToggle view={view} onChange={setView} />
        <p className={styles.dim} aria-live="polite">
          {rows.length} {rows.length === 1 ? 'item' : 'items'}
          {limited && zoneName && (
            <>
              {' '}
              found or made up to {zoneName}.{' '}
              <button type="button" className={styles.linkButton} onClick={() => set('zone', 'all')}>
                Show all items
              </button>
            </>
          )}
          {showAll && !filtered && (
            <>
              {' '}
              <button type="button" className={styles.linkButton} onClick={() => set('zone', '')}>
                Only up to my zone
              </button>
            </>
          )}
        </p>
      </div>
      {rows.length === 0 ? (
        <p className={styles.empty}>No items match these filters.</p>
      ) : view === 'cards' ? (
        <ul className={cards.grid}>
          {rows.map((i) => (
            <li key={i.id} className={cards.card} data-zone={i.biome ?? undefined}>
              <span className={cards.art}>
                <EntityIcon id={i.id} size={42} />
              </span>
              <div className={cards.body}>
                <h2 className={cards.name}>
                  <EntityLink id={i.id} />
                </h2>
                <span className={cards.meta}>
                  {CATEGORY_LABELS[i.category] ?? i.category}
                  {i.biome && (
                    <>
                      {' '}
                      · <span className={cards.zone}>{lookup.biomeName(i.biome)}</span>
                    </>
                  )}
                </span>
                <QuickSummary line={summaryLine(i.id)} />
                <span className={cards.pills}>
                  <HoardBadge
                    hoard={effectiveHoard(i, profile)}
                    qty={i.recommendedQty}
                    custom={i.id in profile.hoardOverrides}
                  />
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Biome</th>
                <th>Hoard</th>
                <th className={styles.hideOnMobile}>Farm / used for</th>
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
                  <td className={`${styles.hideOnMobile} ${styles.summaryCell}`}>
                    <QuickSummary line={summaryLine(i.id)} />
                  </td>
                  <td className={styles.hideOnMobile}>
                    {i.verified !== 'cross-checked' && <VerifiedBadge level={i.verified} note={i.note} />}
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
