import { useState } from 'react';
import { EntityLink } from '../../components/EntityLink';
import { Intro } from '../../components/Intro';
import { graph, lookup } from '../../data/lookup';
import type { Armor } from '../../data/schemas';
import { buildPlan } from '../planner/planner';
import styles from '../items/Items.module.css';
import { armorSets, type ArmorSet } from './armorSets';

const maxQuality = (piece: Armor) => piece.maxQuality ?? 1;

function Pieces({ set }: { set: ArmorSet }) {
  return (
    <ul>
      {set.pieces.map((p) => {
        const recipe = graph.recipesFor(p.item)[0];
        return (
          <li key={p.item}>
            <EntityLink id={p.item} /> ({p.slot}, {p.armor} armor)
            {recipe ? (
              <>
                {': '}
                {recipe.inputs.map((i, n) => (
                  <span key={i.item}>
                    {n > 0 && ', '}
                    {i.qty} <EntityLink id={i.item} />
                  </span>
                ))}
                {recipe.station && (
                  <>
                    {' at '}
                    <EntityLink id={recipe.station.id} /> {recipe.station.minLevel}
                  </>
                )}
              </>
            ) : (
              ' (no recipe)'
            )}
          </li>
        );
      })}
    </ul>
  );
}

function SetCard({ set }: { set: ArmorSet }) {
  const top = Math.min(
    ...set.pieces.filter((p) => graph.recipesFor(p.item).length > 0).map(maxQuality),
  );
  const [quality, setQuality] = useState(1);
  const targets = set.pieces
    .filter((p) => graph.recipesFor(p.item).length > 0)
    .map((p) => ({ item: p.item, qty: 1, ...(quality > 1 ? { quality } : {}) }));
  const plan = buildPlan(targets, graph);
  return (
    <section>
      <h2>{set.name}</h2>
      <Pieces set={set} />
      <label>
        Whole set at level{' '}
        <select value={quality} onChange={(e) => setQuality(Number(e.target.value))}>
          {Array.from({ length: Math.max(1, top) }, (_, n) => n + 1).map((q) => (
            <option key={q} value={q}>
              {q}
            </option>
          ))}
        </select>
      </label>
      <p>
        You need:{' '}
        {plan.raw.map((l, n) => (
          <span key={l.item}>
            {n > 0 && ', '}
            {l.need} <EntityLink id={l.item} />
          </span>
        ))}
        .
      </p>
      {plan.stations.length > 0 && (
        <p className={styles.dim}>
          Stations:{' '}
          {plan.stations.map((s, n) => (
            <span key={s.id}>
              {n > 0 && ', '}
              <EntityLink id={s.id} /> level {s.level}
            </span>
          ))}
          .
        </p>
      )}
    </section>
  );
}

/** Every armor set with its pieces and what the whole set costs, down to raw materials. */
export function ArmorSetsPage() {
  const sets = armorSets(lookup.allArmor());
  return (
    <div>
      <h1>Armor sets</h1>
      <Intro>
        <p>
          Each set with the recipe of every piece and the total of raw materials for the whole set.
          Pick a higher level to include the upgrade costs. Silver, bars and other intermediate
          items are already counted back to what you dig, chop or hunt.
        </p>
      </Intro>
      {sets.map((s) => (
        <SetCard key={s.key} set={s} />
      ))}
    </div>
  );
}
