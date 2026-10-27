import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { HoardBadge, VerifiedBadge } from '../../components/Badges';
import { EntityLink } from '../../components/EntityLink';
import { lookup } from '../../data/lookup';
import { effectiveHoard } from '../../state/model';
import { useProfile } from '../../state/store';
import styles from '../items/Items.module.css';

const UNKNOWN = 'unknown';
const num = (v: number | undefined): string =>
  v === undefined ? UNKNOWN : String(Math.round(v * 10) / 10);

/** Filters live in the URL so a view can be linked and survives a refresh. */
function useFilters() {
  const [params, setParams] = useSearchParams();
  const set = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next, { replace: true });
  };
  return { params, set, clear: () => setParams({}, { replace: true }) };
}

type SetFilter = (changes: Record<string, string>) => void;

function Filters({
  text,
  biome,
  set,
  clear,
  children,
}: {
  text: string;
  biome: string;
  set: SetFilter;
  clear: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className={styles.filters}>
      <label>
        Name
        <input
          type="search"
          value={text}
          onChange={(e) => set({ q: e.target.value })}
          placeholder="Filter by name"
        />
      </label>
      <label>
        Zone
        <select value={biome} onChange={(e) => set({ biome: e.target.value })}>
          <option value="">All</option>
          {lookup.allBiomes().map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </label>
      {children}
      {(text || biome) && (
        <button type="button" className={styles.reset} onClick={clear}>
          Clear filters
        </button>
      )}
    </div>
  );
}

const matches = (name: string, text: string): boolean =>
  !text.trim() || name.toLowerCase().includes(text.trim().toLowerCase());

const zoneIndex = (id: string | null): number => {
  const i = lookup.allBiomes().findIndex((b) => b.id === id);
  return i < 0 ? Infinity : i;
};

function Links({ ids }: { ids: string[] }) {
  return (
    <>
      {ids.map((id) => (
        <span key={id}>
          <EntityLink id={id} />{' '}
        </span>
      ))}
    </>
  );
}

export function TrophiesPage() {
  const profile = useProfile();
  const { params, set, clear } = useFilters();
  const text = params.get('q') ?? '';
  const biome = params.get('biome') ?? '';
  const rows = useMemo(
    () =>
      lookup
        .allTrophies()
        .map((t) => ({ t, item: lookup.item(t.item) }))
        .filter(({ item }) => item && matches(item.name, text) && (!biome || item.biome === biome))
        .sort((a, b) => (a.item?.name ?? '').localeCompare(b.item?.name ?? '')),
    [text, biome],
  );
  return (
    <section>
      <h1>Trophies</h1>
      <p className={styles.lead}>
        What drops each trophy, and whether it is safe to throw away. Check the hoard column before
        clearing your chests.
      </p>
      <Filters text={text} biome={biome} set={set} clear={clear} />
      <p className={styles.dim} aria-live="polite">
        {rows.length} {rows.length === 1 ? 'trophy' : 'trophies'}
      </p>
      {rows.length === 0 ? (
        <p className={styles.empty}>No trophies match these filters.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Trophy</th>
                <th>Dropped by</th>
                <th>Zone</th>
                <th>Drop chance</th>
                <th>Hoard</th>
                <th className={styles.hideOnMobile}>Needed to summon</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ t, item }) => {
                const chance = lookup.creature(t.creature)?.drops.find((d) => d.item === t.item)?.chance;
                const bosses = lookup.summonsFor(t.item).map((b) => b.id);
                return (
                  <tr key={t.item}>
                    <td>
                      <EntityLink id={t.item} />
                    </td>
                    <td>
                      <EntityLink id={t.creature} />
                    </td>
                    <td>{lookup.biomeName(item?.biome ?? null) ?? UNKNOWN}</td>
                    <td>{chance === undefined ? 'always' : `${Math.round(chance * 100)}%`}</td>
                    <td>
                      {item && (
                        <HoardBadge
                          hoard={effectiveHoard(item, profile)}
                          qty={item.recommendedQty}
                          custom={item.id in profile.hoardOverrides}
                        />
                      )}
                    </td>
                    <td className={styles.hideOnMobile}>
                      {bosses.length ? <Links ids={bosses} /> : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function BossesPage() {
  const { params, set, clear } = useFilters();
  const text = params.get('q') ?? '';
  const biome = params.get('biome') ?? '';
  const rows = useMemo(
    () =>
      lookup
        .allBosses()
        .filter((b) => matches(b.name, text) && (!biome || b.biome === biome))
        .sort((a, b) => zoneIndex(a.biome) - zoneIndex(b.biome)),
    [text, biome],
  );
  return (
    <section>
      <h1>Bosses</h1>
      <p className={styles.lead}>
        One boss per zone, in the order you meet them. Open one to see its attacks and drops.
      </p>
      <Filters text={text} biome={biome} set={set} clear={clear} />
      {rows.length === 0 ? (
        <p className={styles.empty}>No bosses match these filters.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Boss</th>
                <th>Zone</th>
                <th>Health</th>
                <th>Summon with</th>
                <th>Drops</th>
                <th className={styles.hideOnMobile}>Data</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id}>
                  <td>
                    <EntityLink id={b.id} />
                  </td>
                  <td>{lookup.biomeName(b.biome)}</td>
                  <td>{num(b.health)}</td>
                  <td>
                    {b.summonItems.length
                      ? b.summonItems.map((s) => (
                          <span key={s.item}>
                            {s.qty}× <EntityLink id={s.item} />{' '}
                          </span>
                        ))
                      : UNKNOWN}
                  </td>
                  <td>
                    <Links ids={b.drops.map((d) => d.item)} />
                  </td>
                  <td className={styles.hideOnMobile}>
                    <VerifiedBadge level={b.verified} note={b.note} />
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

export function CreaturesPage() {
  const { params, set, clear } = useFilters();
  const text = params.get('q') ?? '';
  const biome = params.get('biome') ?? '';
  const rows = useMemo(
    () =>
      lookup
        .allCreatures()
        .filter((c) => matches(c.name, text) && (!biome || c.biome === biome))
        .sort((a, b) => zoneIndex(a.biome) - zoneIndex(b.biome) || a.name.localeCompare(b.name)),
    [text, biome],
  );
  return (
    <section>
      <h1>Creatures</h1>
      <p className={styles.lead}>
        Health, drops and what each creature is weak to. Boss fights are on the Bosses page.
      </p>
      <Filters text={text} biome={biome} set={set} clear={clear} />
      <p className={styles.dim} aria-live="polite">
        {rows.length} {rows.length === 1 ? 'creature' : 'creatures'}
      </p>
      {rows.length === 0 ? (
        <p className={styles.empty}>No creatures match these filters.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Creature</th>
                <th>Zone</th>
                <th>Health</th>
                <th>Drops</th>
                <th className={styles.hideOnMobile}>Weak to</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const weak = Object.entries(c.resistances ?? {})
                  .filter(([, v]) => v === 'weak' || v === 'very weak')
                  .map(([type]) => type);
                return (
                  <tr key={c.id}>
                    <td>
                      <EntityLink id={c.id} />
                    </td>
                    <td>{lookup.biomeName(c.biome) ?? UNKNOWN}</td>
                    <td>{num(c.health)}</td>
                    <td>
                      <Links ids={c.drops.map((d) => d.item)} />
                    </td>
                    <td className={styles.hideOnMobile}>{weak.length ? weak.join(', ') : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

const FOOD_SORTS = ['name', 'health', 'stamina', 'eitr', 'durationSec'] as const;
type FoodSort = (typeof FOOD_SORTS)[number];
const FOOD_HEAD: Record<FoodSort, string> = {
  name: 'Name',
  health: 'Health',
  stamina: 'Stamina',
  eitr: 'Eitr',
  durationSec: 'Lasts',
};

export function FoodPage() {
  const { params, set, clear } = useFilters();
  const text = params.get('q') ?? '';
  const biome = params.get('biome') ?? '';
  const kind = params.get('kind') ?? '';
  const sort = FOOD_SORTS.find((s) => s === params.get('sort')) ?? 'name';
  const defaultDir = sort === 'name' ? 'asc' : 'desc';
  const dir = params.get('dir') === 'asc' || params.get('dir') === 'desc' ? params.get('dir') : defaultDir;

  const rows = useMemo(() => {
    const list = lookup
      .allFoods()
      .map((f) => ({ f, item: lookup.item(f.item) }))
      .filter(
        ({ f, item }) =>
          item && matches(item.name, text) && (!biome || item.biome === biome) && (!kind || f.kind === kind),
      );
    return list.sort((a, b) => {
      const x = sort === 'name' ? a.item?.name : a.f[sort];
      const y = sort === 'name' ? b.item?.name : b.f[sort];
      if (x === undefined) return y === undefined ? 0 : 1; // unknown values go last
      if (y === undefined) return -1;
      const cmp = typeof x === 'string' ? x.localeCompare(String(y)) : x - Number(y);
      return dir === 'asc' ? cmp : -cmp;
    });
  }, [text, biome, kind, sort, dir]);

  const onSort = (s: FoodSort) =>
    set(s === sort ? { dir: dir === 'asc' ? 'desc' : 'asc' } : { sort: s === 'name' ? '' : s, dir: '' });
  const lasts = (sec: number | undefined) => (sec === undefined ? UNKNOWN : `${Math.round(sec / 60)} min`);

  return (
    <section>
      <h1>Food and mead</h1>
      <p className={styles.lead}>
        Click a column heading to sort. Only the three foods you eat count at once, so look at health
        and stamina together.
      </p>
      <Filters text={text} biome={biome} set={set} clear={clear}>
        <label>
          Type
          <select value={kind} onChange={(e) => set({ kind: e.target.value })}>
            <option value="">All</option>
            <option value="food">Food</option>
            <option value="mead">Mead</option>
          </select>
        </label>
      </Filters>
      <p className={styles.dim} aria-live="polite">
        {rows.length} {rows.length === 1 ? 'entry' : 'entries'}
      </p>
      {rows.length === 0 ? (
        <p className={styles.empty}>No food matches these filters.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {FOOD_SORTS.map((s) => (
                  <th
                    key={s}
                    aria-sort={s === sort ? (dir === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    <button type="button" className={styles.reset} onClick={() => onSort(s)}>
                      {FOOD_HEAD[s]}
                      {s === sort ? (dir === 'asc' ? ' ▲' : ' ▼') : ''}
                    </button>
                  </th>
                ))}
                <th>Zone</th>
                <th className={styles.hideOnMobile}>Effect</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ f, item }) => (
                <tr key={f.item}>
                  <td>
                    <EntityLink id={f.item} />
                  </td>
                  <td>{num(f.health)}</td>
                  <td>{num(f.stamina)}</td>
                  <td>{f.eitr === undefined ? '-' : num(f.eitr)}</td>
                  <td>{lasts(f.durationSec)}</td>
                  <td>{lookup.biomeName(item?.biome ?? null) ?? UNKNOWN}</td>
                  <td className={styles.hideOnMobile}>{f.effect ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
