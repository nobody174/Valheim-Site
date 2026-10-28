import { useSearchParams } from 'react-router';
import { EntityIcon } from '../../components/EntityIcon';
import { EntityLink } from '../../components/EntityLink';
import { lookup } from '../../data/lookup';
import styles from '../items/Items.module.css';
import { bestCombos, GOALS, type FoodEntry, type Goal } from './foodOptimizer';

const minutes = (sec: number) => `${Math.round(sec / 60)} min`;

/** Foods (not meads) whose item belongs to the chosen zone or an earlier one. */
function foodsUpTo(zone: string): FoodEntry[] {
  const order = new Map(lookup.allBiomes().map((b) => [b.id, b.order]));
  const limit = zone ? (order.get(zone) ?? Infinity) : Infinity;
  return lookup
    .allFoods()
    .filter((f) => f.kind === 'food')
    .filter((f) => (order.get(lookup.item(f.item)?.biome ?? '') ?? 0) <= limit)
    .map((f) => ({
      id: f.item,
      health: f.health ?? 0,
      stamina: f.stamina ?? 0,
      eitr: f.eitr ?? 0,
      durationSec: f.durationSec ?? 0,
    }));
}

/** The best three foods to eat for a goal, limited to what you can make by a chosen zone. */
export function FoodOptimizerPage() {
  const [params, setParams] = useSearchParams();
  const goal = GOALS.find((g) => g.key === params.get('goal'))?.key ?? 'health';
  const zone = lookup.allBiomes().find((b) => b.id === params.get('zone'))?.id ?? '';
  const minMin = Math.max(0, Math.min(40, Number(params.get('min')) || 0));

  const set = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next, { replace: true });
  };

  const pool = foodsUpTo(zone);
  const combos = bestCombos(pool, goal as Goal, 5, minMin * 60);
  const rule = GOALS.find((g) => g.key === goal)!.rule;

  return (
    <section>
      <h1>Food optimizer</h1>
      <p className={styles.lead}>
        You can eat three different foods at a time, and their health, stamina and Eitr add up. Pick a goal
        and the zone you have reached to see the best sets.
      </p>
      <div className={styles.filters}>
        <label>
          Goal
          <select value={goal} onChange={(e) => set({ goal: e.target.value === 'health' ? '' : e.target.value })}>
            {GOALS.map((g) => (
              <option key={g.key} value={g.key}>
                {g.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Foods up to
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
          Lasts at least (minutes)
          <input
            type="number"
            min={0}
            max={40}
            value={minMin}
            onChange={(e) => set({ min: e.target.value === '0' ? '' : e.target.value })}
          />
        </label>
      </div>
      <p className={styles.dim}>
        Rule: {rule} {pool.length} foods considered. Meads, raw berries and mushrooms are not included.
      </p>

      {combos.length === 0 ? (
        <p className={styles.empty}>Not enough foods match to make a set of three.</p>
      ) : (
        <ol>
          {combos.map((c) => (
            <li key={c.ids.join()} className={styles.section}>
              <ul className={styles.inline}>
                {c.ids.map((id) => (
                  <li key={id}>
                    <span className={styles.nameCell}>
                      <EntityIcon id={id} size={28} />
                      <EntityLink id={id} />
                    </span>
                  </li>
                ))}
              </ul>
              <p>
                Health <strong>{c.health}</strong> · Stamina <strong>{c.stamina}</strong>
                {c.eitr > 0 && (
                  <>
                    {' '}
                    · Eitr <strong>{c.eitr}</strong>
                  </>
                )}{' '}
                <span className={styles.dim}>· first one runs out after {minutes(c.shortestSec)}</span>
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
