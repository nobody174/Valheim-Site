import { NavLink, useParams } from 'react-router';
import { EntityLink } from '../../components/EntityLink';
import { gameData } from '../../data/load';
import { lookup } from '../../data/lookup';
import { useProfile } from '../../state/store';
import { buildGuide } from './guide';
import styles from '../items/Items.module.css';

const num = (n: number) => String(Math.round(n * 100) / 100);
const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Per-biome guide built from the data files. The ranked picks are simple measures, not advice. */
export function ProgressionPage() {
  const biomes = [...lookup.allBiomes()].sort((a, b) => a.order - b.order);
  const { biome: param } = useParams();
  const biome = biomes.find((b) => b.id === param) ?? biomes[0];
  const profile = useProfile();
  if (!biome) return <p className={styles.empty}>No biome data.</p>;

  const guide = buildGuide(gameData, biome.id);
  const owned = (id: string) => profile.progress[id]?.collected === true;
  const mustKeepMissing = guide.mustKeep.filter((id) => !owned(id)).length;

  return (
    <section>
      <h1>Progression guide</h1>
      <p className={styles.lead}>
        What to know about each biome, built from the game data: the boss, what lives there, what to
        keep, and a few gear and food picks. Choose a biome below.
      </p>
      <nav className={styles.tabs} aria-label="Biomes">
        {biomes.map((b, i) => (
          <NavLink
            key={b.id}
            to={`/progression/${b.id}`}
            className={({ isActive }) =>
              isActive || (!param && i === 0)
                ? `${styles.toggle} ${styles.toggleOn}`
                : styles.toggle
            }
          >
            {i + 1}. {b.name}
          </NavLink>
        ))}
      </nav>

      <h2>{biome.name}</h2>

      {biome.guide?.notes.length ? (
        <section className={styles.section}>
          <h2>Notes</h2>
          <ul>
            {biome.guide.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {guide.bosses.map((b) => (
        <section key={b.id} className={styles.section}>
          <h2>Boss: {b.name}</h2>
          <dl className={styles.facts}>
            <dt>Health</dt>
            <dd>{b.health ?? 'unknown'}</dd>
            <dt>Summon with</dt>
            <dd>
              {b.summon.length ? (
                <ul className={styles.inline}>
                  {b.summon.map((s) => (
                    <li key={s.item}>
                      {s.qty} × <EntityLink id={s.item} />
                    </li>
                  ))}
                </ul>
              ) : (
                'unknown'
              )}
            </dd>
            <dt>Drops</dt>
            <dd>
              <ul className={styles.inline}>
                {b.drops.map((d) => (
                  <li key={d}>
                    <EntityLink id={d} />
                  </li>
                ))}
              </ul>
            </dd>
          </dl>
          <p className={styles.dim}>
            Boss page: <EntityLink id={b.id} />
          </p>
        </section>
      ))}

      <section className={styles.section}>
        <h2>Creatures here</h2>
        <p className={styles.dim}>Toughest first, by health.</p>
        <ul className={styles.inline}>
          {guide.creatures.map((c) => (
            <li key={c.id}>
              <EntityLink id={c.id} />
              <span className={styles.dim}> ({c.health ?? '?'} HP)</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2>Must keep</h2>
        <p className={styles.dim}>
          Hard to replace or needed soon.{' '}
          {guide.mustKeep.length > 0 &&
            `You have collected ${guide.mustKeep.length - mustKeepMissing} of ${guide.mustKeep.length} (profile ${profile.name}).`}
        </p>
        <ul className={styles.inline}>
          {guide.mustKeep.map((id) => (
            <li key={id}>
              {owned(id) ? '✓ ' : ''}
              <EntityLink id={id} />
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2>Other materials</h2>
        <ul className={styles.inline}>
          {guide.materials.map((id) => (
            <li key={id}>
              <EntityLink id={id} />
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2>Suggested gear</h2>
        <p className={styles.dim}>
          Highest armor per slot, top weapons by combined damage, best shields by block power. A
          simple measure from the data; proper rankings come in a later phase.
        </p>
        <dl className={styles.facts}>
          {guide.armor.map((a) => (
            <div key={a.slot} style={{ display: 'contents' }}>
              <dt>{label(a.slot)}</dt>
              <dd>
                <EntityLink id={a.item} />{' '}
                <span className={styles.dim}>(armor {num(a.armor)})</span>
              </dd>
            </div>
          ))}
          {guide.weapons.map((w) => (
            <div key={w.item} style={{ display: 'contents' }}>
              <dt>Weapon</dt>
              <dd>
                <EntityLink id={w.item} />{' '}
                <span className={styles.dim}>(damage {num(w.damage)})</span>
              </dd>
            </div>
          ))}
          {guide.shields.map((s) => (
            <div key={s.item} style={{ display: 'contents' }}>
              <dt>Shield</dt>
              <dd>
                <EntityLink id={s.item} />{' '}
                <span className={styles.dim}>(block {num(s.blockPower)})</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {guide.food.length > 0 && (
        <section className={styles.section}>
          <h2>Suggested food</h2>
          <p className={styles.dim}>Most health plus stamina in this biome.</p>
          <ul className={styles.inline}>
            {guide.food.map((f) => (
              <li key={f.item}>
                <EntityLink id={f.item} />
                <span className={styles.dim}>
                  {' '}
                  ({num(f.health)} HP, {num(f.stamina)} stamina)
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}
