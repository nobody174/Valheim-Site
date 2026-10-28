import { useParams } from 'react-router';
import { EntityIcon } from '../../components/EntityIcon';
import { EntityLink } from '../../components/EntityLink';
import { attackName } from '../../data/attackName';
import { GuideTag, VerifiedBadge } from '../../components/Badges';
import { lookup } from '../../data/lookup';
import type { Boss, Creature, Station } from '../../data/schemas';
import { stationLevels } from '../../data/stationLevels';
import { RecipeBlock } from './RecipeBlock';
import styles from './Items.module.css';

function NotFound({ what, id }: { what: string; id: string }) {
  return (
    <section className={styles.page}>
      <h1>Unknown {what}</h1>
      <p>
        No {what} with id &quot;{id}&quot;.
      </p>
    </section>
  );
}

function Drops({ drops }: { drops: Creature['drops'] }) {
  if (drops.length === 0) return null;
  return (
    <section className={styles.section}>
      <h2>Drops</h2>
      <ul>
        {drops.map((d) => (
          <li key={d.item}>
            <EntityLink id={d.item} />
            <span className={styles.dim}>
              {' '}
              ({d.min === d.max ? d.min : `${d.min}–${d.max}`}
              {d.chance !== undefined ? `, ${Math.round(d.chance * 100)}% chance` : ''})
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

const label = (k: string) => k.charAt(0).toUpperCase() + k.slice(1);

function Attacks({ attacks, owner }: { attacks: Creature['attacks']; owner: string }) {
  return (
    <section className={styles.section}>
      <h2>Attacks</h2>
      {attacks.length === 0 ? (
        <p className={styles.dim}>No attack damage in the data (it may be passive).</p>
      ) : (
        <ul>
          {attacks.map((a, i) => (
            <li key={a.id} title={a.id}>
              {attackName(a.id, owner, i)}:{' '}
              {Object.entries(a.damage)
                .map(([k, v]) => `${label(k)} ${Math.round(v)}`)
                .join(', ')}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Resistances({ resistances }: { resistances: Creature['resistances'] }) {
  const entries = Object.entries(resistances ?? {});
  return (
    <section className={styles.section}>
      <h2>Weaknesses and resistances</h2>
      {entries.length === 0 ? (
        <p className={styles.dim}>No special weaknesses or resistances in the data.</p>
      ) : (
        <dl className={styles.facts}>
          {entries.map(([k, v]) => (
            <div key={k} style={{ display: 'contents' }}>
              <dt>{label(k)}</dt>
              <dd>{label(v)}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

function MonsterPage({ monster, boss }: { monster: Creature | Boss; boss: boolean }) {
  const biome = lookup.biomeName(monster.biome);
  return (
    <article className={styles.page} data-zone={monster.biome ?? undefined}>
      <header className={styles.title}>
        <EntityIcon id={monster.id} size={56} />
        <h1>{monster.name}</h1>
      </header>
      <div className={styles.badges}>
        <span className={styles.dim}>{boss ? 'Boss' : 'Creature'}</span>
        {biome && <span className={styles.zoneTag}>{biome}</span>}
        <VerifiedBadge level={monster.verified} note={monster.note} />
      </div>
      <section className={styles.section}>
        <dl className={styles.facts}>
          <dt>Health</dt>
          <dd>{monster.health ?? 'unknown'}</dd>
        </dl>
      </section>
      {'summonItems' in monster && monster.summonItems.length > 0 && (
        <section className={styles.section}>
          <h2>
            Summon with {'summonFromFiles' in monster && monster.summonFromFiles ? null : <GuideTag />}
          </h2>
          <ul className={styles.inline}>
            {monster.summonItems.map((s) => (
              <li key={s.item}>
                {s.qty} × <EntityLink id={s.item} />
              </li>
            ))}
          </ul>
        </section>
      )}
      <Attacks attacks={monster.attacks} owner={monster.id} />
      <Resistances resistances={monster.resistances} />
      <Drops drops={monster.drops} />
    </article>
  );
}

export function CreaturePage({ boss = false }: { boss?: boolean }) {
  const { id = '' } = useParams();
  const monster = boss ? lookup.boss(id) : lookup.creature(id);
  if (!monster) return <NotFound what={boss ? 'boss' : 'creature'} id={id} />;
  return <MonsterPage monster={monster} boss={boss} />;
}

/** What to build the station from, and which zones those materials come from. */
function HowToGet({ station }: { station: Station }) {
  const reqs = station.buildRequirements;
  const zones = lookup
    .allBiomes()
    .filter((b) => reqs.some((g) => lookup.item(g.item)?.biome === b.id))
    .map((b) => b.name);
  return (
    <section className={styles.section}>
      <h2>How to get it</h2>
      {reqs.length === 0 ? (
        <p className={styles.dim}>No build cost in the data. Its materials come from a zone that is not added yet, or the game files list none.</p>
      ) : (
        <>
          <p className={styles.dim}>Build cost:</p>
          <ul className={styles.inline}>
            {reqs.map((g) => (
              <li key={g.item}>
                {g.qty} × <EntityLink id={g.item} />
              </li>
            ))}
          </ul>
          {zones.length > 0 && (
            <p className={styles.dim}>
              Materials come from: {zones.join(', ')}. Click a material to see where to find it.
            </p>
          )}
        </>
      )}
    </section>
  );
}

/** What each station level needs and unlocks, computed from the extensions and recipes. */
function StationLevels({ station }: { station: Station }) {
  const rows = stationLevels(station, lookup.allRecipes());
  if (rows.length < 2) return null;
  return (
    <section className={styles.section}>
      <h2>Station levels</h2>
      <p className={styles.dim}>
        A station is level 1 plus the number of different extensions built within range of it, so
        level N needs any N − 1 of the extensions below. An upgrade needs one level more per quality.
      </p>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Level</th>
              <th>Needs</th>
              <th>Crafts from this level</th>
              <th>Upgrades that need this level</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.level}>
                <td>{r.level}</td>
                <td>
                  {r.extensionsNeeded === 0
                    ? 'The station alone'
                    : `${r.extensionsNeeded} extension${r.extensionsNeeded === 1 ? '' : 's'}`}
                  {!r.reachable && <span className={styles.dim}> (needs a later zone)</span>}
                </td>
                <td>
                  {r.crafts.length
                    ? r.crafts.map((c) => (
                        <span key={c.id}>
                          <EntityLink id={c.output.item} />{' '}
                        </span>
                      ))
                    : '-'}
                </td>
                <td>
                  {r.upgrades.length
                    ? r.upgrades.map((u) => (
                        <span key={`${u.recipe.id}${u.quality}`}>
                          <EntityLink id={u.recipe.output.item} /> → {u.quality}{' '}
                        </span>
                      ))
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function StationPage() {
  const { id = '' } = useParams();
  const station = lookup.station(id);
  if (!station) return <NotFound what="station" id={id} />;
  const recipes = lookup.recipesAt(id);
  return (
    <article className={styles.page}>
      <header className={styles.title}>
        <EntityIcon id={station.id} size={56} />
        <h1>{station.name}</h1>
      </header>
      <div className={styles.badges}>
        <span className={styles.dim}>Crafting station</span>
        <VerifiedBadge level={station.verified} note={station.note} />
      </div>
      <HowToGet station={station} />
      <StationLevels station={station} />
      {station.extensions.length + station.laterExtensions.length > 0 && (
        <section className={styles.section}>
          <h2>Extensions</h2>
          <p className={styles.dim}>{station.note}</p>
          {station.extensions.map((e) => (
            <div key={e.id} className={styles.recipe}>
              <div className={styles.recipeHead}>
                <span>{e.name}</span>
                {e.rangeM ? <span className={styles.dim}>within {e.rangeM} m</span> : null}
              </div>
              <ul className={styles.inline}>
                {e.requirements.map((g) => (
                  <li key={g.item}>
                    {g.qty} × <EntityLink id={g.item} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {station.laterExtensions.map((e) => (
            <div key={e.id} className={styles.recipe}>
              <div className={styles.recipeHead}>
                <span>{e.name}</span>
                {e.rangeM ? <span className={styles.dim}>within {e.rangeM} m</span> : null}
              </div>
              <p className={styles.dim}>
                Needs items from a zone that is not in the data yet
                {e.needs.length ? `: ${e.needs.join(', ')}` : ''}.
              </p>
            </div>
          ))}
        </section>
      )}
      <section className={styles.section}>
        <h2>Crafts here</h2>
        {recipes.length === 0 && <p className={styles.dim}>No recipes in the seed data.</p>}
        {recipes.map((r) => (
          <RecipeBlock key={r.id} recipe={r} />
        ))}
      </section>
    </article>
  );
}
