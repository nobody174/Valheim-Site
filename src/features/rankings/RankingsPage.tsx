import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { EntityLink } from '../../components/EntityLink';
import { lookup } from '../../data/lookup';
import { AMMO_GROUP } from '../../data/weaponStats';
import itemStyles from '../items/Items.module.css';
import {
  defaultDir,
  filterAndSort,
  groupByZone,
  SORT_KEYS,
  topQuality,
  weaponGroups,
  weaponRows,
  type SortDir,
  type SortKey,
  type WeaponRow,
} from './weaponRanking';
import styles from './Rankings.module.css';

const label = (k: string) => k.charAt(0).toUpperCase() + k.slice(1);
const num = (n: number) => String(Math.round(n * 100) / 100);

const COLUMNS: { key: SortKey | null; text: string; mobile: boolean }[] = [
  { key: null, text: '#', mobile: true },
  { key: 'name', text: 'Weapon', mobile: true },
  { key: 'zone', text: 'Zone', mobile: true },
  { key: 'damage', text: 'Damage', mobile: true },
  { key: null, text: 'Type of damage', mobile: false },
  { key: 'knockback', text: 'Knockback', mobile: false },
  { key: 'durability', text: 'Durability', mobile: false },
];

function oneOf<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return allowed.find((a) => a === value) ?? fallback;
}

function WeaponTable({
  rows,
  sort,
  dir,
  onSort,
}: {
  rows: WeaponRow[];
  sort: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  return (
    <div className={itemStyles.tableWrap}>
      <table className={itemStyles.table}>
        <thead>
          <tr>
            {COLUMNS.map((c) => (
              <th
                key={c.text}
                className={c.mobile ? undefined : itemStyles.hideOnMobile}
                aria-sort={
                  c.key && c.key === sort ? (dir === 'asc' ? 'ascending' : 'descending') : undefined
                }
              >
                {c.key ? (
                  <button type="button" className={styles.sortButton} onClick={() => onSort(c.key!)}>
                    {c.text}
                    {c.key === sort && <span aria-hidden="true">{dir === 'asc' ? ' ▲' : ' ▼'}</span>}
                  </button>
                ) : (
                  c.text
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id}>
              <td className={styles.rank}>{i + 1}</td>
              <td>
                <EntityLink id={r.id} />
                <div className={styles.kind}>{r.group}</div>
              </td>
              <td>{r.zoneName}</td>
              <td className={styles.damage}>{num(r.total)}</td>
              <td className={itemStyles.hideOnMobile}>
                {Object.entries(r.damage)
                  .map(([k, v]) => `${label(k)} ${num(v)}`)
                  .join(', ')}
              </td>
              <td className={itemStyles.hideOnMobile}>{r.knockback ?? '-'}</td>
              <td className={itemStyles.hideOnMobile}>{r.durability ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Which weapon is best, next best, and so on. Filters live in the URL so a view can be linked.
 * Numbers are raw damage per hit from the game files; attack speed is not in the data yet, so this
 * is not DPS.
 */
export function RankingsPage() {
  const [params, setParams] = useSearchParams();
  const zone = params.get('zone') ?? '';
  const upTo = params.get('exact') !== '1';
  const group = params.get('type') ?? '';
  const text = params.get('q') ?? '';
  const view = oneOf(params.get('view'), ['list', 'zones'] as const, 'list');
  const sort = oneOf(params.get('sort'), SORT_KEYS, 'damage');
  const dir = oneOf(params.get('dir'), ['asc', 'desc'] as const, defaultDir(sort));
  const top = topQuality();
  const quality = Math.min(top, Math.max(1, Number(params.get('level')) || 1));

  const set = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next, { replace: true });
  };

  const onSort = (key: SortKey) =>
    set({
      sort: key === 'damage' ? '' : key,
      dir: key === sort ? (dir === 'asc' ? 'desc' : 'asc') : '',
    });

  const rows = useMemo(
    () => filterAndSort(weaponRows(quality), { group, zone, upTo, text, sort, dir }),
    [quality, group, zone, upTo, text, sort, dir],
  );
  const groups = view === 'zones' ? groupByZone(rows) : [];
  const filtered = Boolean(zone || group || text || quality > 1);
  const zoneName = lookup.biomeName(zone || null);

  return (
    <section>
      <h1>Weapon rankings</h1>
      <p className={itemStyles.lead}>
        The strongest weapons first. Pick the zone you are in to see the best weapon you can have
        there.
      </p>
      <p className={itemStyles.dim}>
        Damage is what one hit deals, added up over all damage types, straight from the game files.
        It is not damage per second: attack speed is not in the data yet.
      </p>
      <div className={itemStyles.filters}>
        <label>
          Zone
          <select value={zone} onChange={(e) => set({ zone: e.target.value })}>
            <option value="">All zones</option>
            {lookup.allBiomes().map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Type
          <select value={group} onChange={(e) => set({ type: e.target.value })}>
            <option value="">All weapons</option>
            {weaponGroups()
              .filter((g) => g !== AMMO_GROUP)
              .map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            {weaponGroups().includes(AMMO_GROUP) && <option value={AMMO_GROUP}>{AMMO_GROUP}</option>}
          </select>
        </label>
        <label>
          Upgrade level
          <select value={quality} onChange={(e) => set({ level: e.target.value === '1' ? '' : e.target.value })}>
            {Array.from({ length: top }, (_, i) => i + 1).map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </label>
        <label>
          Show
          <select value={view} onChange={(e) => set({ view: e.target.value === 'list' ? '' : e.target.value })}>
            <option value="list">One list</option>
            <option value="zones">Best in each zone</option>
          </select>
        </label>
        <label>
          Name
          <input
            type="search"
            value={text}
            onChange={(e) => set({ q: e.target.value })}
            placeholder="Filter by name"
          />
        </label>
        {filtered && (
          <button
            type="button"
            className={itemStyles.reset}
            onClick={() => setParams({}, { replace: true })}
          >
            Clear filters
          </button>
        )}
      </div>
      {zone && (
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={upTo}
            onChange={(e) => set({ exact: e.target.checked ? '' : '1' })}
          />
          Include earlier zones (everything you can have by {zoneName})
        </label>
      )}
      <p className={itemStyles.dim} aria-live="polite">
        {rows.length} {rows.length === 1 ? 'weapon' : 'weapons'}
        {quality > 1 && `, at upgrade level ${quality} (items that cannot reach it show their maximum)`}
      </p>
      {rows.length === 0 && <p className={itemStyles.empty}>No weapons match these filters.</p>}
      {view === 'list' && rows.length > 0 && (
        <WeaponTable rows={rows} sort={sort} dir={dir} onSort={onSort} />
      )}
      {view === 'zones' &&
        groups.map((g) => (
          <section key={g.zoneId ?? 'none'} className={itemStyles.section}>
            <h2>
              {g.zoneName} <span className={itemStyles.count}>{g.rows.length}</span>
            </h2>
            <WeaponTable rows={g.rows} sort={sort} dir={dir} onSort={onSort} />
          </section>
        ))}
    </section>
  );
}
