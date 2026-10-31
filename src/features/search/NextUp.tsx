import { Link } from 'react-router';
import { EntityLink } from '../../components/EntityLink';
import { useAdvice } from '../advisor/useAdvice';
import styles from './Search.module.css';

/** The first things the advisor would say, so the answer to "what now?" is on the first screen. */
export function NextUp() {
  const advice = useAdvice();
  const craft = advice.craft[0];
  const collect = advice.collect[0];
  const boss = advice.boss;
  const short = boss?.needs.filter((n) => n.status !== 'enough') ?? [];
  if (!craft && !collect && !boss) return null;
  return (
    <section className={styles.nextUp} aria-label="Next up">
      <h2>Next up</h2>
      <ul>
        {craft && (
          <li>
            Craft <EntityLink id={craft.item} />
          </li>
        )}
        {collect && (
          <li>
            Collect <EntityLink id={collect.item} /> ({collect.unlocks.length}{' '}
            {collect.unlocks.length === 1 ? 'recipe opens' : 'recipes open'})
          </li>
        )}
        {boss && (
          <li>
            Next boss: <EntityLink id={boss.boss} />
            {short.length > 0 && (
              <>
                {' '}
                (still needs{' '}
                {short.map((n, i) => (
                  <span key={n.item}>
                    {i > 0 && ', '}
                    {n.status === 'ticked' ? '' : `${n.have} / `}
                    {n.need} <EntityLink id={n.item} />
                  </span>
                ))}
                )
              </>
            )}
          </li>
        )}
      </ul>
      <Link to="/next">All next steps</Link>
    </section>
  );
}
