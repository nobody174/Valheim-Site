import { EntityLink } from '../../components/EntityLink';
import { Intro } from '../../components/Intro';
import { updateLog } from '../../data/load';
import { lookup } from '../../data/lookup';
import { useState } from 'react';
import styles from '../items/Items.module.css';

const TITLES: Record<string, string> = {
  items: 'Items',
  recipes: 'Recipes',
  stations: 'Stations',
  weapons: 'Weapons',
  armor: 'Armor',
  foods: 'Foods',
  trophies: 'Trophies',
  creatures: 'Creatures',
  bosses: 'Bosses',
  pieces: 'Building pieces',
};

/** A linked name when the id is something the site has a page for, plain text otherwise (a removed id). */
function Name({ id }: { id: string }) {
  return lookup.entity(id) ? <EntityLink id={id} /> : <span>{id}</span>;
}

function Group({ title, ids }: { title: string; ids: React.ReactNode[] }) {
  return (
    <li>
      <strong>{title}:</strong>{' '}
      {ids.map((n, i) => (
        <span key={i}>
          {i > 0 && ', '}
          {n}
        </span>
      ))}
    </li>
  );
}

/** What changed in the data after each game patch, newest first. */
export function UpdateLogPage() {
  const [open, setOpen] = useState<string | null>(updateLog.entries[0]?.gameVersion ?? null);
  return (
    <div>
      <h1>Update log</h1>
      <Intro>
        <p>
        What changed in the data after each game patch. It is written when the data is rebuilt for a new Steam
        build, by comparing the new files with the old. Fixes to the site&apos;s own notes are not listed here.
      </p>
      </Intro>
      {updateLog.entries.map((e) => (
        <section key={e.gameVersion} className={styles.section}>
          <h2>
            <button
              type="button"
              className={styles.toggle}
              aria-expanded={open === e.gameVersion}
              onClick={() => setOpen(open === e.gameVersion ? null : e.gameVersion)}
            >
              {e.gameVersion}
            </button>{' '}
            <small>{e.date}</small>
          </h2>
          {open === e.gameVersion &&
            (e.baseline ? (
              <p>
                First snapshot, the starting point for later comparisons:{' '}
                {Object.entries(e.counts ?? {})
                  .map(([k, n]) => `${n} ${(TITLES[k] ?? k).toLowerCase()}`)
                  .join(', ')}
                .
              </p>
            ) : (
              <ul>
                {Object.entries(e.added ?? {}).map(([k, ids]) => (
                  <Group key={`a${k}`} title={`New ${(TITLES[k] ?? k).toLowerCase()}`} ids={ids.map((id) => <Name key={id} id={id} />)} />
                ))}
                {Object.entries(e.removed ?? {}).map(([k, ids]) => (
                  <Group key={`r${k}`} title={`Removed ${(TITLES[k] ?? k).toLowerCase()}`} ids={ids.map((id) => <Name key={id} id={id} />)} />
                ))}
                {Object.entries(e.changed ?? {}).map(([k, rows]) => (
                  <Group
                    key={`c${k}`}
                    title={`Changed ${(TITLES[k] ?? k).toLowerCase()}`}
                    ids={rows.map((r) => (
                      <span key={r.id}>
                        <Name id={r.id} /> ({r.fields.join(', ')})
                      </span>
                    ))}
                  />
                ))}
                {!e.added && !e.removed && !e.changed && <li>No data changes.</li>}
              </ul>
            ))}
        </section>
      ))}
    </div>
  );
}
