import { Link, useSearchParams } from 'react-router';
import { EntityIcon } from '../../components/EntityIcon';
import { EntityLink } from '../../components/EntityLink';
import { graph, lookup } from '../../data/lookup';
import { combatDamage } from '../../data/weaponStats';
import styles from '../items/Items.module.css';
import { maxUpgradeQuality, upgradeCost } from './upgradeCost';

const num = (n: number) => String(Math.round(n * 100) / 100);
const label = (k: string) => k.charAt(0).toUpperCase() + k.slice(1);

/** Items that can be upgraded: their first recipe has upgrade steps. */
const upgradable = () =>
  lookup
    .allItems()
    .filter((i) => (graph.recipesFor(i.id)[0]?.upgrades.length ?? 0) > 0)
    .sort((a, b) => a.name.localeCompare(b.name));

/** Cost of taking gear from one quality to another, step by step and in total. */
export function UpgradePage() {
  const [params, setParams] = useSearchParams();
  const options = upgradable();
  const id = options.find((i) => i.id === params.get('item'))?.id ?? '';
  const recipe = id ? graph.recipesFor(id)[0] : undefined;
  const top = recipe ? maxUpgradeQuality(recipe) : 1;
  const from = Math.min(top - 1, Math.max(1, Number(params.get('from')) || 1));
  const to = Math.min(top, Math.max(from + 1, Number(params.get('to')) || top));
  const cost = recipe ? upgradeCost(recipe, from, to) : undefined;
  const weapon = id ? lookup.weapon(id) : undefined;

  const set = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next, { replace: true });
  };

  return (
    <section>
      <h1>Upgrade calculator</h1>
      <p className={styles.lead}>
        What it costs to take a weapon or armor piece from one upgrade level to another, and the
        station level each step needs.
      </p>
      <div className={styles.filters}>
        <label>
          Item
          <select value={id} onChange={(e) => set({ item: e.target.value, from: '', to: '' })}>
            <option value="">Choose an item</option>
            {options.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </label>
        {recipe && (
          <>
            <label>
              From level
              <select value={from} onChange={(e) => set({ from: e.target.value, to: '' })}>
                {Array.from({ length: top - 1 }, (_, i) => i + 1).map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </label>
            <label>
              To level
              <select value={to} onChange={(e) => set({ to: e.target.value })}>
                {Array.from({ length: top - from }, (_, i) => from + 1 + i).map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
      </div>

      {!recipe || !cost ? (
        <p className={styles.empty}>Choose an item to see the cost.</p>
      ) : (
        <>
          <h2>
            <span className={styles.nameCell}>
              <EntityIcon id={id} size={32} />
              <EntityLink id={id} />
            </span>
          </h2>
          <section className={styles.section}>
            <h3>
              Level {from} to {to}
            </h3>
            <p>
              Station: {recipe.station ? <EntityLink id={recipe.station.id} /> : 'none'}, level{' '}
              {cost.stationLevel}.
            </p>
            <ul className={styles.inline}>
              {cost.total.map((i) => (
                <li key={i.item}>
                  {i.qty} × <EntityLink id={i.item} />
                </li>
              ))}
            </ul>
          </section>
          {weapon && (
            <section className={styles.section}>
              <h3>Damage</h3>
              <p>
                Level {from}:{' '}
                {Object.entries(combatDamage(weapon, from))
                  .map(([k, v]) => `${label(k)} ${num(v)}`)
                  .join(', ')}
                <br />
                Level {to}:{' '}
                {Object.entries(combatDamage(weapon, to))
                  .map(([k, v]) => `${label(k)} ${num(v)}`)
                  .join(', ')}
              </p>
            </section>
          )}
          <section className={styles.section}>
            <h3>Step by step</h3>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>To level</th>
                    <th>Station level</th>
                    <th>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {cost.steps.map((s) => (
                    <tr key={s.quality}>
                      <td>{s.quality}</td>
                      <td>{s.level}</td>
                      <td>
                        <ul className={styles.inline}>
                          {s.inputs.map((i) => (
                            <li key={i.item}>
                              {i.qty} × <EntityLink id={i.item} />
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <p>
            <Link to={`/planner?add=${id}`}>Plan the whole item in the build planner</Link>
          </p>
        </>
      )}
    </section>
  );
}
