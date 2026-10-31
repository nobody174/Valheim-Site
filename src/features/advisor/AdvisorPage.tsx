import { Link } from 'react-router';
import { Intro } from '../../components/Intro';
import { EntityIcon } from '../../components/EntityIcon';
import { EntityLink } from '../../components/EntityLink';
import { lookup } from '../../data/lookup';
import { useProfile } from '../../state/store';
import styles from '../items/Items.module.css';
import { useAdvice } from './useAdvice';

const name = (id: string) => lookup.item(id)?.name ?? id;
const LIMIT = 12;

function Item({ id }: { id: string }) {
  return (
    <span className={styles.nameCell}>
      <EntityIcon id={id} size={24} />
      <EntityLink id={id} />
    </span>
  );
}

/** What to craft, collect or fight next, from the checklist and inventory of the active profile. */
export function AdvisorPage() {
  const profile = useProfile();
  const advice = useAdvice();
  const boss = advice.boss;
  const zoneName =
    lookup.allBiomes().find((b) => b.order === advice.openZone)?.name ?? 'every zone';
  const empty = advice.craft.length === 0 && advice.collect.length === 0;

  return (
    <section>
      <h1>Next steps</h1>
      <Intro>
        <p>
          Suggestions from your checklist and inventory (profile {profile.name}). Tick what you have
          collected and crafted on the <Link to="/checklist">checklist</Link> and the advisor keeps
          up. It only suggests things you can do now, and only in zones up to {zoneName}.
        </p>
      </Intro>

      {boss && (
        <section className={styles.section}>
          <h2>
            Next boss: <EntityLink id={boss.boss} />
          </h2>
          {boss.needs.length === 0 ? (
            <p>The summon items for this boss are not in the data.</p>
          ) : (
            <>
              <p>
                {boss.needs.every((n) => n.status === 'enough')
                  ? 'You hold every summon item. Ready for the altar.'
                  : 'Summon items:'}
              </p>
              <ul>
                {boss.needs.map((n) => (
                  <li key={n.item}>
                    <Item id={n.item} />{' '}
                    {n.status === 'ticked' ? (
                      <span className={styles.dim}>
                        marked collected, amount not tracked (needs {n.need})
                      </span>
                    ) : (
                      <strong>
                        {n.have} / {n.need}
                      </strong>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {empty && (
        <p className={styles.empty}>
          Nothing to suggest yet. Tick items you have collected on the checklist, or add what you
          hold on the <Link to="/planner">planner</Link>, and suggestions appear here.
        </p>
      )}

      {advice.craft.length > 0 && (
        <section className={styles.section}>
          <h2>You can craft now</h2>
          <p className={styles.dim}>You have every ingredient, but have not marked it crafted.</p>
          <ul>
            {advice.craft.slice(0, LIMIT).map((c) => (
              <li key={c.item}>
                <Item id={c.item} />{' '}
                <span className={styles.dim}>
                  from {c.have.map(name).join(', ')}
                  {c.station && (
                    <>
                      {' '}
                      at <EntityLink id={c.station.id} />, level {c.station.level}
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
          {advice.craft.length > LIMIT && (
            <p className={styles.dim}>{advice.craft.length - LIMIT} more not shown.</p>
          )}
        </section>
      )}

      {advice.collect.length > 0 && (
        <section className={styles.section}>
          <h2>Worth collecting</h2>
          <p className={styles.dim}>
            Each is the only thing missing for something you could then craft.
          </p>
          <ul>
            {advice.collect.slice(0, LIMIT).map((c) => (
              <li key={c.item}>
                <Item id={c.item} />{' '}
                <span className={styles.dim}>
                  unlocks {c.unlocks.slice(0, 4).map(name).join(', ')}
                  {c.unlocks.length > 4 && ` and ${c.unlocks.length - 4} more`}
                </span>
              </li>
            ))}
          </ul>
          {advice.collect.length > LIMIT && (
            <p className={styles.dim}>{advice.collect.length - LIMIT} more not shown.</p>
          )}
        </section>
      )}
    </section>
  );
}
