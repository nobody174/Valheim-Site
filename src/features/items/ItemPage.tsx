import { useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { EntityLink } from '../../components/EntityLink';
import { GuideTag, HoardBadge, VerifiedBadge } from '../../components/Badges';
import { EntityIcon } from '../../components/EntityIcon';
import { graph, lookup } from '../../data/lookup';
import { skillLabel } from '../../data/skills';
import { effectiveHoard } from '../../state/model';
import { pushRecent } from '../../state/recent';
import { useProfile } from '../../state/store';
import { ItemActions } from './ItemActions';
import { RecipeBlock } from './RecipeBlock';
import styles from './Items.module.css';

const num = (n: number) => String(Math.round(n * 100) / 100);
const percent = (n: number) => `${n > 0 ? '+' : ''}${Math.round(n * 100)}%`;
const label = (key: string) => key.charAt(0).toUpperCase() + key.slice(1);

function DamageList({ damage }: { damage: Record<string, number> }) {
  const entries = Object.entries(damage);
  if (entries.length === 0) return <>none</>;
  return <>{entries.map(([k, v]) => `${label(k)} ${num(v)}`).join(', ')}</>;
}

function Stats({ id }: { id: string }) {
  const weapon = lookup.weapon(id);
  const armor = lookup.armor(id);
  const food = lookup.food(id);
  const trophy = lookup.trophy(id);
  if (!weapon && !armor && !food && !trophy) return null;
  return (
    <section className={styles.section}>
      <h2>Stats</h2>
      <dl className={styles.facts}>
        {weapon && (
          <>
            <dt>Skill</dt>
            <dd>
              <Link to="/skills">{skillLabel(weapon.skill)}</Link>
            </dd>
            <dt>Damage</dt>
            <dd>
              <DamageList damage={weapon.damage} />
            </dd>
            {weapon.damagePerLevel && (
              <>
                <dt>Per upgrade level</dt>
                <dd>
                  <DamageList damage={weapon.damagePerLevel} />
                </dd>
              </>
            )}
            {weapon.blockPower !== undefined && (
              <>
                <dt>Block power</dt>
                <dd>{num(weapon.blockPower)}</dd>
              </>
            )}
            {weapon.parryForce !== undefined && (
              <>
                <dt>Parry force</dt>
                <dd>{num(weapon.parryForce)}</dd>
              </>
            )}
            {weapon.knockback !== undefined && (
              <>
                <dt>Knockback</dt>
                <dd>{num(weapon.knockback)}</dd>
              </>
            )}
            {weapon.durability !== undefined && (
              <>
                <dt>Durability</dt>
                <dd>{num(weapon.durability)}</dd>
              </>
            )}
            {weapon.maxQuality !== undefined && (
              <>
                <dt>Max upgrade quality</dt>
                <dd>{weapon.maxQuality}</dd>
              </>
            )}
          </>
        )}
        {armor && (
          <>
            <dt>Slot</dt>
            <dd>{label(armor.slot)}</dd>
            <dt>Armor</dt>
            <dd>{num(armor.armor)}</dd>
            {armor.durability !== undefined && (
              <>
                <dt>Durability</dt>
                <dd>{num(armor.durability)}</dd>
              </>
            )}
            {armor.movementModifier !== undefined && (
              <>
                <dt>Movement speed</dt>
                <dd>{percent(armor.movementModifier)}</dd>
              </>
            )}
            {armor.maxQuality !== undefined && (
              <>
                <dt>Max upgrade quality</dt>
                <dd>{armor.maxQuality}</dd>
              </>
            )}
            {armor.setName && (
              <>
                <dt>Set bonus</dt>
                <dd>
                  {armor.setSize ? `${armor.setSize} pieces: ` : ''}
                  {armor.setEffect ?? 'unknown effect'}
                </dd>
              </>
            )}
          </>
        )}
        {food && (
          <>
            {food.health !== undefined && (
              <>
                <dt>Health</dt>
                <dd>{num(food.health)}</dd>
              </>
            )}
            {food.stamina !== undefined && (
              <>
                <dt>Stamina</dt>
                <dd>{num(food.stamina)}</dd>
              </>
            )}
            {food.durationSec !== undefined && (
              <>
                <dt>Duration</dt>
                <dd>{num(food.durationSec / 60)} min</dd>
              </>
            )}
            {food.effect && (
              <>
                <dt>Effect</dt>
                <dd>{food.effect}</dd>
              </>
            )}
          </>
        )}
        {trophy && (
          <>
            <dt>Trophy of</dt>
            <dd>
              <EntityLink id={trophy.creature} />
            </dd>
          </>
        )}
      </dl>
    </section>
  );
}

function WhereFound({ id }: { id: string }) {
  const sources = graph.obtainedFrom(id).filter((s) => s.type !== 'recipe');
  const summons = lookup.summonsFor(id);
  if (sources.length === 0 && summons.length === 0) return null;
  return (
    <section className={styles.section}>
      <h2>Where found</h2>
      <ul>
        {sources.map((s, i) => {
          if (s.type === 'gather')
            return (
              <li key={i}>
                Gathered from: {s.node} <GuideTag />
              </li>
            );
          if (s.type === 'other')
            return (
              <li key={i}>
                {s.note} <GuideTag />
              </li>
            );
          if (s.type === 'trader')
            return (
              <li key={i}>
                Bought from: {s.note} <GuideTag />
              </li>
            );
          if (s.type === 'found')
            return (
              <li key={i}>
                Found: {s.note} <GuideTag />
              </li>
            );
          if (s.type === 'drop') {
            const monster = lookup.creature(s.creature) ?? lookup.boss(s.creature);
            const drop = monster?.drops.find((d) => d.item === id);
            const amount = drop
              ? drop.min === drop.max
                ? `${drop.min}`
                : `${drop.min}–${drop.max}`
              : '';
            const chance =
              drop?.chance !== undefined ? `, ${Math.round(drop.chance * 100)}% chance` : '';
            return (
              <li key={i}>
                Dropped by <EntityLink id={s.creature} />
                {amount && (
                  <span className={styles.dim}>
                    {' '}
                    ({amount}
                    {chance})
                  </span>
                )}
              </li>
            );
          }
          return null;
        })}
        {summons.map((b) => (
          <li key={b.id}>
            Used to summon <EntityLink id={b.id} /> {b.summonFromFiles ? null : <GuideTag />}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ItemPage() {
  const { id = '' } = useParams();
  const item = lookup.item(id);
  const profile = useProfile();

  useEffect(() => {
    if (item) pushRecent(item.id);
  }, [item]);

  if (!item) {
    return (
      <section className={styles.page}>
        <h1>Unknown item</h1>
        <p>No item with id &quot;{id}&quot;.</p>
      </section>
    );
  }

  const craftedFrom = graph.recipesFor(id);
  const usedIn = graph.usedIn(id);
  const canCraft = [...new Set(usedIn.map((r) => r.output.item))];
  const biome = lookup.biomeName(item.biome);

  return (
    <article className={styles.page} data-zone={item.biome ?? undefined}>
      <header className={styles.title}>
        <span className={styles.iconFrame}>
          <EntityIcon id={item.id} size={64} />
        </span>
        <div>
          <h1>{item.name}</h1>
          <div className={styles.badges}>
            <span className={styles.dim}>{label(item.category)}</span>
            {biome && <span className={styles.zoneTag}>{biome}</span>}
            <HoardBadge
              hoard={effectiveHoard(item, profile)}
              qty={item.recommendedQty}
              custom={item.id in profile.hoardOverrides}
            />
            <VerifiedBadge level={item.verified} note={item.note} />
          </div>
        </div>
      </header>

      {item.verified === 'unverified' && (
        <p className={styles.warn}>
          Unverified: {item.note ?? 'not yet checked against the game.'}
        </p>
      )}

      {item.description && <p className={styles.dim}>{item.description}</p>}
      {item.use && (
        <section className={styles.section}>
          <h2>What to do with it</h2>
          <p>{item.use}</p>
          <p className={styles.dim}>Guide, not checked in game.</p>
        </section>
      )}

      <WhereFound id={id} />

      <p className={styles.tools}>
        {craftedFrom.length > 0 && <Link to={`/planner?add=${id}`}>Plan this</Link>}
        {craftedFrom.some((r) => r.upgrades.length > 0) && (
          <Link to={`/upgrades?item=${id}`}>Upgrade calculator</Link>
        )}
        <Link to={`/graph?item=${id}`}>Crafting graph</Link>
        {(lookup.weapon(id) || lookup.armor(id)) && (
          <Link to={`/compare?items=${id}`}>Compare</Link>
        )}
      </p>

      {craftedFrom.length > 0 && (
        <section className={styles.section}>
          <h2>Crafted from</h2>
          {craftedFrom.map((r) => (
            <RecipeBlock key={r.id} recipe={r} />
          ))}
        </section>
      )}

      {usedIn.length > 0 && (
        <section className={styles.section}>
          <h2>Used in</h2>
          {usedIn.map((r) => (
            <RecipeBlock key={r.id} recipe={r} />
          ))}
        </section>
      )}

      {canCraft.length > 0 && (
        <section className={styles.section}>
          <h2>Can craft into</h2>
          <ul className={styles.inline}>
            {canCraft.map((c) => (
              <li key={c}>
                <EntityLink id={c} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {item.portalBlocked && (
        <p className={styles.dimNote} role="note">
          A portal will not let you through while you carry this. See <Link to="/portals">My portals</Link>.
        </p>
      )}

      <Stats id={id} />

      <ItemActions item={item} />

      <details className={styles.section}>
        <summary>Details</summary>
        <dl className={styles.facts}>
          <dt>Weight</dt>
          <dd>{item.weight === null ? 'unknown' : num(item.weight)}</dd>
          <dt>Stack size</dt>
          <dd>{item.stackSize === null ? 'unknown' : item.stackSize}</dd>
          {item.tags.length > 0 && (
            <>
              <dt>Tags</dt>
              <dd>{item.tags.join(', ')}</dd>
            </>
          )}
          <dt>Internal id</dt>
          <dd>{item.id}</dd>
          {item.hoardNote && (
            <>
              <dt>Hoard note</dt>
              <dd>{item.hoardNote}</dd>
            </>
          )}
        </dl>
      </details>
    </article>
  );
}
