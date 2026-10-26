import { useMemo, useState } from 'react';
import { EntityLink } from '../../components/EntityLink';
import { HOARD_OPTIONS, HoardBadge, VerifiedBadge } from '../../components/Badges';
import { lookup } from '../../data/lookup';
import type { Item } from '../../data/schemas';
import styles from './Items.module.css';

export function ItemsPage() {
  const [hoard, setHoard] = useState<'' | Item['hoard']>('');
  const [biome, setBiome] = useState('');
  const [text, setText] = useState('');

  const rows = useMemo(() => {
    const t = text.trim().toLowerCase();
    return lookup
      .allItems()
      .filter((i) => (!hoard || i.hoard === hoard) && (!biome || i.biome === biome))
      .filter((i) => !t || i.name.toLowerCase().includes(t))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [hoard, biome, text]);

  return (
    <section>
      <h1>Items</h1>
      <div className={styles.filters}>
        <label>
          Name
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Filter by name"
          />
        </label>
        <label>
          Hoard
          <select value={hoard} onChange={(e) => setHoard(e.target.value as '' | Item['hoard'])}>
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
          <select value={biome} onChange={(e) => setBiome(e.target.value)}>
            <option value="">All</option>
            {lookup.allBiomes().map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className={styles.dim} aria-live="polite">
        {rows.length} items
      </p>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Biome</th>
              <th>Hoard</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((i) => (
              <tr key={i.id}>
                <td>
                  <EntityLink id={i.id} />
                </td>
                <td>{i.category}</td>
                <td>{lookup.biomeName(i.biome) ?? '-'}</td>
                <td>
                  <HoardBadge hoard={i.hoard} qty={i.recommendedQty} />
                </td>
                <td>
                  <VerifiedBadge level={i.verified} note={i.note} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
