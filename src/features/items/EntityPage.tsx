import { useParams } from 'react-router';
import { EntityLink } from '../../components/EntityLink';
import { VerifiedBadge } from '../../components/Badges';
import { lookup } from '../../data/lookup';
import type { Boss, Creature } from '../../data/schemas';
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

function MonsterPage({ monster, boss }: { monster: Creature | Boss; boss: boolean }) {
  const biome = lookup.biomeName(monster.biome);
  return (
    <article className={styles.page}>
      <h1>{monster.name}</h1>
      <div className={styles.badges}>
        <span className={styles.dim}>{boss ? 'Boss' : 'Creature'}</span>
        {biome && <span className={styles.dim}>· {biome}</span>}
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
          <h2>Summon with</h2>
          <ul className={styles.inline}>
            {monster.summonItems.map((s) => (
              <li key={s.item}>
                {s.qty} × <EntityLink id={s.item} />
              </li>
            ))}
          </ul>
        </section>
      )}
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

export function StationPage() {
  const { id = '' } = useParams();
  const station = lookup.station(id);
  if (!station) return <NotFound what="station" id={id} />;
  const recipes = lookup.recipesAt(id);
  return (
    <article className={styles.page}>
      <h1>{station.name}</h1>
      <div className={styles.badges}>
        <span className={styles.dim}>Crafting station</span>
        <VerifiedBadge level={station.verified} note={station.note} />
      </div>
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
