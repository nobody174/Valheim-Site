import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { EntityIcon } from '../../components/EntityIcon';
import { EntityLink } from '../../components/EntityLink';
import { lookup } from '../../data/lookup';
import { armorRows } from '../rankings/armorRanking';
import { weaponRows } from '../rankings/weaponRanking';
import styles from '../items/Items.module.css';
import { compare } from './compare';

const MAX = 4;

/** Two to four weapons, or two to four armor pieces, side by side. The ids live in the URL. */
export function ComparePage() {
  const [params, setParams] = useSearchParams();
  const [text, setText] = useState('');
  const level = Math.max(1, Math.min(5, Number(params.get('level')) || 1));
  const wanted = (params.get('items') ?? '').split(',').filter(Boolean);
  const result = compare(wanted, level);
  const ids = result?.ids ?? [];

  const choices = [...weaponRows(level), ...armorRows(level)]
    .map((r) => ({ id: r.id, name: r.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const set = (next: string[], lvl = level) => {
    const p = new URLSearchParams();
    if (next.length) p.set('items', next.join(','));
    if (lvl > 1) p.set('level', String(lvl));
    setParams(p, { replace: true });
  };

  const onAdd = () => {
    const t = text.trim().toLowerCase();
    const hit = choices.find((c) => c.name.toLowerCase() === t || c.id.toLowerCase() === t);
    if (!hit || ids.includes(hit.id) || ids.length >= MAX) return;
    set([...ids, hit.id]);
    setText('');
  };

  return (
    <section>
      <h1>Compare</h1>
      <p className={styles.lead}>
        Put two to four weapons, or two to four armor pieces, side by side. The best value in each row is
        marked. Numbers are the same as on the Rankings page.
      </p>
      <div className={styles.filters}>
        <label>
          Add an item
          <input
            list="compare-items"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onAdd()}
            placeholder="Type a weapon or armor name"
          />
          <datalist id="compare-items">
            {choices.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </label>
        <label>
          Upgrade level
          <select value={level} onChange={(e) => set(ids, Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className={styles.reset} onClick={onAdd} disabled={ids.length >= MAX}>
          Add
        </button>
        {ids.length > 0 && (
          <button type="button" className={styles.reset} onClick={() => set([])}>
            Clear
          </button>
        )}
      </div>

      {!result || ids.length === 0 ? (
        <p className={styles.empty}>
          Nothing to compare yet. Add a weapon or armor piece, or press Compare on an item page.
        </p>
      ) : (
        <>
          {ids.length < 2 && <p className={styles.dim}>Add one more item to compare.</p>}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th />
                  {ids.map((id) => (
                    <th key={id}>
                      <span className={styles.nameCell}>
                        <EntityIcon id={id} size={28} />
                        <EntityLink id={id} />
                      </span>{' '}
                      <button
                        type="button"
                        className={styles.reset}
                        aria-label={`Remove ${lookup.item(id)?.name ?? id}`}
                        onClick={() => set(ids.filter((x) => x !== id))}
                      >
                        ✕
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((r) => (
                  <tr key={r.label}>
                    <th scope="row">{r.label}</th>
                    {r.values.map((v, i) => (
                      <td key={ids[i]}>{r.best === i ? <strong>{v} ★</strong> : (v ?? '-')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={styles.dim}>★ marks the best value in the row. Weight and item counts: lower is better.</p>
        </>
      )}
    </section>
  );
}
