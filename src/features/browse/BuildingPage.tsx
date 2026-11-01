import { useMemo } from 'react';
import { Intro } from '../../components/Intro';
import { Link, useSearchParams } from 'react-router';
import { EntityLink } from '../../components/EntityLink';
import { gameData } from '../../data/load';
import { lookup } from '../../data/lookup';
import { useAdvice } from '../advisor/useAdvice';
import { itemZoneOrder } from '../guides/guides';
import styles from '../items/Items.module.css';

const ITEM_ZONE = itemZoneOrder(lookup.allBiomes(), lookup.allItems(), gameData.recipes);

/** Building menu pieces whose whole cost is in the database. Filters live in the URL. */
export function BuildingPage() {
  const [params, setParams] = useSearchParams();
  const text = params.get('q') ?? '';
  const category = params.get('category') ?? '';
  const station = params.get('station') ?? '';
  const reached = useAdvice().openZone;
  const zoneName = lookup.allBiomes().find((b) => b.order === reached)?.name;
  const showAll = params.get('zone') === 'all';
  const filtered = Boolean(text || category || station);
  const limited = !filtered && !showAll;

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const all = lookup.allPieces();
  const categories = [...new Set(all.map((p) => p.category))];
  const stations = [...new Set(all.flatMap((p) => (p.station ? [p.station] : [])))];
  const rows = useMemo(() => {
    const t = text.trim().toLowerCase();
    return lookup
      .allPieces()
      .filter(
        (p) =>
          !limited || p.requirements.every((g) => (ITEM_ZONE.get(g.item) ?? Infinity) <= reached),
      )
      .filter((p) => !category || p.category === category)
      .filter((p) => !station || p.station === station)
      .filter((p) => !t || p.name.toLowerCase().includes(t));
  }, [text, category, station, limited, reached]);

  return (
    <section>
      <h1>Building</h1>
      <Intro>
        <p>
          What the Hammer can build, and what it costs. Only pieces whose materials are already in
          the database are listed, so more appear as zones are added. For comfort, use the{' '}
          <Link to="/comfort">comfort planner</Link>.
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
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          Needs
          <select value={station} onChange={(e) => set('station', e.target.value)}>
            <option value="">Anything</option>
            {stations.map((s) => (
              <option key={s} value={s}>
                {lookup.station(s)?.name ?? s}
              </option>
            ))}
          </select>
        </label>
        {(text || category || station) && (
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
        {rows.length} {rows.length === 1 ? 'piece' : 'pieces'}
        {limited && zoneName && (
          <>
            {' '}
            with materials up to {zoneName}.{' '}
            <button type="button" className={styles.linkButton} onClick={() => set('zone', 'all')}>
              Show all pieces
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
      {rows.length === 0 ? (
        <p className={styles.empty}>No pieces match these filters.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Piece</th>
                <th>Category</th>
                <th>Cost</th>
                <th>Station nearby</th>
                <th className={styles.hideOnMobile}>Comfort</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span className={styles.nameCell}>
                      <EntityLink id={p.id} />
                    </span>
                  </td>
                  <td>{p.category}</td>
                  <td>
                    <ul className={styles.inline}>
                      {p.requirements.map((g) => (
                        <li key={g.item}>
                          {g.qty} × <EntityLink id={g.item} />
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td>{p.station ? <EntityLink id={p.station} /> : '-'}</td>
                  <td className={styles.hideOnMobile}>
                    {p.comfort
                      ? `+${p.comfort}${p.comfortGroup ? ` · ${p.comfortGroup}` : ''}`
                      : '-'}
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
