import { useState } from 'react';
import { Intro } from '../../components/Intro';
import { GuideTag } from '../../components/Badges';
import { EntityLink } from '../../components/EntityLink';
import { places } from '../../data/load';
import { lookup } from '../../data/lookup';
import styles from '../items/Items.module.css';

export const KIND_ORDER = ['dungeon', 'altar', 'merchant', 'quest', 'other'] as const;
export const KIND_LABEL: Record<(typeof KIND_ORDER)[number], string> = {
  dungeon: 'Dungeon',
  altar: 'Boss altar',
  merchant: 'Merchant',
  quest: 'Quest place',
  other: 'Landmark or camp',
};

/** Dungeons, camps, altars and other places the game generates, by zone. Zone and counts are from the game files. */
export function PlacesPage() {
  const zones = [...lookup.allBiomes()].sort((a, b) => a.order - b.order);
  const [zone, setZone] = useState('');
  const [kind, setKind] = useState('');
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const zoneRank = (id: string) => zones.findIndex((z) => z.id === id);
  const shown = places
    .filter(
      (p) =>
        (!zone || p.zones.includes(zone)) &&
        (!kind || p.kind === kind) &&
        (!q || p.name.toLowerCase().includes(q) || (p.note ?? '').toLowerCase().includes(q)),
    )
    .sort(
      (a, b) =>
        zoneRank(a.zones[0]!) - zoneRank(b.zones[0]!) ||
        KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) ||
        a.name.localeCompare(b.name),
    );

  return (
    <div>
      <h1>Dungeons and places</h1>
      <Intro>
        <p>
        Every kind of place the game generates in a world, with the zone it appears in and how many the game tries to
        place. Those two come from the game files. The notes on the main dungeons are from public guides and are
        tagged. Places without a note are listed by their game name.
      </p>
      </Intro>
      <p>
        <label>
          Zone{' '}
          <select value={zone} onChange={(e) => setZone(e.target.value)}>
            <option value="">All zones</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </label>{' '}
        <label>
          Kind{' '}
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="">All kinds</option>
            {KIND_ORDER.map((k) => (
              <option key={k} value={k}>
                {KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </label>{' '}
        <label>
          Search{' '}
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="crypt, tower, camp ..."
          />
        </label>{' '}
        <span>{shown.length} shown</span>
      </p>
      <div className={styles.tableWrap} tabIndex={0} role="region" aria-label="Places">
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Place</th>
              <th>Zone</th>
              <th>Per world</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.name}
                  <div className={styles.dimNote}>{KIND_LABEL[p.kind]}</div>
                </td>
                <td>{p.zones.map((id) => zones.find((z) => z.id === id)?.name ?? id).join(', ')}</td>
                <td>{p.quantity === 1 ? '1' : `up to ${p.quantity}`}</td>
                <td>
                  {p.boss && (
                    <>
                      Summon <EntityLink id={p.boss} /> here.{' '}
                    </>
                  )}
                  {p.note && (
                    <>
                      {p.note} <GuideTag />
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {shown.length === 0 && <p className={styles.empty}>No place matches that.</p>}
    </div>
  );
}
