import { useMemo, useState } from 'react';
import { Intro } from '../../components/Intro';
import { EntityLink } from '../../components/EntityLink';
import { gameData } from '../../data/load';
import { lookup } from '../../data/lookup';
import { useApp, useProfile } from '../../state/store';
import styles from '../items/Items.module.css';
import { whatCanIMake, type Craftable } from './finder';

const nameOf = (id: string) => lookup.item(id)?.name ?? id;

function Row({ c }: { c: Craftable }) {
  const out = c.recipe.output;
  return (
    <li>
      <EntityLink id={out.item} />
      {out.qty > 1 && ` x${out.qty}`}
      {c.missing.length === 0 ? (
        <span className={styles.dimNote}>
          {' '}
          can make {c.times} time{c.times === 1 ? '' : 's'}
        </span>
      ) : (
        <span className={styles.dimNote}>
          {' '}
          needs {c.missing.map((m) => `${m.short} more ${nameOf(m.item)}`).join(', ')}
        </span>
      )}
      {c.recipe.station && (
        <span className={styles.dimNote}>
          {' '}
          at <EntityLink id={c.recipe.station.id} /> level {c.recipe.station.minLevel}
        </span>
      )}
    </li>
  );
}

/** Type what is in the chest and see what can be made from it, and what is one or two things away. */
export function FinderPage() {
  const profile = useProfile();
  const setQty = useApp((s) => s.setInventoryQty);
  const [text, setText] = useState('');
  const [amount, setAmount] = useState(10);
  const items = useMemo(
    () => [...lookup.allItems()].sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );
  const { ready, close } = useMemo(
    () => whatCanIMake(gameData.recipes, profile.inventory),
    [profile.inventory],
  );
  const held = Object.entries(profile.inventory).sort((a, b) =>
    nameOf(a[0]).localeCompare(nameOf(b[0])),
  );

  const add = () => {
    const t = text.trim().toLowerCase();
    const hit = items.find((i) => i.name.toLowerCase() === t || i.id.toLowerCase() === t);
    if (!hit) return;
    setQty(hit.id, (profile.inventory[hit.id] ?? 0) + Math.max(1, amount));
    setText('');
  };

  return (
    <div>
      <h1>What can I make?</h1>
      <Intro>
        <p>
          Tell the site what you are carrying and it lists the recipes you can make now, and those that
          are one or two things away. It uses the same stock as the Build planner, so what you type here
          is there too.
        </p>
      </Intro>
      <p>
        <label>
          Item{' '}
          <input
            list="finder-items"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Iron"
          />
        </label>
        <datalist id="finder-items">
          {items.map((i) => (
            <option key={i.id} value={i.name} />
          ))}
        </datalist>{' '}
        <label>
          How many{' '}
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </label>{' '}
        <button type="button" onClick={add}>
          Add
        </button>
      </p>
      {held.length > 0 && (
        <ul>
          {held.map(([id, n]) => (
            <li key={id}>
              {n} x {nameOf(id)}{' '}
              <button type="button" aria-label={`Remove ${nameOf(id)}`} onClick={() => setQty(id, 0)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      {held.length === 0 ? (
        <p className={styles.dimNote}>Add something you are carrying to see what it makes.</p>
      ) : (
        <>
          <h2>You can make now ({ready.length})</h2>
          {ready.length === 0 ? (
            <p className={styles.dimNote}>Nothing yet.</p>
          ) : (
            <ul>
              {ready.map((c) => (
                <Row key={c.recipe.id} c={c} />
              ))}
            </ul>
          )}
          <h2>Almost there ({close.length})</h2>
          {close.length === 0 ? (
            <p className={styles.dimNote}>Nothing is one or two things away.</p>
          ) : (
            <ul>
              {close.slice(0, 60).map((c) => (
                <Row key={c.recipe.id} c={c} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
