import { useMemo } from 'react';
import { Intro } from '../../components/Intro';
import { EntityLink } from '../../components/EntityLink';
import { gameData } from '../../data/load';
import { lookup } from '../../data/lookup';
import styles from '../items/Items.module.css';
import { unlocksByZone } from './guides';

/** Guides put together from the game data alone, so every line here can be traced to a file. */
export function GuidesPage() {
  const zones = [...lookup.allBiomes()].sort((a, b) => a.order - b.order);
  const unlocks = useMemo(
    () => unlocksByZone(zones, lookup.allItems(), gameData.recipes),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const zoneName = (id: string | null) => zones.find((z) => z.id === id)?.name;

  return (
    <div>
      <h1>Guides</h1>
      <Intro>
        <p>
          These guides are built from the game data, not written by hand, so they never say
          something the data does not. Open one to read it.
        </p>
      </Intro>

      <h2>Get ready for a boss</h2>
      {lookup.allBosses().map((b) => (
        <details key={b.id} className={styles.section}>
          <summary>
            {b.name} <span className={styles.dimNote}>({zoneName(b.biome)})</span>
          </summary>
          <p>
            Summon with:{' '}
            {b.summonItems.length === 0
              ? 'nothing the data lists.'
              : b.summonItems.map((s, i) => (
                  <span key={s.item}>
                    {i > 0 && ', '}
                    {s.qty} <EntityLink id={s.item} />
                    {zoneName(lookup.item(s.item)?.biome ?? null) &&
                      ` (found in ${zoneName(lookup.item(s.item)?.biome ?? null)})`}
                  </span>
                ))}
          </p>
          {b.drops.length > 0 && (
            <p>
              Drops:{' '}
              {b.drops.map((d, i) => (
                <span key={d.item}>
                  {i > 0 && ', '}
                  <EntityLink id={d.item} />
                </span>
              ))}
            </p>
          )}
          <p>
            <EntityLink id={b.id} /> has the full page, with attacks and resistances.
          </p>
        </details>
      ))}

      <h2>What opens up in each zone</h2>
      <p className={styles.dimNote}>
        A recipe is listed in the first zone where everything it needs can be found or crafted.
        Goods from the trader, and anything the data gives no zone for, are not counted.
      </p>
      {unlocks.map((u) => (
        <details key={u.zone.id} className={styles.section}>
          <summary>
            {u.zone.name} <span className={styles.dimNote}>({u.recipes.length} new recipes)</span>
          </summary>
          {u.recipes.length === 0 ? (
            <p>Nothing new.</p>
          ) : (
            <ul>
              {u.recipes.map((r) => (
                <li key={r.id}>
                  <EntityLink id={r.output.item} />
                  {r.station && (
                    <span className={styles.dimNote}>
                      {' '}
                      at <EntityLink id={r.station.id} /> level {r.station.minLevel}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </details>
      ))}
    </div>
  );
}
