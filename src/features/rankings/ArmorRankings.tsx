import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { EntityLink } from '../../components/EntityLink';
import { lookup } from '../../data/lookup';
import itemStyles from '../items/Items.module.css';
import {
  ARMOR_PRESETS,
  ARMOR_SORT_KEYS,
  armorRows,
  defaultArmorDir,
  maxArmorQuality,
  rankArmor,
  type ArmorPreset,
  type ArmorSortKey,
} from './armorRanking';
import styles from './Rankings.module.css';

const SLOTS = ['helmet', 'chest', 'legs', 'cape'] as const;
const label = (k: string) => k.charAt(0).toUpperCase() + k.slice(1);
const num = (n: number | undefined) => (n === undefined ? '-' : String(Math.round(n * 100) / 100));

const COLUMNS: { key: ArmorSortKey | null; text: string; hint?: string; mobile: boolean }[] = [
  { key: null, text: '#', mobile: true },
  { key: 'name', text: 'Piece', mobile: true },
  { key: null, text: 'Slot', mobile: false },
  { key: 'zone', text: 'Zone', mobile: false },
  { key: 'armor', text: 'Armor', hint: 'Armor value at the chosen upgrade level', mobile: true },
  { key: 'weight', text: 'Weight', mobile: true },
  { key: 'movement', text: 'Speed', hint: 'Change to your movement speed', mobile: false },
  { key: null, text: 'Set', mobile: false },
  { key: 'craft', text: 'Craft cost', hint: 'Items in the crafting recipe', mobile: false },
  { key: 'upgrade', text: 'Upgrade cost', hint: 'Items to upgrade from level 1 to the chosen level', mobile: false },
];

function oneOf<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return allowed.find((a) => a === value) ?? fallback;
}

/** Armor pieces ranked by armor value, weight, speed penalty and cost, with a few ready-made views. */
export function ArmorRankings() {
  const [params, setParams] = useSearchParams();
  const zone = params.get('zone') ?? '';
  const upTo = params.get('exact') !== '1';
  const slot = params.get('slot') ?? '';
  const text = params.get('q') ?? '';
  const preset = oneOf(params.get('preset'), ARMOR_PRESETS.map((p) => p.key), '' as ArmorPreset | '');
  const sort = oneOf(params.get('sort'), ARMOR_SORT_KEYS, 'armor');
  const dir = oneOf(params.get('dir'), ['asc', 'desc'] as const, defaultArmorDir(sort));
  const top = maxArmorQuality();
  const quality = Math.min(top, Math.max(1, Number(params.get('level')) || 1));

  const set = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next, { replace: true });
  };

  const onSort = (key: ArmorSortKey) =>
    set({
      preset: '',
      sort: key === 'armor' ? '' : key,
      dir: key === sort && !preset ? (dir === 'asc' ? 'desc' : 'asc') : '',
    });

  const rows = useMemo(
    () => rankArmor(armorRows(quality), { slot, zone, upTo, text, sort, dir, preset }),
    [quality, slot, zone, upTo, text, sort, dir, preset],
  );
  const active = ARMOR_PRESETS.find((p) => p.key === preset);
  const filtered = Boolean(zone || slot || text || quality > 1 || preset);

  return (
    <section>
      <p className={itemStyles.lead}>
        Armor pieces side by side. Pick a view for a quick answer, or click a column to sort by it.
      </p>
      <div className={styles.tabs} role="group" aria-label="Armor views">
        {ARMOR_PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            className={styles.tab}
            aria-pressed={preset === p.key}
            onClick={() => set({ preset: preset === p.key ? '' : p.key, sort: '', dir: '' })}
          >
            {p.label}
          </button>
        ))}
      </div>
      {active && <p className={styles.rule}>{active.label}: {active.rule}</p>}
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
          Slot
          <select value={slot} onChange={(e) => set({ slot: e.target.value })}>
            <option value="">All slots</option>
            {SLOTS.map((s) => (
              <option key={s} value={s}>
                {label(s)}
              </option>
            ))}
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
          Name
          <input
            type="search"
            value={text}
            onChange={(e) => set({ q: e.target.value })}
            placeholder="Filter by name"
          />
        </label>
        {filtered && (
          <button type="button" className={itemStyles.reset} onClick={() => setParams({ tab: 'armor' }, { replace: true })}>
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
          Include earlier zones (everything you can have by {lookup.biomeName(zone)})
        </label>
      )}
      <p className={itemStyles.dim} aria-live="polite">
        {rows.length} {rows.length === 1 ? 'piece' : 'pieces'}
        {quality > 1 && `, at upgrade level ${quality} (items that cannot reach it show their maximum)`}
      </p>
      {rows.length === 0 ? (
        <p className={itemStyles.empty}>No armor matches these filters.</p>
      ) : (
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
                      c.key && c.key === sort && !preset
                        ? dir === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    {c.key ? (
                      <button type="button" className={styles.sortButton} onClick={() => onSort(c.key!)}>
                        {c.text}
                        {c.key === sort && !preset && (
                          <span aria-hidden="true">{dir === 'asc' ? ' ▲' : ' ▼'}</span>
                        )}
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
                  </td>
                  <td className={itemStyles.hideOnMobile}>{label(r.slot)}</td>
                  <td className={itemStyles.hideOnMobile}>{r.zoneName}</td>
                  <td className={styles.damage}>{num(r.armor)}</td>
                  <td>{num(r.weight)}</td>
                  <td className={itemStyles.hideOnMobile}>
                    {r.movement ? `${Math.round(r.movement * 100)}%` : '-'}
                  </td>
                  <td className={itemStyles.hideOnMobile} title={r.setEffect}>
                    {r.setName ? `${label(r.setName)} (${r.setSize ?? '?'})` : '-'}
                  </td>
                  <td className={itemStyles.hideOnMobile}>{num(r.craftItems)}</td>
                  <td className={itemStyles.hideOnMobile}>{num(r.upgradeItems)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <details className={itemStyles.section}>
        <summary>How the armor views work</summary>
        <ul className={styles.formulas}>
          <li>
            <strong>Armor</strong> = base armor + armor per level × (level − 1). Items that cannot
            reach the chosen level show their maximum.
          </li>
          {ARMOR_PRESETS.map((p) => (
            <li key={p.key}>
              <strong>{p.label}</strong>: {p.rule}
            </li>
          ))}
          <li>
            There is no Mage view yet: the data has no Eitr or magic armor until the Mistlands zone
            is added.
          </li>
          <li>
            <strong>Craft cost</strong> counts the items in the recipe; <strong>upgrade cost</strong>{' '}
            counts the items to upgrade from level 1 to the chosen level. Hover the set to read its
            bonus.
          </li>
        </ul>
      </details>
    </section>
  );
}
