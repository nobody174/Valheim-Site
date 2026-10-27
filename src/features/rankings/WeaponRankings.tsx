import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { EntityLink } from '../../components/EntityLink';
import { lookup } from '../../data/lookup';
import { AMMO_GROUP } from '../../data/weaponStats';
import itemStyles from '../items/Items.module.css';
import { DEFAULT_WEIGHTS, formatWeights, parseWeights, RATING_MEASURES } from './weights';
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

const COLUMNS: { key: SortKey | null; text: string; hint?: string; mobile: boolean }[] = [
  { key: null, text: '#', mobile: true },
  { key: 'name', text: 'Weapon', mobile: true },
  { key: 'zone', text: 'Zone', mobile: true },
  { key: 'damage', text: 'Per hit', hint: 'Damage of one hit', mobile: true },
  { key: 'combo', text: 'Per combo', hint: 'Damage of a whole combo', mobile: false },
  { key: 'stamina', text: 'Per stamina', hint: 'Combo damage per stamina point', mobile: false },
  { key: 'dps', text: 'DPS ≈', hint: 'Estimated damage per second. Approximate, see below.', mobile: true },
  { key: 'reach', text: 'Reach', hint: 'Attack range in metres', mobile: false },
  { key: 'rating', text: 'Rating', hint: 'Overall score 0 to 100. An opinion, see below.', mobile: false },
  { key: null, text: 'Damage types', mobile: false },
  { key: 'knockback', text: 'Knockback', mobile: false },
  { key: 'durability', text: 'Durability', mobile: false },
];

const one = (n: number | undefined, digits = 1) =>
  n === undefined ? '-' : String(Math.round(n * 10 ** digits) / 10 ** digits);

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
                title={c.hint}
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
              <td className={itemStyles.hideOnMobile}>{one(r.combo, 0)}</td>
              <td className={itemStyles.hideOnMobile}>{one(r.perStamina)}</td>
              <td className={styles.estimate}>{one(r.dps, 0)}</td>
              <td className={itemStyles.hideOnMobile}>{one(r.reach)}</td>
              <td className={itemStyles.hideOnMobile}>{one(r.rating, 0)}</td>
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
 * Which weapon is best, next best, and so on. Filters and weights live in the URL so a view can be
 * linked. Per-hit, per-combo and per-stamina numbers come straight from the game files. Damage per
 * second is an estimate from the animation timing and is labelled as such.
 */
export function WeaponRankings() {
  const [params, setParams] = useSearchParams();
  const zone = params.get('zone') ?? '';
  const upTo = params.get('exact') !== '1';
  const group = params.get('type') ?? '';
  const text = params.get('q') ?? '';
  const view = oneOf(params.get('view'), ['list', 'zones'] as const, 'list');
  const sort = oneOf(params.get('sort'), SORT_KEYS, 'damage');
  const dir = oneOf(params.get('dir'), ['asc', 'desc'] as const, defaultDir(sort));
  const creature = params.get('vs') ?? '';
  const weightsParam = params.get('w');
  const weights = useMemo(() => parseWeights(weightsParam), [weightsParam]);
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
    () =>
      filterAndSort(weaponRows(quality, creature), { group, zone, upTo, text, sort, dir, weights }),
    [quality, creature, group, zone, upTo, text, sort, dir, weights],
  );
  const groups = view === 'zones' ? groupByZone(rows) : [];
  const filtered = Boolean(zone || group || text || quality > 1 || creature || weightsParam);
  const zoneName = lookup.biomeName(zone || null);

  return (
    <section>
      <p className={itemStyles.lead}>
        The strongest weapons first. Pick the zone you are in to see the best weapon you can have
        there, and click a column to sort by it.
      </p>
      <p className={styles.warn} role="note">
        <strong>DPS ≈ is an estimate.</strong> Damage per hit, per combo and per stamina are exact
        game numbers. Damage per second also needs how long each swing takes, which comes from the
        animation files and has not been checked in game, so treat it as approximate.
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
          Against
          <select value={creature} onChange={(e) => set({ vs: e.target.value })}>
            <option value="">No resistances</option>
            {[...lookup.allCreatures(), ...lookup.allBosses()].map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
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
      <details className={itemStyles.section}>
        <summary>Overall rating weights (your opinion)</summary>
        <p className={itemStyles.dim}>
          The rating scores each weapon from 0 to 100 by where it stands among the listed weapons on
          each measure, then blends them with these weights. Raise what matters to you. Weapons with
          no timing in the data (bows) get no rating.
        </p>
        <div className={styles.weights}>
          {RATING_MEASURES.map((m, i) => (
            <label key={m.key}>
              {m.label}
              <input
                type="number"
                min={0}
                max={10}
                step={1}
                value={weights[m.key]}
                onChange={(e) => {
                  const next = RATING_MEASURES.map((x, j) =>
                    j === i ? Math.max(0, Number(e.target.value) || 0) : weights[x.key],
                  );
                  set({ w: next.join(',') === formatWeights(DEFAULT_WEIGHTS) ? '' : next.join(',') });
                }}
              />
            </label>
          ))}
        </div>
      </details>
      <details className={itemStyles.section}>
        <summary>How these numbers are calculated</summary>
        <ul className={styles.formulas}>
          <li>
            <strong>Per hit</strong> = the weapon&apos;s damage at the chosen upgrade level (base +
            damage per level × (level − 1)), summed over the damage types that hurt creatures. Chop
            and pickaxe damage only affect trees and rock and are left out. Against a creature, each
            type is multiplied by its resistance: very weak ×2, weak ×1.5, resistant ×0.5, very
            resistant ×0.25, immune ×0.
          </li>
          <li>
            <strong>Per combo</strong> = per hit × the combo multiplier. Every swing counts the
            attack&apos;s damage multiplier, and the last swing of a multi-swing combo uses the
            weapon&apos;s last-swing multiplier (a bronze sword&apos;s three swings count 1 + 1 + 2 =
            4 hits).
          </li>
          <li>
            <strong>Per stamina</strong> = per combo ÷ (stamina per swing × swings).
          </li>
          <li>
            <strong>DPS ≈</strong> = per combo ÷ seconds per combo. A swing lasts until the next one
            may start: inside a combo that is the animation&apos;s chain point, and for the last
            swing (or a single attack) it is the point where the animation hands control back to
            movement. Speed changes inside the animation are included. Assumes skill level 0 and
            continuous attacking. Bows are not estimated because drawing depends on skill.
          </li>
          <li>
            <strong>Rating</strong> = weighted mean of each measure&apos;s percentile among the
            listed weapons (weakest 0, strongest 1) × 100. It changes with the filters because it
            only compares what is listed.
          </li>
        </ul>
      </details>
    </section>
  );
}
