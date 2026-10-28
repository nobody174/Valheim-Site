import { useEffect, useMemo, useState } from 'react';
import { Intro } from '../../components/Intro';
import { Link, useSearchParams } from 'react-router';
import { EntityLink, entityPath } from '../../components/EntityLink';
import { EntityIcon } from '../../components/EntityIcon';
import { graph, lookup } from '../../data/lookup';
import { plannerOf } from '../../state/model';
import { useApp, useProfile } from '../../state/store';
import styles from '../items/Items.module.css';
import { buildPlan, type PlanLine, type PlanTarget } from './planner';

const name = (id: string) => lookup.item(id)?.name ?? id;

/** Highest upgrade quality the first recipe of an item offers (1 when it cannot be upgraded). */
function maxQualityOf(itemId: string): number {
  const recipe = graph.recipesFor(itemId)[0];
  return Math.max(1, ...(recipe?.upgrades.map((u) => u.quality) ?? []));
}

/** Everything that can be made, by name: the things a plan can start from. */
const makeable = () =>
  lookup
    .allItems()
    .filter((i) => graph.recipesFor(i.id).length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));

function byName(text: string, ids: { id: string; name: string }[]): string | undefined {
  const t = text.trim().toLowerCase();
  return ids.find((i) => i.name.toLowerCase() === t || i.id.toLowerCase() === t)?.id;
}

/** The shopping list as plain text, grouped by zone, for pasting into notes or chat. */
export function shoppingText(groups: { zone: string; lines: PlanLine[] }[]): string {
  return groups
    .map((g) => `${g.zone}\n${g.lines.map((l) => `  ${l.missing} x ${name(l.item)}`).join('\n')}`)
    .join('\n');
}

export function PlannerPage() {
  const profile = useProfile();
  const setTargets = useApp((s) => s.setPlannerTargets);
  const toggleTick = useApp((s) => s.toggleTick);
  const setInventory = useApp((s) => s.setInventoryQty);
  const [params, setParams] = useSearchParams();
  const planner = plannerOf(profile);
  const targets = planner.targets;

  const [text, setText] = useState('');
  const [qty, setQty] = useState(1);
  const [quality, setQuality] = useState(1);
  const [stockText, setStockText] = useState('');
  const [stockQty, setStockQty] = useState(1);
  const [copied, setCopied] = useState(false);
  const options = useMemo(() => makeable(), []);
  const allItems = useMemo(
    () => [...lookup.allItems()].sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

  // /planner?add=ItemId (from an item page) adds that item once.
  const add = params.get('add');
  useEffect(() => {
    if (!add) return;
    if (lookup.item(add) && graph.recipesFor(add).length > 0 && !targets.some((t) => t.item === add)) {
      setTargets([...targets, { item: add, qty: 1 }]);
    }
    const next = new URLSearchParams(params);
    next.delete('add');
    setParams(next, { replace: true });
  }, [add, params, setParams, setTargets, targets]);

  const plan = buildPlan(targets as PlanTarget[], graph, profile.inventory);

  const zoneOrder = new Map(lookup.allBiomes().map((b) => [b.name, b.order]));
  const zoneLines = new Map<string, PlanLine[]>();
  for (const l of plan.raw) {
    const zone = lookup.biomeName(lookup.item(l.item)?.biome ?? null) ?? 'Other';
    zoneLines.set(zone, [...(zoneLines.get(zone) ?? []), l]);
  }
  const groups = [...zoneLines]
    .sort((a, b) => (zoneOrder.get(a[0]) ?? 99) - (zoneOrder.get(b[0]) ?? 99))
    .map(([zone, lines]) => ({ zone, lines }));

  const stationSteps = new Map<string, typeof plan.steps>();
  for (const s of plan.steps) {
    const key = s.stationId ?? '';
    stationSteps.set(key, [...(stationSteps.get(key) ?? []), s]);
  }
  const stepsByStation = [...stationSteps];

  const onAdd = () => {
    const id = byName(text, options);
    if (!id) return;
    const q = Math.min(quality, maxQualityOf(id));
    const existing = targets.find((t) => t.item === id && (t.quality ?? 1) === q);
    setTargets(
      existing
        ? targets.map((t) => (t === existing ? { ...t, qty: t.qty + Math.max(1, qty) } : t))
        : [...targets, { item: id, qty: Math.max(1, qty), ...(q > 1 ? { quality: q } : {}) }],
    );
    setText('');
  };

  const onAddStock = () => {
    const id = byName(stockText, allItems);
    if (!id) return;
    setInventory(id, (profile.inventory[id] ?? 0) + Math.max(1, stockQty));
    setStockText('');
  };

  const onCopy = () => {
    const shown = groups
      .map((g) => ({ zone: g.zone, lines: g.lines.filter((l) => l.missing > 0) }))
      .filter((g) => g.lines.length > 0);
    void navigator.clipboard?.writeText(shoppingText(shown)).then(() => setCopied(true));
  };

  const missingTotal = plan.raw.reduce((n, l) => n + l.missing, 0);
  const inventory = Object.entries(profile.inventory).sort((a, b) =>
    name(a[0]).localeCompare(name(b[0])),
  );

  return (
    <section>
      <h1>Build planner</h1>
      <Intro>
        <p>
        Pick what you want to make. The planner works out the raw materials, the crafting steps and
        the station levels, and subtracts what you already hold (profile {profile.name}).
        </p>
      </Intro>

      <div className={styles.filters}>
        <label>
          Item
          <input
            list="planner-items"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onAdd()}
            placeholder="Type a name, for example Bronze Sword"
          />
          <datalist id="planner-items">
            {options.map((i) => (
              <option key={i.id} value={i.name} />
            ))}
          </datalist>
        </label>
        <label>
          Amount
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value) || 1)}
          />
        </label>
        <label>
          Upgrade level
          <select value={quality} onChange={(e) => setQuality(Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map((q) => (
              <option key={q} value={q}>
                {q === 1 ? '1 (not upgraded)' : q}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className={styles.reset} onClick={onAdd}>
          Add to plan
        </button>
      </div>

      {targets.length === 0 ? (
        <p className={styles.empty}>
          Nothing planned yet. Add an item above, or press &quot;Plan this&quot; on an item page.
        </p>
      ) : (
        <section className={styles.section}>
          <h2>Plan</h2>
          <ul className={styles.inline}>
            {targets.map((t, i) => (
              <li key={`${t.item}-${t.quality ?? 1}`}>
                <input
                  type="number"
                  min={1}
                  aria-label={`Amount of ${name(t.item)}`}
                  value={t.qty}
                  onChange={(e) =>
                    setTargets(
                      targets.map((x, j) =>
                        j === i ? { ...x, qty: Math.max(1, Number(e.target.value) || 1) } : x,
                      ),
                    )
                  }
                />{' '}
                × <EntityLink id={t.item} />
                {t.quality && t.quality > 1 ? ` at level ${t.quality}` : ''}{' '}
                <button
                  type="button"
                  aria-label={`Remove ${name(t.item)}`}
                  className={styles.reset}
                  onClick={() => setTargets(targets.filter((_, j) => j !== i))}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {targets.length > 0 && (
        <>
          {plan.stations.length > 0 && (
            <section className={styles.section}>
              <h2>Stations you need</h2>
              <ul className={styles.inline}>
                {plan.stations.map((s) => (
                  <li key={s.id}>
                    <EntityLink id={s.id} /> level {s.level}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className={styles.section}>
            <h2>Shopping list</h2>
            <p className={styles.dim} aria-live="polite">
              {missingTotal === 0
                ? 'You have everything.'
                : `${missingTotal} items still to find, in ${groups.length} ${groups.length === 1 ? 'zone' : 'zones'}.`}
            </p>
            <button type="button" className={styles.reset} onClick={onCopy}>
              {copied ? 'Copied' : 'Copy as text'}
            </button>
            {groups.map((g) => (
              <div key={g.zone}>
                <h3>{g.zone}</h3>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Got it</th>
                        <th>Item</th>
                        <th>Need</th>
                        <th>You have</th>
                        <th>Missing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.lines.map((l) => (
                        <tr key={l.item}>
                          <td>
                            <input
                              type="checkbox"
                              aria-label={`Got ${name(l.item)}`}
                              checked={planner.ticked.includes(l.item)}
                              onChange={() => toggleTick(l.item)}
                            />
                          </td>
                          <td>
                            <span className={styles.nameCell}>
                              <EntityIcon id={l.item} size={24} />
                              <Link to={entityPath('item', l.item)}>{name(l.item)}</Link>
                            </span>
                          </td>
                          <td>{l.need}</td>
                          <td>
                            <input
                              type="number"
                              min={0}
                              aria-label={`You have of ${name(l.item)}`}
                              value={profile.inventory[l.item] ?? 0}
                              onChange={(e) => setInventory(l.item, Number(e.target.value))}
                            />
                          </td>
                          <td>{l.missing}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            {plan.cycles.length > 0 && (
              <p className={styles.warn}>
                Recipe loop for {plan.cycles.map(name).join(', ')}: counted as raw so the count
                ends.
              </p>
            )}
          </section>

          <section className={styles.section}>
            <h2>Crafting steps</h2>
            {stepsByStation.map(([station, steps]) => (
              <div key={station}>
                <h3>{station ? <EntityLink id={station} /> : 'No station'}</h3>
                <ul>
                  {steps.map((s) => (
                    <li key={s.recipe}>
                      {s.times} × <EntityLink id={s.output} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <p className={styles.dim}>
              Where an item has several recipes the first is used. Upgrades are counted for every
              unit.
            </p>
          </section>
        </>
      )}

      <details className={styles.section}>
        <summary>My inventory ({inventory.length} items)</summary>
        <div className={styles.filters}>
          <label>
            Item
            <input
              list="planner-stock"
              value={stockText}
              onChange={(e) => setStockText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onAddStock()}
              placeholder="Type an item you hold"
            />
            <datalist id="planner-stock">
              {allItems.map((i) => (
                <option key={i.id} value={i.name} />
              ))}
            </datalist>
          </label>
          <label>
            Amount
            <input
              type="number"
              min={1}
              value={stockQty}
              onChange={(e) => setStockQty(Number(e.target.value) || 1)}
            />
          </label>
          <button type="button" className={styles.reset} onClick={onAddStock}>
            Add to inventory
          </button>
        </div>
        {inventory.length === 0 ? (
          <p className={styles.dim}>Nothing entered. The planner then assumes you have nothing.</p>
        ) : (
          <ul className={styles.inline}>
            {inventory.map(([id, n]) => (
              <li key={id}>
                <input
                  type="number"
                  min={0}
                  aria-label={`Amount of ${name(id)} in inventory`}
                  value={n}
                  onChange={(e) => setInventory(id, Number(e.target.value))}
                />{' '}
                × <EntityLink id={id} />
              </li>
            ))}
          </ul>
        )}
      </details>
    </section>
  );
}
